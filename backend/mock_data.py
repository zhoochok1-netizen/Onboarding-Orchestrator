from datetime import datetime, date, timedelta
from models import (
    Stage, TemplateTask, OnboardingTemplate, Employee, Role,
    OnboardingTask, Onboarding, TaskStatus, SLAStatus,
    KnowledgeDocument, ChatMessage,
)

today = date.today()

# ── Employees (20+) ───────────────────────────────────────

employees: list[Employee] = [
    # HR
    Employee(id="emp-1", full_name="Анна Смирнова", email="anna@company.ru", role=Role.HR, department="HR"),
    Employee(id="emp-14", full_name="Виктория Лебедева", email="victoria@company.ru", role=Role.HR, department="HR"),
    # IT
    Employee(id="emp-2", full_name="Дмитрий Козлов", email="dmitry@company.ru", role=Role.IT, department="IT"),
    Employee(id="emp-15", full_name="Артём Черных", email="artem@company.ru", role=Role.IT, department="IT"),
    # Managers
    Employee(id="emp-3", full_name="Елена Петрова", email="elena@company.ru", role=Role.MANAGER, department="Разработка"),
    Employee(id="emp-16", full_name="Константин Орлов", email="konstantin@company.ru", role=Role.MANAGER, department="Маркетинг"),
    Employee(id="emp-17", full_name="Наталья Белова", email="natalia@company.ru", role=Role.MANAGER, department="Продажи"),
    Employee(id="emp-18", full_name="Андрей Титов", email="andrey.t@company.ru", role=Role.MANAGER, department="Дизайн"),
    # Mentors
    Employee(id="emp-4", full_name="Сергей Волков", email="sergey@company.ru", role=Role.MENTOR, department="Разработка"),
    Employee(id="emp-8", full_name="Игорь Морозов", email="igor@company.ru", role=Role.MENTOR, department="Маркетинг"),
    Employee(id="emp-19", full_name="Павел Соколов", email="pavel@company.ru", role=Role.MENTOR, department="Продажи"),
    Employee(id="emp-20", full_name="Татьяна Кузнецова", email="tatiana@company.ru", role=Role.MENTOR, department="Дизайн"),
    # Newcomers
    Employee(id="emp-5", full_name="Мария Иванова", email="maria@company.ru", role=Role.NEWCOMER, department="Разработка"),
    Employee(id="emp-6", full_name="Алексей Новиков", email="alexey@company.ru", role=Role.NEWCOMER, department="Маркетинг"),
    Employee(id="emp-7", full_name="Ольга Федорова", email="olga@company.ru", role=Role.NEWCOMER, department="Разработка"),
    Employee(id="emp-9", full_name="Никита Васильев", email="nikita@company.ru", role=Role.NEWCOMER, department="Разработка"),
    Employee(id="emp-10", full_name="Екатерина Попова", email="ekaterina@company.ru", role=Role.NEWCOMER, department="Продажи"),
    Employee(id="emp-11", full_name="Максим Григорьев", email="maxim@company.ru", role=Role.NEWCOMER, department="Дизайн"),
    Employee(id="emp-12", full_name="Дарья Сидорова", email="darya@company.ru", role=Role.NEWCOMER, department="Маркетинг"),
    Employee(id="emp-13", full_name="Роман Киселёв", email="roman@company.ru", role=Role.NEWCOMER, department="Разработка"),
    Employee(id="emp-21", full_name="Юлия Захарова", email="yulia@company.ru", role=Role.NEWCOMER, department="Продажи"),
    Employee(id="emp-22", full_name="Владислав Медведев", email="vladislav@company.ru", role=Role.NEWCOMER, department="IT"),
]

# helper: find employee by id
_emp = {e.id: e for e in employees}

# ── Stages ─────────────────────────────────────────────────

stages_dev = [
    Stage(id="s1", name="День 1", description="Первый день в офисе", order=1),
    Stage(id="s2", name="Неделя 1", description="Знакомство с командой и процессами", order=2),
    Stage(id="s3", name="Месяц 1", description="Погружение в проекты", order=3),
]

stages_marketing = [
    Stage(id="sm1", name="День 1", description="Первый рабочий день", order=1),
    Stage(id="sm2", name="Неделя 1", description="Изучение продукта и рынка", order=2),
    Stage(id="sm3", name="Месяц 1", description="Самостоятельные задачи", order=3),
]

stages_sales = [
    Stage(id="ss1", name="День 1", description="Знакомство с компанией и продуктом", order=1),
    Stage(id="ss2", name="Неделя 1", description="Обучение процессу продаж", order=2),
    Stage(id="ss3", name="Неделя 2", description="Работа с CRM и скриптами", order=3),
    Stage(id="ss4", name="Месяц 1", description="Первые самостоятельные сделки", order=4),
]

stages_design = [
    Stage(id="sd1", name="День 1", description="Первый рабочий день", order=1),
    Stage(id="sd2", name="Неделя 1", description="Знакомство с дизайн-системой", order=2),
    Stage(id="sd3", name="Месяц 1", description="Первый самостоятельный проект", order=3),
]

# ── Templates (4) ─────────────────────────────────────────

templates: list[OnboardingTemplate] = [
    OnboardingTemplate(
        id="tmpl-dev",
        role_name="Разработчик",
        description="Шаблон онбординга для разработчиков",
        stages=stages_dev,
        tasks=[
            TemplateTask(id="tt1", title="Оформить документы", description="Трудовой договор, NDA, заявления", stage_id="s1", responsible_role=Role.HR, deadline_days=1),
            TemplateTask(id="tt2", title="Выдать оборудование", description="Ноутбук, монитор, клавиатура", stage_id="s1", responsible_role=Role.IT, deadline_days=1),
            TemplateTask(id="tt3", title="Настроить доступы", description="Git, Jira, Confluence, почта, VPN", stage_id="s1", responsible_role=Role.IT, deadline_days=1),
            TemplateTask(id="tt4", title="Провести welcome-встречу", description="Рассказать о компании, ценностях, структуре", stage_id="s1", responsible_role=Role.HR, deadline_days=1),
            TemplateTask(id="tt5", title="Знакомство с командой", description="Организовать встречи 1-на-1 с каждым членом команды", stage_id="s2", responsible_role=Role.MENTOR, deadline_days=5),
            TemplateTask(id="tt6", title="Обзор архитектуры", description="Провести презентацию архитектуры проекта", stage_id="s2", responsible_role=Role.MENTOR, deadline_days=5),
            TemplateTask(id="tt7", title="Первая задача", description="Назначить простую задачу для знакомства с кодовой базой", stage_id="s2", responsible_role=Role.MANAGER, deadline_days=7),
            TemplateTask(id="tt8", title="Ревью первого PR", description="Провести ревью и дать обратную связь", stage_id="s3", responsible_role=Role.MENTOR, deadline_days=14),
            TemplateTask(id="tt9", title="Встреча по итогам месяца", description="Обсудить прогресс, сложности, план на следующий месяц", stage_id="s3", responsible_role=Role.MANAGER, deadline_days=30),
            TemplateTask(id="tt10", title="Оценка прохождения испытательного", description="Заполнить форму оценки", stage_id="s3", responsible_role=Role.HR, deadline_days=30),
        ],
    ),
    OnboardingTemplate(
        id="tmpl-marketing",
        role_name="Маркетолог",
        description="Шаблон онбординга для маркетологов",
        stages=stages_marketing,
        tasks=[
            TemplateTask(id="tm1", title="Оформить документы", description="Трудовой договор, NDA", stage_id="sm1", responsible_role=Role.HR, deadline_days=1),
            TemplateTask(id="tm2", title="Выдать оборудование", description="Ноутбук, доступ к CRM", stage_id="sm1", responsible_role=Role.IT, deadline_days=1),
            TemplateTask(id="tm3", title="Презентация продукта", description="Детальный обзор продукта и позиционирования", stage_id="sm2", responsible_role=Role.MENTOR, deadline_days=5),
            TemplateTask(id="tm4", title="Обзор рекламных каналов", description="Изучить текущие каналы: контекст, таргет, SEO, email", stage_id="sm2", responsible_role=Role.MENTOR, deadline_days=5),
            TemplateTask(id="tm5", title="Анализ конкурентов", description="Подготовить анализ 3 ключевых конкурентов", stage_id="sm2", responsible_role=Role.MANAGER, deadline_days=7),
            TemplateTask(id="tm6", title="Знакомство с аналитикой", description="Настроить доступы к GA, Яндекс.Метрика, BI-дашборды", stage_id="sm2", responsible_role=Role.IT, deadline_days=5),
            TemplateTask(id="tm7", title="Первая кампания", description="Запустить первую рекламную кампанию под руководством ментора", stage_id="sm3", responsible_role=Role.MANAGER, deadline_days=30),
            TemplateTask(id="tm8", title="Отчёт по результатам", description="Подготовить отчёт по первой кампании с метриками", stage_id="sm3", responsible_role=Role.MENTOR, deadline_days=30),
        ],
    ),
    OnboardingTemplate(
        id="tmpl-sales",
        role_name="Менеджер по продажам",
        description="Шаблон онбординга для менеджеров по продажам",
        stages=stages_sales,
        tasks=[
            TemplateTask(id="ts1", title="Оформить документы", description="Трудовой договор, NDA, заявления", stage_id="ss1", responsible_role=Role.HR, deadline_days=1),
            TemplateTask(id="ts2", title="Выдать оборудование и CRM", description="Ноутбук, телефон, доступ к CRM Bitrix24", stage_id="ss1", responsible_role=Role.IT, deadline_days=1),
            TemplateTask(id="ts3", title="Welcome-встреча", description="Знакомство с компанией, продуктом, командой", stage_id="ss1", responsible_role=Role.HR, deadline_days=1),
            TemplateTask(id="ts4", title="Обучение продукту", description="Детальное изучение продукта: функции, тарифы, преимущества", stage_id="ss2", responsible_role=Role.MENTOR, deadline_days=5),
            TemplateTask(id="ts5", title="Изучение скриптов продаж", description="Разбор скриптов холодных и тёплых звонков", stage_id="ss2", responsible_role=Role.MENTOR, deadline_days=5),
            TemplateTask(id="ts6", title="Тень на звонках", description="Прослушать 10+ звонков опытных менеджеров", stage_id="ss2", responsible_role=Role.MENTOR, deadline_days=7),
            TemplateTask(id="ts7", title="Настройка воронки в CRM", description="Настроить персональную воронку продаж", stage_id="ss3", responsible_role=Role.IT, deadline_days=10),
            TemplateTask(id="ts8", title="Ролевая игра", description="Провести 3 ролевые игры с ментором (возражения, презентация, закрытие)", stage_id="ss3", responsible_role=Role.MENTOR, deadline_days=10),
            TemplateTask(id="ts9", title="Первые звонки", description="Совершить 20 самостоятельных звонков под наблюдением", stage_id="ss3", responsible_role=Role.MANAGER, deadline_days=14),
            TemplateTask(id="ts10", title="Первая сделка", description="Довести лида до закрытия сделки", stage_id="ss4", responsible_role=Role.MANAGER, deadline_days=30),
            TemplateTask(id="ts11", title="Оценка по итогам месяца", description="Встреча с руководителем: KPI, обратная связь, план развития", stage_id="ss4", responsible_role=Role.MANAGER, deadline_days=30),
            TemplateTask(id="ts12", title="Заполнить форму оценки испытательного", description="HR-форма прохождения испытательного срока", stage_id="ss4", responsible_role=Role.HR, deadline_days=30),
        ],
    ),
    OnboardingTemplate(
        id="tmpl-design",
        role_name="Дизайнер",
        description="Шаблон онбординга для дизайнеров",
        stages=stages_design,
        tasks=[
            TemplateTask(id="td1", title="Оформить документы", description="Трудовой договор, NDA", stage_id="sd1", responsible_role=Role.HR, deadline_days=1),
            TemplateTask(id="td2", title="Выдать оборудование", description="MacBook, монитор, лицензии Figma/Adobe", stage_id="sd1", responsible_role=Role.IT, deadline_days=1),
            TemplateTask(id="td3", title="Welcome-встреча", description="Знакомство с компанией и командой дизайна", stage_id="sd1", responsible_role=Role.HR, deadline_days=1),
            TemplateTask(id="td4", title="Обзор дизайн-системы", description="Изучить UI Kit, токены, компоненты в Figma", stage_id="sd2", responsible_role=Role.MENTOR, deadline_days=5),
            TemplateTask(id="td5", title="Обзор бренд-гайда", description="Изучить фирменный стиль, палитру, типографику", stage_id="sd2", responsible_role=Role.MENTOR, deadline_days=5),
            TemplateTask(id="td6", title="Настроить Figma-проект", description="Получить доступы, клонировать шаблоны", stage_id="sd2", responsible_role=Role.IT, deadline_days=3),
            TemplateTask(id="td7", title="Первая задача — редизайн экрана", description="Переделать один экран по существующему дизайн-системе", stage_id="sd2", responsible_role=Role.MANAGER, deadline_days=7),
            TemplateTask(id="td8", title="Ревью дизайна", description="Провести ревью с командой и собрать фидбек", stage_id="sd3", responsible_role=Role.MENTOR, deadline_days=14),
            TemplateTask(id="td9", title="Самостоятельный проект", description="Разработать дизайн новой фичи от исследования до макета", stage_id="sd3", responsible_role=Role.MANAGER, deadline_days=30),
            TemplateTask(id="td10", title="Оценка прохождения испытательного", description="Заполнить форму оценки", stage_id="sd3", responsible_role=Role.HR, deadline_days=30),
        ],
    ),
]

# ── Helper: role → employee mapping per department ─────────

role_to_employee_dev = {
    Role.HR: _emp["emp-1"],
    Role.IT: _emp["emp-2"],
    Role.MANAGER: _emp["emp-3"],
    Role.MENTOR: _emp["emp-4"],
}

role_to_employee_marketing = {
    Role.HR: _emp["emp-1"],
    Role.IT: _emp["emp-2"],
    Role.MANAGER: _emp["emp-16"],
    Role.MENTOR: _emp["emp-8"],
}

role_to_employee_sales = {
    Role.HR: _emp["emp-14"],
    Role.IT: _emp["emp-15"],
    Role.MANAGER: _emp["emp-17"],
    Role.MENTOR: _emp["emp-19"],
}

role_to_employee_design = {
    Role.HR: _emp["emp-14"],
    Role.IT: _emp["emp-15"],
    Role.MANAGER: _emp["emp-18"],
    Role.MENTOR: _emp["emp-20"],
}


def _sla(deadline: date) -> SLAStatus:
    days_left = (deadline - today).days
    if days_left < 0:
        return SLAStatus.RED
    if days_left <= 2:
        return SLAStatus.YELLOW
    return SLAStatus.GREEN


def _status(deadline: date, done: bool) -> TaskStatus:
    if done:
        return TaskStatus.COMPLETED
    if (deadline - today).days < 0:
        return TaskStatus.OVERDUE
    return TaskStatus.IN_PROGRESS


def _build_tasks(
    template: OnboardingTemplate,
    onboarding_id: str,
    newcomer: Employee,
    start: date,
    done_ids: set[str],
    role_map: dict,
) -> list[OnboardingTask]:
    tasks = []
    stage_map = {s.id: s.name for s in template.stages}
    for tt in template.tasks:
        deadline = start + timedelta(days=tt.deadline_days)
        is_done = tt.id in done_ids
        responsible = role_map.get(tt.responsible_role, _emp["emp-1"])
        tasks.append(OnboardingTask(
            id=f"{onboarding_id}-{tt.id}",
            onboarding_id=onboarding_id,
            title=tt.title,
            description=tt.description,
            stage_id=tt.stage_id,
            stage_name=stage_map[tt.stage_id],
            assigned_to=responsible.id,
            assigned_to_name=responsible.full_name,
            responsible_role=tt.responsible_role,
            deadline=deadline,
            status=TaskStatus.COMPLETED if is_done else _status(deadline, is_done),
            sla_status=SLAStatus.GREEN if is_done else _sla(deadline),
            newcomer_id=newcomer.id,
            newcomer_name=newcomer.full_name,
        ))
    return tasks


def _progress(tasks: list[OnboardingTask]) -> int:
    if not tasks:
        return 0
    return int(sum(1 for t in tasks if t.status == TaskStatus.COMPLETED) / len(tasks) * 100)


def _current_stage(tasks: list[OnboardingTask], stages: list[Stage]) -> str:
    completed_stages = set()
    for t in tasks:
        if t.status == TaskStatus.COMPLETED:
            completed_stages.add(t.stage_id)
    for s in stages:
        if s.id not in completed_stages:
            return s.name
    return stages[-1].name


# ── Onboardings (8) ───────────────────────────────────────

# 1. Мария Иванова — разработчик, 25 дней назад, почти завершён
maria_start = today - timedelta(days=25)
maria_done = {"tt1", "tt2", "tt3", "tt4", "tt5", "tt6", "tt7", "tt8"}
maria_tasks = _build_tasks(templates[0], "onb-1", _emp["emp-5"], maria_start, maria_done, role_to_employee_dev)

# 2. Алексей Новиков — маркетолог, 12 дней назад
alexey_start = today - timedelta(days=12)
alexey_done = {"tm1", "tm2", "tm3", "tm4", "tm6"}
alexey_tasks = _build_tasks(templates[1], "onb-2", _emp["emp-6"], alexey_start, alexey_done, role_to_employee_marketing)

# 3. Ольга Федорова — разработчик, 5 дней назад
olga_start = today - timedelta(days=5)
olga_done = {"tt1", "tt2", "tt3", "tt4"}
olga_tasks = _build_tasks(templates[0], "onb-3", _emp["emp-7"], olga_start, olga_done, role_to_employee_dev)

# 4. Никита Васильев — разработчик, начал сегодня
nikita_start = today
nikita_done: set[str] = set()
nikita_tasks = _build_tasks(templates[0], "onb-4", _emp["emp-9"], nikita_start, nikita_done, role_to_employee_dev)

# 5. Екатерина Попова — продажи, 8 дней назад
ekaterina_start = today - timedelta(days=8)
ekaterina_done = {"ts1", "ts2", "ts3", "ts4", "ts5"}
ekaterina_tasks = _build_tasks(templates[2], "onb-5", _emp["emp-10"], ekaterina_start, ekaterina_done, role_to_employee_sales)

# 6. Максим Григорьев — дизайнер, 15 дней назад
maxim_start = today - timedelta(days=15)
maxim_done = {"td1", "td2", "td3", "td4", "td5", "td6", "td7"}
maxim_tasks = _build_tasks(templates[3], "onb-6", _emp["emp-11"], maxim_start, maxim_done, role_to_employee_design)

# 7. Дарья Сидорова — маркетолог, 2 дня назад
darya_start = today - timedelta(days=2)
darya_done = {"tm1"}
darya_tasks = _build_tasks(templates[1], "onb-7", _emp["emp-12"], darya_start, darya_done, role_to_employee_marketing)

# 8. Роман Киселёв — разработчик, 20 дней назад, проблемный (много просрочек)
roman_start = today - timedelta(days=20)
roman_done = {"tt1", "tt2", "tt3", "tt4", "tt5"}
roman_tasks = _build_tasks(templates[0], "onb-8", _emp["emp-13"], roman_start, roman_done, role_to_employee_dev)

# 9. Юлия Захарова — продажи, 18 дней назад
yulia_start = today - timedelta(days=18)
yulia_done = {"ts1", "ts2", "ts3", "ts4", "ts5", "ts6", "ts7", "ts8", "ts9"}
yulia_tasks = _build_tasks(templates[2], "onb-9", _emp["emp-21"], yulia_start, yulia_done, role_to_employee_sales)

# 10. Владислав Медведев — разработчик, 3 дня назад
vladislav_start = today - timedelta(days=3)
vladislav_done = {"tt1", "tt2", "tt3", "tt4"}
vladislav_tasks = _build_tasks(templates[0], "onb-10", _emp["emp-22"], vladislav_start, vladislav_done, role_to_employee_dev)


onboardings: list[Onboarding] = [
    Onboarding(
        id="onb-1", newcomer_id="emp-5", newcomer_name="Мария Иванова",
        template_id="tmpl-dev", template_role="Разработчик",
        start_date=maria_start, current_stage=_current_stage(maria_tasks, stages_dev),
        progress=_progress(maria_tasks), tasks=maria_tasks,
    ),
    Onboarding(
        id="onb-2", newcomer_id="emp-6", newcomer_name="Алексей Новиков",
        template_id="tmpl-marketing", template_role="Маркетолог",
        start_date=alexey_start, current_stage=_current_stage(alexey_tasks, stages_marketing),
        progress=_progress(alexey_tasks), tasks=alexey_tasks,
    ),
    Onboarding(
        id="onb-3", newcomer_id="emp-7", newcomer_name="Ольга Федорова",
        template_id="tmpl-dev", template_role="Разработчик",
        start_date=olga_start, current_stage=_current_stage(olga_tasks, stages_dev),
        progress=_progress(olga_tasks), tasks=olga_tasks,
    ),
    Onboarding(
        id="onb-4", newcomer_id="emp-9", newcomer_name="Никита Васильев",
        template_id="tmpl-dev", template_role="Разработчик",
        start_date=nikita_start, current_stage=_current_stage(nikita_tasks, stages_dev),
        progress=_progress(nikita_tasks), tasks=nikita_tasks,
    ),
    Onboarding(
        id="onb-5", newcomer_id="emp-10", newcomer_name="Екатерина Попова",
        template_id="tmpl-sales", template_role="Менеджер по продажам",
        start_date=ekaterina_start, current_stage=_current_stage(ekaterina_tasks, stages_sales),
        progress=_progress(ekaterina_tasks), tasks=ekaterina_tasks,
    ),
    Onboarding(
        id="onb-6", newcomer_id="emp-11", newcomer_name="Максим Григорьев",
        template_id="tmpl-design", template_role="Дизайнер",
        start_date=maxim_start, current_stage=_current_stage(maxim_tasks, stages_design),
        progress=_progress(maxim_tasks), tasks=maxim_tasks,
    ),
    Onboarding(
        id="onb-7", newcomer_id="emp-12", newcomer_name="Дарья Сидорова",
        template_id="tmpl-marketing", template_role="Маркетолог",
        start_date=darya_start, current_stage=_current_stage(darya_tasks, stages_marketing),
        progress=_progress(darya_tasks), tasks=darya_tasks,
    ),
    Onboarding(
        id="onb-8", newcomer_id="emp-13", newcomer_name="Роман Киселёв",
        template_id="tmpl-dev", template_role="Разработчик",
        start_date=roman_start, current_stage=_current_stage(roman_tasks, stages_dev),
        progress=_progress(roman_tasks), tasks=roman_tasks,
    ),
    Onboarding(
        id="onb-9", newcomer_id="emp-21", newcomer_name="Юлия Захарова",
        template_id="tmpl-sales", template_role="Менеджер по продажам",
        start_date=yulia_start, current_stage=_current_stage(yulia_tasks, stages_sales),
        progress=_progress(yulia_tasks), tasks=yulia_tasks,
    ),
    Onboarding(
        id="onb-10", newcomer_id="emp-22", newcomer_name="Владислав Медведев",
        template_id="tmpl-dev", template_role="Разработчик",
        start_date=vladislav_start, current_stage=_current_stage(vladislav_tasks, stages_dev),
        progress=_progress(vladislav_tasks), tasks=vladislav_tasks,
    ),
]

all_tasks: list[OnboardingTask] = (
    maria_tasks + alexey_tasks + olga_tasks + nikita_tasks +
    ekaterina_tasks + maxim_tasks + darya_tasks + roman_tasks +
    yulia_tasks + vladislav_tasks
)

# ── Knowledge base (8 docs) ──────────────────────────────

knowledge_docs: list[KnowledgeDocument] = [
    KnowledgeDocument(
        id="doc-1", title="Стандартная операционная процедура (СОП) — Онбординг",
        category="СОП", uploaded_by="Анна Смирнова", uploaded_at=datetime(2025, 1, 15),
        content="""
СОП: Онбординг нового сотрудника

1. Подготовка до выхода:
   - HR отправляет приветственное письмо за 3 дня до выхода
   - IT готовит рабочее место и доступы
   - Руководитель назначает наставника

2. Первый день:
   - Встреча с HR: оформление документов, знакомство с офисом
   - Встреча с руководителем: обзор роли и ожиданий
   - Настройка рабочего места с IT

3. Первая неделя:
   - Знакомство с командой (1-на-1 встречи)
   - Обзор ключевых процессов и инструментов
   - Назначение первой задачи

4. Первый месяц:
   - Еженедельные встречи с наставником
   - Участие в командных ритуалах
   - Промежуточная оценка прогресса
""",
    ),
    KnowledgeDocument(
        id="doc-2", title="Правила внутреннего трудового распорядка (ПВТР)",
        category="ПВТР", uploaded_by="Анна Смирнова", uploaded_at=datetime(2025, 2, 1),
        content="""
Правила внутреннего трудового распорядка

Рабочее время:
- Стандартный график: 09:00 — 18:00 (пн-пт)
- Гибкое начало рабочего дня: 08:00 — 10:00
- Обеденный перерыв: 1 час (12:00 — 14:00 по выбору)
- Удалённая работа: до 2 дней в неделю по согласованию с руководителем

Отпуска:
- Ежегодный оплачиваемый отпуск: 28 календарных дней
- Заявление на отпуск подаётся за 14 дней
- Больничный: с первого дня с уведомлением руководителя

Дресс-код:
- Business casual в офисе
- Свободная форма по пятницам и при удалённой работе

Корпоративная культура:
- Ежемесячные all-hands встречи
- Еженедельные командные стендапы
- Квартальные team building мероприятия
""",
    ),
    KnowledgeDocument(
        id="doc-3", title="Локальный нормативный акт (ЛНА) — Информационная безопасность",
        category="ЛНА", uploaded_by="Дмитрий Козлов", uploaded_at=datetime(2025, 3, 10),
        content="""
ЛНА: Политика информационной безопасности

Доступы:
- Все доступы предоставляются по принципу минимальных привилегий
- Запрос доступов через Jira Service Desk
- Двухфакторная аутентификация обязательна для всех систем
- Пароли: минимум 12 символов, смена каждые 90 дней

Работа с данными:
- Конфиденциальные данные запрещено хранить на личных устройствах
- Передача данных только через корпоративные каналы
- Обязательное шифрование при передаче данных клиентов

VPN:
- Обязательно при работе вне офиса
- Настройка через IT-отдел в первый рабочий день

Инциденты:
- О любых подозрительных действиях сообщать в IT немедленно
- Контакт: security@company.ru или Slack #security
""",
    ),
    KnowledgeDocument(
        id="doc-4", title="Гайд по инструментам разработки",
        category="Гайд", uploaded_by="Сергей Волков", uploaded_at=datetime(2025, 4, 1),
        content="""
Инструменты разработки

Git:
- Репозиторий: GitLab (gitlab.company.ru)
- Ветвление: Git Flow (feature/, bugfix/, release/)
- Code review: минимум 2 approve для merge в main

CI/CD:
- GitLab CI для автоматизации
- Staging деплой — автоматический при merge в develop
- Production деплой — через MR в main + approve тимлида

Коммуникация:
- Slack — основной мессенджер
- Jira — управление задачами
- Confluence — документация

Мониторинг:
- Grafana — дашборды и алерты
- Sentry — отслеживание ошибок
""",
    ),
    KnowledgeDocument(
        id="doc-5", title="Гайд по работе с CRM Bitrix24",
        category="Гайд", uploaded_by="Наталья Белова", uploaded_at=datetime(2025, 5, 20),
        content="""
Гайд по CRM Bitrix24

Основы:
- Вход через SSO: crm.company.ru
- Каждый менеджер работает в своей воронке
- Лиды назначаются автоматически по ротации

Воронка продаж:
1. Новый лид → Квалификация (до 24 часов)
2. Квалификация → Демо (назначить встречу)
3. Демо → Предложение (отправить КП в течение 2 дней)
4. Предложение → Переговоры (до 14 дней)
5. Переговоры → Закрытие (сделка или отказ)

Правила:
- Все звонки фиксируются в CRM
- Комментарии к каждому этапу обязательны
- Еженедельный отчёт по воронке для руководителя
- KPI: конверсия из лида в сделку > 15%

Интеграции:
- Телефония через Mango Office
- Почта синхронизируется автоматически
- Календарь Google Calendar
""",
    ),
    KnowledgeDocument(
        id="doc-6", title="Дизайн-система компании — UI Kit v3",
        category="Гайд", uploaded_by="Татьяна Кузнецова", uploaded_at=datetime(2025, 6, 5),
        content="""
Дизайн-система UI Kit v3

Figma:
- Библиотека: figma.com/company-ui-kit-v3
- Все новые макеты строятся только на основе UI Kit
- Запрещено создавать кастомные компоненты без согласования

Цвета:
- Primary: #6366F1 (Indigo 500)
- Secondary: #A855F7 (Purple 500)
- Success: #22C55E, Warning: #EAB308, Error: #EF4444
- Нейтральные: шкала Slate (50-950)

Типографика:
- Заголовки: Inter, 700-800
- Текст: Inter, 400-500
- Размеры: 12/14/16/20/24/32/40px

Компоненты:
- Кнопки: Primary, Secondary, Outline, Ghost
- Карточки: с тенью, со стеклянным эффектом
- Таблицы: с сортировкой, пагинацией
- Формы: валидация, состояния ошибок

Иконки:
- Lucide Icons (lucide.dev)
- Размеры: 16/20/24px
- Stroke: 1.5-2px
""",
    ),
    KnowledgeDocument(
        id="doc-7", title="СОП — Процесс увольнения (оффбординг)",
        category="СОП", uploaded_by="Виктория Лебедева", uploaded_at=datetime(2025, 7, 1),
        content="""
СОП: Оффбординг сотрудника

Инициация:
- Заявление об увольнении подаётся за 14 календарных дней
- HR регистрирует заявление в 1С в день подачи
- Руководитель информирует команду

Передача дел (дни 1-10):
- Сотрудник составляет список текущих задач и проектов
- Руководитель назначает ответственных за каждую задачу
- Документация передаётся в Confluence

Возврат имущества (последний день):
- Ноутбук, монитор, пропуск, ключи
- Подписание акта приёма-передачи

Закрытие доступов (последний день, IT):
- Блокировка учётных записей: AD, почта, Slack, Jira, GitLab
- Отключение VPN
- Удаление из групп рассылки

Финальные шаги:
- Выходное интервью с HR
- Расчёт и документы в бухгалтерии
- Рекомендательное письмо (по запросу)
""",
    ),
    KnowledgeDocument(
        id="doc-8", title="ЛНА — Политика обработки персональных данных",
        category="ЛНА", uploaded_by="Виктория Лебедева", uploaded_at=datetime(2025, 8, 15),
        content="""
ЛНА: Политика обработки персональных данных (152-ФЗ)

Общие положения:
- Компания является оператором персональных данных
- Обработка осуществляется с согласия субъекта
- Согласие оформляется в письменной форме при приёме на работу

Категории данных:
- ФИО, дата рождения, паспортные данные
- Контактная информация (телефон, email, адрес)
- Данные трудовой деятельности (должность, оклад, стаж)
- Медицинские данные (только для целей охраны труда)

Хранение:
- Электронные данные — в защищённой базе данных (шифрование AES-256)
- Бумажные носители — в сейфе HR-отдела
- Срок хранения: 75 лет для трудовых документов, 5 лет для прочих

Права субъекта:
- Запрос на доступ к своим данным — обработка до 30 дней
- Запрос на удаление — при увольнении (кроме обязательных к хранению)
- Отзыв согласия — в письменной форме

Ответственный: Виктория Лебедева (dpo@company.ru)
""",
    ),
]

# ── Chat history (mock) ───────────────────────────────────

chat_history: list[ChatMessage] = []
