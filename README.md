# Onboarding Orchestrator

Репозиторий: [github.com/zhoochok1-netizen/Onboarding-Orchestrator](https://github.com/zhoochok1-netizen/Onboarding-Orchestrator)

Веб-сервис для координации адаптации новых сотрудников: единая картина онбординга для HR, участников процесса и новичка.

---

## О приложении

**Onboarding Orchestrator** помогает не терять задачи между HR, IT, руководителем и наставником. В интерфейсе собраны дашборд, маршруты по шаблонам, активные онбординги, доска задач с SLA, чат-помощник для новичка и навигатор по базе знаний.

Сейчас проект работает на **демо-данных** (моки на бэкенде): можно полностью пройти сценарии без внешних систем и базы данных.

### Возможности

| Область | Что есть в интерфейсе |
|--------|------------------------|
| **Дашборд** | Сводка по онбордингам, задачам и SLA (зелёный / жёлтый / красный) |
| **Шаблоны** | Маршруты по ролям: этапы, задачи, ответственные, дедлайны |
| **Онбординги** | Список активных адаптаций и детальная карточка с прогрессом |
| **Задачи** | Доска задач участников со статусами (ожидает, в работе, выполнено, просрочено) |
| **Чат** | Точка входа для новичка: подсказки по этапу и контексту (правила ответа на бэкенде) |
| **База знаний** | Документы и поиск с опорой на загруженный контент и указанием источника |

### Стек

- **Фронтенд:** React 19, React Router, Create React App  
- **Бэкенд:** Python 3, FastAPI, Uvicorn, Pydantic  

---

## Требования

- [Python](https://www.python.org/downloads/) 3.10+ (в PATH должны быть `python` и `pip`)
- [Node.js](https://nodejs.org/) 18+ и npm  

Проверка:

```bash
python --version
pip --version
node --version
npm --version
```

---

## Запуск локально

Нужны **два терминала**: сначала API, затем (или параллельно) фронтенд.

### 1. Бэкенд (порт `8000`)

**Windows (PowerShell)** — из корня проекта:

```powershell
Set-Location .\backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

**macOS / Linux:**

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

- REST API: [http://127.0.0.1:8000](http://127.0.0.1:8000)  
- Интерактивная документация (Swagger): [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)  

> В PowerShell цепочку команд удобно писать через `;`, а не через `&&` (в старых версиях `&&` может не работать).

### 2. Фронтенд (порт `3000`)

**Windows (PowerShell)** — из корня проекта:

```powershell
Set-Location .\frontend
npm install
npm start
```

**macOS / Linux:**

```bash
cd frontend
npm install
npm start
```

Браузер откроется на [http://localhost:3000](http://localhost:3000). Главная перенаправляет на `/dashboard`.

### Переменные окружения (опционально)

Если API не на `http://localhost:8000`, задайте URL перед `npm start`:

**Windows (PowerShell):**

```powershell
$env:REACT_APP_API_URL = "http://127.0.0.1:8000"
npm start
```

**macOS / Linux:**

```bash
REACT_APP_API_URL=http://127.0.0.1:8000 npm start
```

По умолчанию в `frontend/src/api/client.js` используется `http://localhost:8000`.

---

## Структура репозитория

```
Onboarding-Orchestrator/
├── backend/          # FastAPI, мок-данные, эндпоинты /api/...
├── frontend/         # React-приложение
├── README.md
└── тех задание.html  # исходное описание задания (контекст продукта)
```

---

## Сборка фронта для продакшена

```bash
cd frontend
npm run build
```

Статика окажется в `frontend/build`; её можно отдавать через nginx или вместе с бэкендом по вашей схеме деплоя.

---

## Лицензия и контекст

Учебный / демонстрационный проект по сценарию **Onboarding Orchestrator** (маршрут адаптации, задачи, SLA, чатбот, база знаний). Детали требований см. в `тех задание.html`.
