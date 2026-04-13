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

def _build_user_context(emp: Optional[Employee]) -> str:
    if not emp:
        return ""

    lines = [
        f"Текущий пользователь: {emp.full_name}",
        f"Роль: {emp.role.value}",
        f"Отдел: {emp.department}",
        f"Email: {emp.email}",
    ]

    if emp.role == Role.NEWCOMER:
        for o in onboardings:
            if o.newcomer_id == emp.id:
                pending = [t for t in o.tasks if t.status in (TaskStatus.WAITING, TaskStatus.IN_PROGRESS)]
                overdue = [t for t in o.tasks if t.status == TaskStatus.OVERDUE]
                lines.append(f"\nОнбординг: {o.template_role}")
                lines.append(f"Текущий этап: {o.current_stage}")
                lines.append(f"Прогресс: {o.progress}%")
                if pending:
                    lines.append("Текущие задачи:")
                    for t in pending[:10]:
                        lines.append(f"  - {t.title} ({t.status.value}, дедлайн: {t.deadline}, ответственный: {t.assigned_to_name})")
                if overdue:
                    lines.append("Просроченные задачи:")
                    for t in overdue[:5]:
                        lines.append(f"  - {t.title} (просрочено, дедлайн: {t.deadline})")
                break
    elif _is_hr(emp):
        lines.append(f"\nАктивных онбордингов: {len(onboardings)}")
        lines.append(f"Всего задач: {len(all_tasks)}")
        overdue_count = sum(1 for t in all_tasks if t.status == TaskStatus.OVERDUE)
        if overdue_count:
            lines.append(f"Просроченных задач: {overdue_count}")
    elif emp.role == Role.MANAGER:
        dept_onboardings = [o for o in onboardings if _newcomer_department(o.newcomer_id) == emp.department]
        dept_tasks = [t for t in all_tasks if _newcomer_department(t.newcomer_id) == emp.department]
        lines.append(f"\nОтдел: {emp.department}")
        lines.append(f"Онбордингов в отделе: {len(dept_onboardings)}")
        lines.append(f"Задач в отделе: {len(dept_tasks)}")
        overdue_count = sum(1 for t in dept_tasks if t.status == TaskStatus.OVERDUE)
        if overdue_count:
            lines.append(f"Просроченных задач: {overdue_count}")
    else:
        my_tasks = [t for t in all_tasks if t.assigned_to == emp.id]
        if my_tasks:
            lines.append(f"\nНазначенных задач: {len(my_tasks)}")
            pending = [t for t in my_tasks if t.status in (TaskStatus.WAITING, TaskStatus.IN_PROGRESS)]
            if pending:
                lines.append("Мои задачи:")
                for t in pending[:10]:
                    lines.append(f"  - {t.title} (новичок: {t.newcomer_name}, дедлайн: {t.deadline})")

    return "\n".join(lines)


@app.post("/api/chat")
def chat(request: Request, message: dict):
    user_text = message.get("message", "").strip()
    chat_history.append(ChatMessage(role="user", content=user_text, timestamp=datetime.now()))

    if settings.gateway_token:
        emp = _get_current_user(request)
        user_ctx = _build_user_context(emp)
        knowledge_ctx = _build_knowledge_context()
        response = chat_with_context(user_text, user_ctx, knowledge_ctx)
    else:
        response = _mock_chat_response(user_text)

    chat_history.append(ChatMessage(role="assistant", content=response, timestamp=datetime.now()))
    return {"response": response}


def _mock_chat_response(user_text: str) -> str:
    MOCK_RESPONSES = {
        "привет": "Привет! 👋 Я ваш помощник по онбордингу. Чем могу помочь?",
        "задачи": "Для просмотра задач перейдите в раздел «Доска задач».",
        "график": "📅 Пн-Пт: 09:00 — 18:00, гибкое начало 08:00-10:00.\n\nИсточник: ПВТР",
    }
    user_lower = user_text.lower()
    for key, val in MOCK_RESPONSES.items():
        if key in user_lower:
            return val
    return "AI-помощник сейчас недоступен (токен не настроен). Обратитесь к HR."


@app.get("/api/chat/history")
def get_chat_history():
    return [m.model_dump() for m in chat_history[-50:]]
