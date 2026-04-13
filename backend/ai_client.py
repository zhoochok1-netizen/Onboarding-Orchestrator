import httpx
from openai import OpenAI
from config import settings

_http_client = httpx.Client()

client = OpenAI(
    base_url=settings.gateway_base_url,
    api_key=settings.gateway_token,
    http_client=_http_client,
)

CHAT_SYSTEM_PROMPT = (
    "Ты — AI-помощник по онбордингу новых сотрудников в компании. "
    "Твоя задача — помогать новичкам адаптироваться: отвечать на вопросы о процессах, "
    "подсказывать текущие задачи, объяснять политики компании.\n\n"
    "Правила:\n"
    "1. Отвечай дружелюбно, кратко и по делу.\n"
    "2. Если знаешь источник (документ) — обязательно укажи его в конце ответа в формате «Источник: ...».\n"
    "3. Если не знаешь ответа — честно скажи об этом и предложи обратиться к HR "
    "(Анна Смирнова, anna@company.ru) или IT (Дмитрий Козлов).\n"
    "4. Пиши на русском языке.\n"
    "5. Используй маркированные списки и эмодзи для наглядности."
)

KNOWLEDGE_SYSTEM_PROMPT = (
    "Ты — AI-помощник по навигации в базе знаний компании. "
    "Тебе дан набор документов компании. На основе этих документов ты должен:\n"
    "1. Найти релевантную информацию по запросу пользователя.\n"
    "2. Дать краткий и точный ответ.\n"
    "3. ОБЯЗАТЕЛЬНО указать источник: название документа и раздел, откуда взята информация.\n"
    "4. Если в документах нет ответа — честно скажи об этом и предложи обратиться к HR.\n"
    "5. Пиши на русском языке."
)


def chat_with_context(
    message: str,
    newcomer_context: str | None = None,
    knowledge_context: str | None = None,
) -> str:
    messages: list[dict] = [{"role": "system", "content": CHAT_SYSTEM_PROMPT}]

    context_parts = []
    if newcomer_context:
        context_parts.append(f"Контекст новичка:\n{newcomer_context}")
    if knowledge_context:
        context_parts.append(f"Документы базы знаний:\n{knowledge_context}")

    if context_parts:
        messages.append({"role": "user", "content": "\n\n".join(context_parts)})
        messages.append({
            "role": "assistant",
            "content": "Понял, я ознакомился с контекстом. Готов помочь!",
        })

    messages.append({"role": "user", "content": message})

    try:
        completion = client.chat.completions.create(
            model=settings.gateway_model,
            messages=messages,
        )
        return completion.choices[0].message.content or "Не удалось получить ответ."
    except Exception as e:
        return f"Ошибка при обращении к AI: {e}"


def search_knowledge_with_ai(query: str, documents_context: str) -> str:
    messages: list[dict] = [
        {"role": "system", "content": KNOWLEDGE_SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"Документы компании:\n\n{documents_context}\n\n"
                f"---\n\nВопрос пользователя: {query}\n\n"
                "Дай краткий ответ на основе документов выше. Укажи источник."
            ),
        },
    ]

    try:
        completion = client.chat.completions.create(
            model=settings.gateway_model,
            messages=messages,
        )
        return completion.choices[0].message.content or "Не удалось получить ответ."
    except Exception as e:
        return f"Ошибка при обращении к AI: {e}"
