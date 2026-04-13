from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

from models import TaskStatus, SLAStatus, ChatMessage
from mock_data import (
    employees, templates, onboardings, all_tasks,
    knowledge_docs, chat_history,
)

app = FastAPI(title="Onboarding Orchestrator API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Dashboard ──────────────────────────────────────────────

@app.get("/api/dashboard")
def get_dashboard():
    total = len(all_tasks)
    completed = sum(1 for t in all_tasks if t.status == TaskStatus.COMPLETED)
    in_progress = sum(1 for t in all_tasks if t.status == TaskStatus.IN_PROGRESS)
    overdue = sum(1 for t in all_tasks if t.status == TaskStatus.OVERDUE)
    waiting = sum(1 for t in all_tasks if t.status == TaskStatus.WAITING)

    sla_green = sum(1 for t in all_tasks if t.sla_status == SLAStatus.GREEN)
    sla_yellow = sum(1 for t in all_tasks if t.sla_status == SLAStatus.YELLOW)
    sla_red = sum(1 for t in all_tasks if t.sla_status == SLAStatus.RED)

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
        for o in onboardings
    ]

    return {
        "stats": {
            "active_onboardings": len(onboardings),
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
def get_onboardings():
    return [o.model_dump() for o in onboardings]


@app.get("/api/onboardings/{onboarding_id}")
def get_onboarding(onboarding_id: str):
    for o in onboardings:
        if o.id == onboarding_id:
            return o.model_dump()
    return {"error": "Onboarding not found"}


# ── Tasks ──────────────────────────────────────────────────

@app.get("/api/tasks")
def get_tasks(
    assigned_to: str | None = Query(None),
    status: TaskStatus | None = Query(None),
    newcomer_id: str | None = Query(None),
):
    result = all_tasks
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


# ── Knowledge base ─────────────────────────────────────────

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
    return results


@app.get("/api/knowledge/{doc_id}")
def get_document(doc_id: str):
    for d in knowledge_docs:
        if d.id == doc_id:
            return d.model_dump()
    return {"error": "Document not found"}


# ── Chatbot (mock AI) ─────────────────────────────────────

MOCK_RESPONSES = {
    "привет": "Привет! 👋 Я ваш помощник по онбордингу. Могу ответить на вопросы о процессах компании, подсказать ваши текущие задачи или найти информацию в базе знаний. Чем могу помочь?",
    "задачи": "На текущем этапе у вас следующие задачи:\n• Знакомство с командой — встречи 1-на-1\n• Обзор архитектуры проекта\n• Получение первой задачи от руководителя\n\nВсего в системе сейчас 10 активных онбордингов и более 90 задач. Если нужны подробности — спрашивайте!",
    "график": "Рабочий график в компании:\n📅 Пн-Пт: 09:00 — 18:00\n🕐 Гибкое начало: 08:00 — 10:00\n🍽️ Обед: 1 час (12:00-14:00)\n🏠 Удалёнка: до 2 дней в неделю\n\nИсточник: ПВТР",
    "vpn": "Для настройки VPN:\n1. Обратитесь в IT-отдел (Дмитрий Козлов или Артём Черных)\n2. VPN обязателен при работе вне офиса\n3. Настройка происходит в первый рабочий день\n\nИсточник: ЛНА — Информационная безопасность",
    "доступы": "Доступы предоставляются по принципу минимальных привилегий:\n• Запрос через Jira Service Desk\n• 2FA обязательна для всех систем\n• Пароли: мин. 12 символов, смена каждые 90 дней\n\nПо вопросам доступов обращайтесь к IT: Дмитрий Козлов или Артём Черных.\n\nИсточник: ЛНА — Информационная безопасность",
    "git": "Работа с Git в компании:\n• Репозиторий: GitLab (gitlab.company.ru)\n• Ветвление: Git Flow (feature/, bugfix/, release/)\n• Code review: минимум 2 approve для merge в main\n• CI/CD: GitLab CI — staging автоматически, production через MR\n\nИсточник: Гайд по инструментам разработки",
    "отпуск": "Информация об отпусках:\n📆 28 календарных дней в год\n📝 Заявление подаётся за 14 дней\n🏥 Больничный: с первого дня, уведомите руководителя\n\nИсточник: ПВТР",
    "crm": "CRM-система — Bitrix24 (crm.company.ru):\n• Вход через SSO\n• Каждый менеджер работает в своей воронке\n• Все звонки фиксируются в CRM\n• KPI: конверсия из лида в сделку > 15%\n• Интеграция: Mango Office, Google Calendar, почта\n\nИсточник: Гайд по работе с CRM Bitrix24",
    "figma": "Дизайн-система UI Kit v3:\n• Библиотека: figma.com/company-ui-kit-v3\n• Primary: #6366F1, Secondary: #A855F7\n• Типографика: Inter, 400-800\n• Иконки: Lucide Icons\n• Все макеты строятся на основе UI Kit\n\nИсточник: Дизайн-система компании — UI Kit v3",
    "дизайн": "Дизайн-система UI Kit v3:\n• Библиотека: figma.com/company-ui-kit-v3\n• Primary: #6366F1, Secondary: #A855F7\n• Типографика: Inter, 400-800\n• Иконки: Lucide Icons\n• Все макеты строятся на основе UI Kit\n\nИсточник: Дизайн-система компании — UI Kit v3",
    "увольнение": "Процесс оффбординга:\n• Заявление за 14 календарных дней\n• Передача дел: дни 1-10\n• Возврат имущества и закрытие доступов — последний день\n• Выходное интервью с HR\n\nИсточник: СОП — Процесс увольнения",
    "безопасность": "Политика информационной безопасности:\n🔐 2FA обязательна для всех систем\n🔑 Пароли: мин. 12 символов, смена каждые 90 дней\n📡 VPN обязателен вне офиса\n🚨 Инциденты: security@company.ru или Slack #security\n\nИсточник: ЛНА — Информационная безопасность",
    "данные": "Политика обработки персональных данных (152-ФЗ):\n• Обработка с согласия субъекта\n• Шифрование AES-256\n• Срок хранения трудовых: 75 лет\n• Запрос на доступ к данным — до 30 дней\n• Ответственный: Виктория Лебедева (dpo@company.ru)\n\nИсточник: ЛНА — Политика обработки персональных данных",
    "продажи": "Процесс продаж в компании:\n1. Новый лид → Квалификация (до 24ч)\n2. Квалификация → Демо\n3. Демо → Предложение (КП за 2 дня)\n4. Предложение → Переговоры (до 14 дней)\n5. Переговоры → Закрытие\n\nKPI: конверсия > 15%. Все в CRM Bitrix24.\n\nИсточник: Гайд по работе с CRM Bitrix24",
    "наставник": "Наставничество в компании:\n👨‍🏫 Наставник назначается руководителем до выхода новичка\n📅 Еженедельные встречи 1-на-1 весь первый месяц\n✅ Помощь с первыми задачами и code review\n📋 Обзор архитектуры/процессов на первой неделе\n\nВаш наставник указан в карточке онбординга в разделе «Онбординги».",
    "slack": "Коммуникация в компании:\n💬 Slack — основной мессенджер\n📋 Jira — управление задачами\n📖 Confluence — документация\n\nКлючевые каналы Slack:\n• #general — общие новости\n• #security — инциденты безопасности\n• #random — неформальное общение\n\nИсточник: Гайд по инструментам разработки",
}


@app.post("/api/chat")
def chat(message: dict):
    user_text = message.get("message", "").strip()
    chat_history.append(ChatMessage(role="user", content=user_text, timestamp=datetime.now()))

    response = None
    user_lower = user_text.lower()
    for key, val in MOCK_RESPONSES.items():
        if key in user_lower:
            response = val
            break

    if not response:
        response = (
            "Спасибо за вопрос! Я пока работаю в демо-режиме. "
            "Попробуйте спросить о:\n"
            "• задачах, графике, отпуске\n"
            "• VPN, доступах, безопасности\n"
            "• Git, Slack, Jira\n"
            "• CRM, продажах, воронке\n"
            "• Figma, дизайн-системе\n"
            "• наставнике, персональных данных\n"
            "• увольнении (оффбординг)\n\n"
            "Если не могу помочь — обратитесь к HR:\n"
            "Анна Смирнова (anna@company.ru) или Виктория Лебедева (victoria@company.ru)."
        )

    chat_history.append(ChatMessage(role="assistant", content=response, timestamp=datetime.now()))
    return {"response": response}


@app.get("/api/chat/history")
def get_chat_history():
    return [m.model_dump() for m in chat_history[-50:]]
