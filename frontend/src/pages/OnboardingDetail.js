import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useUser } from '../context/UserContext';
import CustomSelect from '../components/CustomSelect';
import './OnboardingDetail.css';

const STATUS_LABELS = { waiting: 'Ожидает', in_progress: 'В работе', completed: 'Выполнено', overdue: 'Просрочено' };
const STATUS_BADGE = { waiting: 'badge-purple', in_progress: 'badge-yellow', completed: 'badge-green', overdue: 'badge-red' };
const SLA_LABELS = { green: '🟢 В срок', yellow: '🟡 Скоро дедлайн', red: '🔴 Просрочено' };
const STATUS_OPTIONS = [
  { value: 'waiting', label: 'Ожидает', color: 'var(--purple)', bg: 'var(--purple-light)', dot: 'var(--purple)' },
  { value: 'in_progress', label: 'В работе', color: 'var(--yellow)', bg: 'var(--yellow-light)', dot: 'var(--yellow)' },
  { value: 'completed', label: 'Выполнено', color: 'var(--green)', bg: 'var(--green-light)', dot: 'var(--green)' },
  { value: 'overdue', label: 'Просрочено', color: 'var(--red)', bg: 'var(--red-light)', dot: 'var(--red)' },
];

// ── Task Detail Modal ──
function TaskModal({ task, onClose, isHR, onStatusChange }) {
  const [pinged, setPinged] = useState({});

  const daysLeft = Math.ceil((new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24));
  const deadlineText = daysLeft < 0 ? `Просрочена на ${Math.abs(daysLeft)} дн.` : daysLeft === 0 ? 'Сегодня' : `Через ${daysLeft} дн.`;

  const handlePing = (name) => {
    setPinged(p => ({ ...p, [name]: true }));
    setTimeout(() => setPinged(p => ({ ...p, [name]: false })), 3000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="od-task-modal" onClick={e => e.stopPropagation()}>
        <div className="odm-header">
          <div>
            <h2>{task.title}</h2>
            <p className="odm-desc">{task.description}</p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={onClose}>✕</button>
        </div>

        <div className="odm-grid">
          <div className="odm-field">
            <span className="odm-label">Статус</span>
            <CustomSelect variant="status" value={task.status} options={STATUS_OPTIONS}
              onChange={(v) => onStatusChange(task.id, v)} />
          </div>
          <div className="odm-field">
            <span className="odm-label">SLA</span>
            <span>{SLA_LABELS[task.sla_status]}</span>
          </div>
          <div className="odm-field">
            <span className="odm-label">Дедлайн</span>
            <span className={daysLeft < 0 ? 'odm-red' : daysLeft <= 2 ? 'odm-yellow' : ''}>
              {new Date(task.deadline).toLocaleDateString('ru')} · {deadlineText}
            </span>
          </div>
          <div className="odm-field">
            <span className="odm-label">Этап</span>
            <span className="badge badge-primary">{task.stage_name}</span>
          </div>
        </div>

        <div className="odm-section">
          <h3>Участники</h3>
          <div className="odm-people">
            <div className="odm-person">
              <div className="odm-avatar">{task.newcomer_name.split(' ').map(n => n[0]).join('')}</div>
              <div className="odm-person-info">
                <div className="odm-person-name">{task.newcomer_name}</div>
                <div className="odm-person-role">Новичок</div>
              </div>
              {isHR && (
                <button className={`btn btn-sm odm-ping ${pinged[task.newcomer_name] ? 'pinged' : ''}`}
                  onClick={() => handlePing(task.newcomer_name)}>
                  {pinged[task.newcomer_name] ? '✓' : '📨 Пинг'}
                </button>
              )}
            </div>
            <div className="odm-person">
              <div className="odm-avatar odm-avatar-green">{task.assigned_to_name.split(' ').map(n => n[0]).join('')}</div>
              <div className="odm-person-info">
                <div className="odm-person-name">{task.assigned_to_name}</div>
                <div className="odm-person-role">Ответственный ({task.responsible_role})</div>
              </div>
              {isHR && (
                <button className={`btn btn-sm odm-ping ${pinged[task.assigned_to_name] ? 'pinged' : ''}`}
                  onClick={() => handlePing(task.assigned_to_name)}>
                  {pinged[task.assigned_to_name] ? '✓' : '📨 Пинг'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main ──
export default function OnboardingDetail() {
  const { id } = useParams();
  const { isHR } = useUser();
  const [data, setData] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => { api.getOnboarding(id).then(setData); }, [id]);

  if (!data) return <div className="loading">Загрузка...</div>;

  const stages = [...new Set(data.tasks.map((t) => t.stage_name))];

  const handleStatusChange = async (taskId, newStatus) => {
    await api.updateTaskStatus(taskId, newStatus);
    const fresh = await api.getOnboarding(id);
    setData(fresh);
    if (selectedTask && selectedTask.id === taskId) {
      const updated = fresh.tasks.find(t => t.id === taskId);
      if (updated) setSelectedTask(updated);
    }
  };

  return (
    <div className="onboarding-detail">
      <Link to="/onboardings" className="back-link">← Назад к онбордингам</Link>

      <div className="detail-header card">
        <div className="detail-header-top">
          <div className="avatar-circle avatar-lg">
            {data.newcomer_name.split(' ').map((n) => n[0]).join('')}
          </div>
          <div>
            <h1>{data.newcomer_name}</h1>
            <div className="detail-meta">
              <span className="badge badge-primary">{data.template_role}</span>
              <span>Начало: {new Date(data.start_date).toLocaleDateString('ru')}</span>
              <span>Этап: <strong>{data.current_stage}</strong></span>
            </div>
          </div>
          <div className="detail-progress">
            <div className="progress-circle">
              <span className="progress-value">{data.progress}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="stages-timeline">
        {stages.map((stageName) => {
          const stageTasks = data.tasks.filter((t) => t.stage_name === stageName);
          const allDone = stageTasks.every((t) => t.status === 'completed');
          const anyOverdue = stageTasks.some((t) => t.status === 'overdue');

          return (
            <div key={stageName} className={`stage-section ${allDone ? 'stage-done' : ''}`}>
              <div className="stage-header">
                <div className={`stage-indicator ${allDone ? 'done' : anyOverdue ? 'overdue' : 'active'}`}>
                  {allDone ? '✓' : ''}
                </div>
                <h2>{stageName}</h2>
                <span className="stage-progress">
                  {stageTasks.filter((t) => t.status === 'completed').length}/{stageTasks.length}
                </span>
              </div>

              <div className="stage-tasks-list">
                {stageTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`detail-task ${task.status === 'completed' ? 'task-completed' : ''}`}
                    onClick={() => setSelectedTask(task)}
                    style={{ cursor: 'pointer' }}
                  >
                    {task.status === 'completed'
                      ? <span className="sla-done-sm">✓</span>
                      : <div className={`sla-dot ${task.sla_status === 'green' ? 'sla-green' : task.sla_status === 'yellow' ? 'sla-yellow' : 'sla-red'}`}></div>
                    }
                    <div className="detail-task-info">
                      <div className="detail-task-title">{task.title}</div>
                      <div className="detail-task-desc">{task.description}</div>
                      <div className="detail-task-meta">
                        {task.assigned_to_name} · до {new Date(task.deadline).toLocaleDateString('ru')}
                      </div>
                    </div>
                    <div className="detail-task-actions">
                      <span className={`badge ${STATUS_BADGE[task.status]}`}>
                        {STATUS_LABELS[task.status]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          isHR={isHR}
          onClose={() => setSelectedTask(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
