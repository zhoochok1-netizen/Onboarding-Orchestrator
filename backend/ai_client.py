import httpx
from openai import OpenAI
from config import settings

_http_client = httpx.Client()

client = OpenAI(
    base_url=settings.gateway_base_url,
    api_key=settings.gateway_token,
    http_client=_http_client,
)

CHAT_SYSTEM_PROMPT = """\
Ты — AI-помощник по онбордингу сотрудников в системе «Onboarding Orchestrator».

## Стиль ответов
- КРАТКО и по фактам. Никакой воды.
- Markdown: **жирный**, списки, разделители.
- Ответ должен быть ЁМКИМ — максимум 10-15 строк для задач.

## КРИТИЧНО: Ссылки на задачи и онбординги
В контексте у каждой задачи есть ID (например `onb-1-tt8`) и у каждого онбординга ID (например `onb-1`).
ОБЯЗАТЕЛЬНО используй эти ID в ссылках:
- Задача: [Название задачи](task:ID_ЗАДАЧИ) — например [Ревью первого PR](task:onb-1-tt8)
- Онбординг/новичок: [Имя новичка](onboarding:ID_ОНБОРДИНГА) — например [Мария Иванова](onboarding:onb-1)
Эти ссылки кликабельны и откроют модалку с деталями. ВСЕГДА используй их при упоминании задач и новичков.

## Ссылки на разделы
- [Доска задач](/tasks), [Онбординги](/onboardings), [База знаний](/knowledge), [Дашборд](/dashboard)

## Источники из базы знаний
> 📄 Источник: [Название документа](/knowledge)

## Правила
1. Русский язык.
2. Конкретика: имена, даты, ID — не общие фразы.
3. Если не знаешь — скажи честно, предложи HR (anna@company.ru).
4. Адаптируй под роль: HR видит всё, новичок — свои задачи.
"""

KNOWLEDGE_SYSTEM_PROMPT = """\
Ты — AI-помощник по базе знаний компании. Отвечай КРАТКО на основе документов.

## Формат
- Markdown: **жирный**, списки.
- Краткий структурированный ответ.
- ОБЯЗАТЕЛЬНО укажи источник:
  > 📄 Источник: [Название документа](/knowledge)

## Правила
1. Только на основе документов.
2. Нет ответа — скажи честно, предложи HR.
3. Русский язык.
"""


def chat_with_context(
    message: str,
    newcomer_context: str | None = None,
    knowledge_context: str | None = None,
) -> str:
    messages: list[dict] = [{"role": "system", "content": CHAT_SYSTEM_PROMPT}]

    context_parts = []
    if newcomer_context:
        context_parts.append(f"## Контекст пользователя\n{newcomer_context}")
    if knowledge_context:
        context_parts.append(f"## База знаний\n{knowledge_context}")

    if context_parts:
        messages.append({"role": "user", "content": "\n\n---\n\n".join(context_parts)})
        messages.append({"role": "assistant", "content": "Принял контекст."})

    messages.append({"role": "user", "content": message})

    try:
        completion = client.chat.completions.create(
            model=settings.gateway_model,
            messages=messages,
        )
        return completion.choices[0].message.content or "Не удалось получить ответ."
    except Exception as e:
        return f"Ошибка AI: {e}"


def search_knowledge_with_ai(query: str, documents_context: str) -> str:
    messages: list[dict] = [
        {"role": "system", "content": KNOWLEDGE_SYSTEM_PROMPT},
        {
            "role": "user",
            "content": f"Документы:\n\n{documents_context}\n\n---\n\nВопрос: {query}",
        },
    ]

    try:
        completion = client.chat.completions.create(
            model=settings.gateway_model,
            messages=messages,
        )
        return completion.choices[0].message.content or "Не удалось получить ответ."
    except Exception as e:
        return f"Ошибка AI: {e}"
