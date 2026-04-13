from fastapi import FastAPI, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from typing import Optional

from models import TaskStatus, SLAStatus, ChatMessage, Role, Employee
from mock_data import (
    employees, templates, onboardings, all_tasks,
    knowledge_docs, chat_history,
)
from ai_client import chat_with_context, search_knowledge_with_ai
from config import settings

app = FastAPI(title="Onboarding Orchestrator API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_emp_map = {e.id: e for e in employees}


def _get_current_user(request: Request) -> Optional[Employee]:
    user_id = request.headers.get("x-user-id")
    return _emp_map.get(user_id) if user_id else None


def _is_hr(emp: Optional[Employee]) -> bool:
    return emp is not None and emp.role == Role.HR


def _newcomer_department(newcomer_id: str) -> str:
    e = _emp_map.get(newcomer_id)
    return e.department if e else ""


def _filter_tasks_for_user(tasks, emp: Optional[Employee]):
    if not emp or _is_hr(emp):
        return tasks
    if emp.role == Role.MANAGER:
        return [t for t in tasks if _newcomer_department(t.newcomer_id) == emp.department]
    return [t for t in tasks if t.assigned_to == emp.id or t.newcomer_id == emp.id]


def _filter_onboardings_for_user(obs, emp: Optional[Employee]):
    if not emp or _is_hr(emp):
        return obs
    if emp.role == Role.MANAGER:
        return [o for o in obs if _newcomer_department(o.newcomer_id) == emp.department]
    return [o for o in obs if o.newcomer_id == emp.id or any(t.assigned_to == emp.id for t in o.tasks)]


# ── Dashboard ──────────────────────────────────────────────

@app.get("/api/dashboard")
def get_dashboard(request: Request):
    emp = _get_current_user(request)
    user_tasks = _filter_tasks_for_user(all_tasks, emp)
    user_onboardings = _filter_onboardings_for_user(onboardings, emp)

    total = len(user_tasks)
    completed = sum(1 for t in user_tasks if t.status == TaskStatus.COMPLETED)
    in_progress = sum(1 for t in user_tasks if t.status == TaskStatus.IN_PROGRESS)
    overdue = sum(1 for t in user_tasks if t.status == TaskStatus.OVERDUE)
    waiting = sum(1 for t in user_tasks if t.status == TaskStatus.WAITING)

    sla_green = sum(1 for t in user_tasks if t.sla_status == SLAStatus.GREEN)
    sla_yellow = sum(1 for t in user_tasks if t.sla_status == SLAStatus.YELLOW)
    sla_red = sum(1 for t in user_tasks if t.sla_status == SLAStatus.RED)

    active_onboardings = [
        {
            "id": o.id,
            "newcomer_name": o.newcomer_name,
            "template_role": o.template_role,
            "start_date": o.start_date.isoformat(),
            "current_stage": o.current_stage,
            "progress": o.progress,
            "total_tasks": len(o.tasks),
            "completed_tasks": sum(1 for t in o.tasks if t.status == TaskStatus.COMPLETED),
            "overdue_tasks": sum(1 for t in o.tasks if t.status == TaskStatus.OVERDUE),
        }
        for o in user_onboardings
    ]

    return {
        "stats": {
            "active_onboardings": len(user_onboardings),
            "total_tasks": total,
            "completed": completed,
            "in_progress": in_progress,
            "overdue": overdue,
            "waiting": waiting,
        },
        "sla": {"green": sla_green, "yellow": sla_yellow, "red": sla_red},
        "onboardings": active_onboardings,
    }


# ── Templates ──────────────────────────────────────────────

@app.get("/api/templates")
def get_templates():
    return [t.model_dump() for t in templates]


@app.get("/api/templates/{template_id}")
def get_template(template_id: str):
    for t in templates:
        if t.id == template_id:
            return t.model_dump()
    return {"error": "Template not found"}


# ── Onboardings ────────────────────────────────────────────

@app.get("/api/onboardings")
def get_onboardings(request: Request):
    emp = _get_current_user(request)
    filtered = _filter_onboardings_for_user(onboardings, emp)
    return [o.model_dump() for o in filtered]


@app.get("/api/onboardings/{onboarding_id}")
def get_onboarding(onboarding_id: str):
    for o in onboardings:
        if o.id == onboarding_id:
            return o.model_dump()
    return {"error": "Onboarding not found"}


# ── Tasks ──────────────────────────────────────────────────

@app.get("/api/tasks")
def get_tasks(
    request: Request,
    assigned_to: str | None = Query(None),
    status: TaskStatus | None = Query(None),
    newcomer_id: str | None = Query(None),
):
    emp = _get_current_user(request)
    result = _filter_tasks_for_user(all_tasks, emp)
    if assigned_to:
        result = [t for t in result if t.assigned_to == assigned_to]
    if status:
        result = [t for t in result if t.status == status]
    if newcomer_id:
        result = [t for t in result if t.newcomer_id == newcomer_id]
    return [t.model_dump() for t in result]


@app.patch("/api/tasks/{task_id}/status")
def update_task_status(task_id: str, new_status: TaskStatus):
    for t in all_tasks:
        if t.id == task_id:
            t.status = new_status
            if new_status == TaskStatus.COMPLETED:
                t.sla_status = SLAStatus.GREEN
            return t.model_dump()
    return {"error": "Task not found"}


# ── Employees ──────────────────────────────────────────────

@app.get("/api/employees")
def get_employees():
    return [e.model_dump() for e in employees]


@app.get("/api/me")
def get_me(request: Request):
    emp = _get_current_user(request)
    if not emp:
        return {"error": "No user"}
    return emp.model_dump()


# ── Knowledge base ─────────────────────────────────────────

def _build_knowledge_context() -> str:
    parts = []
    for d in knowledge_docs:
        parts.append(f"### {d.title} (категория: {d.category})\n{d.content.strip()}")
    return "\n\n---\n\n".join(parts)


@app.get("/api/knowledge")
def get_knowledge(q: str | None = Query(None)):
    if not q:
        return [{"id": d.id, "title": d.title, "category": d.category, "uploaded_by": d.uploaded_by, "uploaded_at": d.uploaded_at.isoformat()} for d in knowledge_docs]

    q_lower = q.lower()
    results = []
    for d in knowledge_docs:
        if q_lower in d.title.lower() or q_lower in d.content.lower():
            lines = d.content.strip().split("\n")
            relevant = [l.strip() for l in lines if q_lower in l.lower()]
            snippet = "\n".join(relevant[:5]) if relevant else lines[0]
            results.append({
                "id": d.id,
                "title": d.title,
                "category": d.category,
                "snippet": snippet,
                "source": d.title,
            })

    if settings.gateway_token and not results:
        ai_answer = search_knowledge_with_ai(q, _build_knowledge_context())
        results.append({
            "id": "ai-answer",
            "title": "AI-ответ по базе знаний",
            "category": "AI",
            "snippet": ai_answer,
            "source": "AI-анализ документов",
        })

    return results


@app.get("/api/knowledge/{doc_id}")
def get_document(doc_id: str):
    for d in knowledge_docs:
        if d.id == doc_id:
            return d.model_dump()
    return {"error": "Document not found"}


@app.post("/api/knowledge/ask")
def ask_knowledge(body: dict):
    query = body.get("query", "").strip()
    if not query:
        return {"answer": "Пожалуйста, задайте вопрос."}

    if not settings.gateway_token:
        return {"answer": "AI недоступен: токен не настроен. Обратитесь к HR."}

    context = _build_knowledge_context()
    answer = search_knowledge_with_ai(query, context)
    return {"answer": answer}


# ── Chatbot ────────────────────────────────────────────────

def _fmt_task(t) -> str:
    """Format task for AI context with ID for linking."""
    return f"  - TASK_ID={t.id} title=\"{t.title}\" deadline={t.deadline} assignee=\"{t.assigned_to_name}\" stage=\"{t.stage_name}\""


def _fmt_onb(o) -> str:
    """Format onboarding for AI context with ID for linking."""
    o_overdue = sum(1 for t in o.tasks if t.status == TaskStatus.OVERDUE)
    o_done = sum(1 for t in o.tasks if t.status == TaskStatus.COMPLETED)
    return (f"  - ONB_ID={o.id} name=\"{o.newcomer_name}\" role=\"{o.template_role}\" "
            f"progress={o.progress}% stage=\"{o.current_stage}\" tasks={o_done}/{len(o.tasks)}"
            + (f" OVERDUE={o_overdue}" if o_overdue else ""))


def _build_user_context(emp: Optional[Employee]) -> str:
    if not emp:
        return ""

    lines = [
        f"user: {emp.full_name} | role: {emp.role.value} | dept: {emp.department}",
        "",
        "LINK FORMAT REMINDER: use [Title](task:TASK_ID) and [Name](onboarding:ONB_ID)",
    ]

    if emp.role == Role.NEWCOMER:
        for o in onboardings:
            if o.newcomer_id == emp.id:
                pending = [t for t in o.tasks if t.status in (TaskStatus.WAITING, TaskStatus.IN_PROGRESS)]
                overdue = [t for t in o.tasks if t.status == TaskStatus.OVERDUE]
                completed = [t for t in o.tasks if t.status == TaskStatus.COMPLETED]
                lines.append(f"\nONBOARDING: ONB_ID={o.id} role={o.template_role} stage=\"{o.current_stage}\" progress={o.progress}% ({len(completed)}/{len(o.tasks)})")
                if overdue:
                    lines.append(f"\nOVERDUE ({len(overdue)}):")
                    for t in overdue:
                        lines.append(_fmt_task(t))
                if pending:
                    lines.append(f"\nIN_PROGRESS ({len(pending)}):")
                    for t in pending:
                        lines.append(_fmt_task(t))
                break

    elif _is_hr(emp):
        total = len(all_tasks)
        done = sum(1 for t in all_tasks if t.status == TaskStatus.COMPLETED)
        overdue_tasks = [t for t in all_tasks if t.status == TaskStatus.OVERDUE]
        lines.append(f"\nSTATS: {len(onboardings)} onboardings, {total} tasks, {done} done, {len(overdue_tasks)} overdue")

        lines.append(f"\nONBOARDINGS:")
        for o in onboardings:
            lines.append(_fmt_onb(o))

        if overdue_tasks:
            lines.append(f"\nALL OVERDUE TASKS ({len(overdue_tasks)}):")
            for t in overdue_tasks:
                lines.append(f"  - TASK_ID={t.id} title=\"{t.title}\" newcomer=\"{t.newcomer_name}\" ONB_ID={t.onboarding_id} deadline={t.deadline} assignee=\"{t.assigned_to_name}\"")

        my_tasks = [t for t in all_tasks if t.assigned_to == emp.id]
        my_pending = [t for t in my_tasks if t.status in (TaskStatus.WAITING, TaskStatus.IN_PROGRESS)]
        my_overdue = [t for t in my_tasks if t.status == TaskStatus.OVERDUE]
        if my_pending or my_overdue:
            lines.append(f"\nMY TASKS ({len(my_tasks)} total, {len(my_pending)} active, {len(my_overdue)} overdue):")
            for t in (my_overdue + my_pending):
                lines.append(f"  - TASK_ID={t.id} title=\"{t.title}\" newcomer=\"{t.newcomer_name}\" ONB_ID={t.onboarding_id} deadline={t.deadline} status={t.status.value}")

    elif emp.role == Role.MANAGER:
        dept = emp.department
        dept_onbs = [o for o in onboardings if _newcomer_department(o.newcomer_id) == dept]
        my_tasks = [t for t in all_tasks if t.assigned_to == emp.id]
        my_pending = [t for t in my_tasks if t.status in (TaskStatus.WAITING, TaskStatus.IN_PROGRESS)]
        my_overdue = [t for t in my_tasks if t.status == TaskStatus.OVERDUE]

        lines.append(f"\nDEPT ONBOARDINGS ({len(dept_onbs)}):")
        for o in dept_onbs:
            lines.append(_fmt_onb(o))

        if my_pending or my_overdue:
            lines.append(f"\nMY TASKS ({len(my_tasks)} total, {len(my_overdue)} overdue):")
            for t in (my_overdue + my_pending):
                lines.append(f"  - TASK_ID={t.id} title=\"{t.title}\" newcomer=\"{t.newcomer_name}\" ONB_ID={t.onboarding_id} deadline={t.deadline} status={t.status.value}")

    else:  # IT, Mentor
        my_tasks = [t for t in all_tasks if t.assigned_to == emp.id]
        my_pending = [t for t in my_tasks if t.status in (TaskStatus.WAITING, TaskStatus.IN_PROGRESS)]
        my_overdue = [t for t in my_tasks if t.status == TaskStatus.OVERDUE]
        my_done = [t for t in my_tasks if t.status == TaskStatus.COMPLETED]

        lines.append(f"\nMY TASKS ({len(my_tasks)} total, {len(my_done)} done, {len(my_pending)} active, {len(my_overdue)} overdue):")
        for t in (my_overdue + my_pending):
            lines.append(f"  - TASK_ID={t.id} title=\"{t.title}\" newcomer=\"{t.newcomer_name}\" ONB_ID={t.onboarding_id} deadline={t.deadline} status={t.status.value}")

        if emp.role == Role.MENTOR:
            my_newcomer_ids = set(t.newcomer_id for t in my_tasks)
            my_onbs = [o for o in onboardings if o.newcomer_id in my_newcomer_ids]
            if my_onbs:
                lines.append(f"\nMY NEWCOMERS:")
                for o in my_onbs:
                    lines.append(_fmt_onb(o))

    return "\n".join(lines)


@app.post("/api/chat")
def chat(request: Request, message: dict):
    user_text = message.get("message", "").strip()
    chat_history.append(ChatMessage(role="user", content=user_text, timestamp=datetime.now()))

    emp = _get_current_user(request)

    if settings.gateway_token:
        user_ctx = _build_user_context(emp)
        knowledge_ctx = _build_knowledge_context()
        response = chat_with_context(user_text, user_ctx, knowledge_ctx)
    else:
        response = _mock_chat_response(user_text, emp)

    chat_history.append(ChatMessage(role="assistant", content=response, timestamp=datetime.now()))
    return {"response": response}


def _mock_chat_response(user_text: str, emp: Optional[Employee] = None) -> str:
    user_lower = user_text.lower()

    # --- Задачи (контекстный ответ) ---
    if any(kw in user_lower for kw in ["задач", "что делать", "что мне", "мои дела", "нужно сделать", "to do"]):
        return _mock_tasks_answer(emp)

    # --- Просрочки ---
    if any(kw in user_lower for kw in ["просрочен", "overdue", "опоздан", "дедлайн"]):
        return _mock_overdue_answer(emp)

    # --- Онбординг / прогресс ---
    if any(kw in user_lower for kw in ["прогресс", "онбординг", "как дела", "статус", "этап"]):
        return _mock_progress_answer(emp)

    STATIC_RESPONSES = {
        "привет": "Привет! 👋 Я ваш AI-помощник по онбордингу.\n\nЯ могу помочь с:\n- **Задачами** — расскажу что нужно сделать\n- **Прогрессом** — покажу статус онбордингов\n- **Документами** — найду информацию в [Базе знаний](/knowledge)\n- **Процессами** — объясню как всё устроено\n\nПросто спросите!",
        "график": "## Рабочий график\n\n| | |\n|---|---|\n| **Рабочие дни** | Пн — Пт |\n| **Часы** | 09:00 — 18:00 |\n| **Гибкое начало** | 08:00 — 10:00 |\n| **Обед** | 1 час (12:00 — 14:00) |\n| **Удалёнка** | До 2 дней в неделю |\n\nПодробнее об удалённой работе — в [Базе знаний](/knowledge) (документ «Политика удалённой работы»).\n\n> 📄 Источник: Правила внутреннего трудового распорядка (ПВТР)",
        "vpn": "## Настройка VPN\n\n1. Обратитесь в IT: **Дмитрий Козлов** (dmitry@company.ru) или **Артём Черных** (artem@company.ru)\n2. VPN **обязателен** при работе вне офиса\n3. Настройка — в первый рабочий день\n\n> 📄 Источник: [База знаний](/knowledge) — ЛНА «Информационная безопасность»",
        "доступ": "## Как получить доступы\n\n1. Все запросы — через **Jira Service Desk** (sd.company.ru)\n2. Категория: «Запрос доступа»\n3. Укажите: систему, тип доступа, обоснование\n4. Согласование: руководитель → IT\n\n**Стандартные доступы** (день 1): AD, почта, Slack, Jira, Confluence, VPN\n\n**Сроки:** стандартные — 1 день, доп. — до 3 дней, production — до 5 дней\n\n> 📄 Источник: [База знаний](/knowledge) — СОП «Запрос и получение доступов»",
        "git": "## Работа с Git\n\n- **Репозиторий:** GitLab (gitlab.company.ru)\n- **Ветвление:** Git Flow (`feature/`, `bugfix/`, `release/`)\n- **Code review:** минимум **2 approve** для merge в main\n- **CI/CD:** GitLab CI — staging автоматически, production через MR\n\n> 📄 Источник: [База знаний](/knowledge) — Гайд по инструментам разработки",
        "отпуск": "## Отпуска и больничные\n\n| | |\n|---|---|\n| **Ежегодный отпуск** | 28 дней |\n| **Заявление** | За 14 дней |\n| **Больничный** | С первого дня |\n\nОформление через HR-портал. Уведомите руководителя!\n\n> 📄 Источник: [База знаний](/knowledge) — ПВТР",
        "crm": "## CRM Bitrix24\n\n- **Вход:** crm.company.ru (SSO)\n- **Воронка:** Лид → Квалификация → Демо → КП → Переговоры → Закрытие\n- **KPI:** конверсия > 15%\n- **Правила:** все звонки в CRM, комментарии обязательны\n\n> 📄 Источник: [База знаний](/knowledge) — Гайд по CRM Bitrix24",
        "figma": "## Дизайн-система UI Kit v3\n\n- **Библиотека:** figma.com/company-ui-kit-v3\n- **Цвета:** Primary #6366F1, Secondary #A855F7\n- **Шрифт:** Inter, 400-800\n- **Иконки:** Lucide Icons\n- Все макеты — **только на основе UI Kit**\n\n> 📄 Источник: [База знаний](/knowledge) — Дизайн-система UI Kit v3",
        "дмс": "## ДМС и компенсации\n\n**ДМС** (после испытательного срока):\n- Страховая: «Ингосстрах»\n- Покрытие: амбулаторное, стоматология, госпитализация\n- Для сотрудника: **бесплатно**\n\n**Компенсации:**\n- 🍽️ Обеды: 500 руб/день\n- 🏋️ Спорт: до 5 000 руб/мес\n- 📚 Обучение: до 50 000 руб/квартал\n- 🇬🇧 Английский: 2 раза в неделю\n\n> 📄 Источник: [База знаний](/knowledge) — Гайд по ДМС и компенсациям",
        "jira": "## Работа с Jira\n\n**Доступ:** jira.company.ru (SSO)\n\n**Workflow:** Backlog → To Do → In Progress → Code Review → QA → Done\n\n**Правила:**\n- Описание + критерии приёмки обязательны\n- Оценка в story points (Фибоначчи)\n- Логирование времени обязательно\n\n> 📄 Источник: [База знаний](/knowledge) — Гайд по работе с Jira",
        "встреч": "## Командные встречи\n\n| Встреча | Когда | Длительность |\n|---------|-------|-------|\n| **Daily standup** | Ежедневно, 10:00 | 15 мин |\n| **Sprint planning** | Понедельник | 1 час |\n| **Sprint demo** | Пятница | 30 мин |\n| **Ретро** | Раз в 2 недели | 1 час |\n| **1-на-1** | Еженедельно | 30 мин |\n| **All-hands** | 1-й понедельник месяца | 1 час |\n\n> 📄 Источник: [База знаний](/knowledge) — СОП «Встречи и командные ритуалы»",
        "slack": "## Коммуникации в Slack\n\n**Каналы:**\n- `#general` — объявления\n- `#dev` / `#marketing` / `#sales` / `#design` — отделы\n- `#security` — инциденты\n- `#helpdesk` — IT-запросы\n- `#random` — неформальное\n\n**Правила:** ответ в течение **2 часов**, статус при уходе/удалёнке.\n\n> 📄 Источник: [База знаний](/knowledge) — Гайд по корпоративным коммуникациям",
        "безопасност": "## Информационная безопасность\n\n- 🔐 **2FA** обязательна для всех систем\n- 🔑 Пароли: мин. 12 символов, смена каждые 90 дней\n- 📡 **VPN** обязателен вне офиса\n- 🚨 Инциденты: security@company.ru или `#security` в Slack\n\n> 📄 Источник: [База знаний](/knowledge) — ЛНА «Информационная безопасность»",
        "удалён": "## Удалённая работа\n\n- До **2 дней в неделю** по согласованию\n- Согласование за **1 день**\n- Доступность: **10:00 — 17:00**\n- VPN обязателен\n- Ответ в Slack — в течение **30 минут**\n\n**Полная удалёнка** — доп. соглашение + компенсация 5 000 руб/мес.\n\n> 📄 Источник: [База знаний](/knowledge) — ЛНА «Политика удалённой работы»",
    }

    for key, val in STATIC_RESPONSES.items():
        if key in user_lower:
            return val

    return ("Я пока работаю в демо-режиме (AI-модель не подключена). "
            "Могу ответить на вопросы о:\n\n"
            "- **Задачах** — «что мне нужно сделать?»\n"
            "- **Прогрессе** — «какой у меня прогресс?»\n"
            "- **Процессах** — график, VPN, доступы, Git, Jira, Slack\n"
            "- **Компенсациях** — ДМС, обеды, спорт, обучение\n"
            "- **Встречах** — стендапы, ретро, 1-на-1\n\n"
            "Или загляните в [Базу знаний](/knowledge) — там 15 документов.\n\n"
            "Для подключения AI настройте `GATEWAY_TOKEN` в `.env` файле.")


def _task_link(t) -> str:
    """Generate a special task link: [Title](task:task-id)"""
    return f"[{t.title}](task:{t.id})"


def _onb_link(o) -> str:
    """Generate onboarding link: [Name](onboarding:onb-id)"""
    return f"[{o.newcomer_name}](onboarding:{o.id})"


def _mock_tasks_answer(emp: Optional[Employee]) -> str:
    if not emp:
        return "Не удалось определить пользователя."

    if emp.role == Role.NEWCOMER:
        for o in onboardings:
            if o.newcomer_id == emp.id:
                pending = [t for t in o.tasks if t.status in (TaskStatus.WAITING, TaskStatus.IN_PROGRESS)]
                overdue = [t for t in o.tasks if t.status == TaskStatus.OVERDUE]
                completed = [t for t in o.tasks if t.status == TaskStatus.COMPLETED]
                lines = [f"**{o.current_stage}** · {o.progress}% · {len(completed)}/{len(o.tasks)} задач\n"]
                if overdue:
                    lines.append(f"⚠️ **Просрочено ({len(overdue)}):**")
                    for t in overdue:
                        lines.append(f"- {_task_link(t)} — до {t.deadline}")
                if pending:
                    lines.append(f"\n🔄 **В работе ({len(pending)}):**")
                    for t in pending:
                        lines.append(f"- {_task_link(t)} — до {t.deadline}, отв. {t.assigned_to_name}")
                return "\n".join(lines)
        return "Активный онбординг не найден."

    my_tasks = [t for t in all_tasks if t.assigned_to == emp.id]
    if not my_tasks:
        return "У вас нет назначенных задач. ✅"

    my_pending = [t for t in my_tasks if t.status in (TaskStatus.WAITING, TaskStatus.IN_PROGRESS)]
    my_overdue = [t for t in my_tasks if t.status == TaskStatus.OVERDUE]
    my_completed = [t for t in my_tasks if t.status == TaskStatus.COMPLETED]

    lines = [f"**{len(my_completed)}** выполнено · **{len(my_pending)}** в работе · **{len(my_overdue)}** просрочено\n"]

    if my_overdue:
        lines.append(f"⚠️ **Просрочено:**")
        for t in my_overdue:
            lines.append(f"- {_task_link(t)} → {_onb_link(_find_onb(t.onboarding_id))} · до {t.deadline}")

    if my_pending:
        lines.append(f"\n🔄 **В работе:**")
        for t in my_pending[:8]:
            lines.append(f"- {_task_link(t)} → {_onb_link(_find_onb(t.onboarding_id))} · до {t.deadline}")
        if len(my_pending) > 8:
            lines.append(f"- ...и ещё {len(my_pending) - 8} задач → [Доска задач](/tasks)")

    return "\n".join(lines)


def _mock_overdue_answer(emp: Optional[Employee]) -> str:
    if not emp:
        return "Не удалось определить пользователя."

    if _is_hr(emp):
        overdue = [t for t in all_tasks if t.status == TaskStatus.OVERDUE]
        if not overdue:
            return "✅ Просроченных задач нет."
        lines = [f"⚠️ **{len(overdue)} просроченных задач:**\n"]
        for t in overdue:
            lines.append(f"- {_task_link(t)} → {_onb_link(_find_onb(t.onboarding_id))} · отв. **{t.assigned_to_name}** · до {t.deadline}")
        lines.append(f"\nОбновить статусы → [Доска задач](/tasks)")
        return "\n".join(lines)

    my_overdue = [t for t in all_tasks if t.assigned_to == emp.id and t.status == TaskStatus.OVERDUE]
    if not my_overdue:
        return "✅ У вас нет просроченных задач."
    lines = [f"⚠️ **{len(my_overdue)} просроченных:**\n"]
    for t in my_overdue:
        lines.append(f"- {_task_link(t)} → {_onb_link(_find_onb(t.onboarding_id))} · до {t.deadline}")
    return "\n".join(lines)


def _mock_progress_answer(emp: Optional[Employee]) -> str:
    if not emp:
        return "Не удалось определить пользователя."

    if emp.role == Role.NEWCOMER:
        for o in onboardings:
            if o.newcomer_id == emp.id:
                completed = sum(1 for t in o.tasks if t.status == TaskStatus.COMPLETED)
                overdue = sum(1 for t in o.tasks if t.status == TaskStatus.OVERDUE)
                status = "⚠️" if overdue else "✅"
                return (
                    f"**{o.progress}%** · {completed}/{len(o.tasks)} задач · этап «{o.current_stage}»\n\n"
                    f"{status} {'Просрочено: ' + str(overdue) + ' задач' if overdue else 'Всё по плану'}\n\n"
                    f"Подробнее → [Мой онбординг](/onboardings/{o.id})"
                )
        return "Активный онбординг не найден."

    if _is_hr(emp):
        total = len(all_tasks)
        done = sum(1 for t in all_tasks if t.status == TaskStatus.COMPLETED)
        overdue = sum(1 for t in all_tasks if t.status == TaskStatus.OVERDUE)
        pct = round(done / total * 100) if total else 0
        lines = [f"**{len(onboardings)}** онбордингов · **{pct}%** выполнено · **{overdue}** просрочено\n"]
        for o in onboardings:
            o_overdue = sum(1 for t in o.tasks if t.status == TaskStatus.OVERDUE)
            icon = "🔴" if o_overdue else ("🟡" if o.progress < 50 else "🟢")
            lines.append(f"- {icon} {_onb_link(o)} · {o.template_role} · {o.progress}% · «{o.current_stage}»")
        return "\n".join(lines)

    return "Перейдите на [Дашборд](/dashboard) для просмотра прогресса."


def _find_onb(onboarding_id: str):
    for o in onboardings:
        if o.id == onboarding_id:
            return o
    return None


@app.get("/api/chat/history")
def get_chat_history():
    return [m.model_dump() for m in chat_history[-50:]]
