from pydantic import BaseModel
from datetime import datetime, date
from enum import Enum
from typing import Optional


class TaskStatus(str, Enum):
    WAITING = "waiting"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    OVERDUE = "overdue"


class SLAStatus(str, Enum):
    GREEN = "green"
    YELLOW = "yellow"
    RED = "red"


class Role(str, Enum):
    HR = "hr"
    IT = "it"
    MANAGER = "manager"
    MENTOR = "mentor"
    NEWCOMER = "newcomer"


class Stage(BaseModel):
    id: str
    name: str
    description: str
    order: int


class TemplateTask(BaseModel):
    id: str
    title: str
    description: str
    stage_id: str
    responsible_role: Role
    deadline_days: int  # days from onboarding start


class OnboardingTemplate(BaseModel):
    id: str
    role_name: str
    description: str
    stages: list[Stage]
    tasks: list[TemplateTask]


class Employee(BaseModel):
    id: str
    full_name: str
    email: str
    role: Role
    department: str
    avatar_url: Optional[str] = None


class OnboardingTask(BaseModel):
    id: str
    onboarding_id: str
    title: str
    description: str
    stage_id: str
    stage_name: str
    assigned_to: str  # employee id
    assigned_to_name: str
    responsible_role: Role
    deadline: date
    status: TaskStatus
    sla_status: SLAStatus
    newcomer_id: str
    newcomer_name: str


class Onboarding(BaseModel):
    id: str
    newcomer_id: str
    newcomer_name: str
    template_id: str
    template_role: str
    start_date: date
    current_stage: str
    progress: int  # percentage
    tasks: list[OnboardingTask]


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime


class KnowledgeDocument(BaseModel):
    id: str
    title: str
    category: str
    content: str
    uploaded_by: str
    uploaded_at: datetime
