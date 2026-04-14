import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useUser } from '../context/UserContext';
import CustomSelect from '../components/CustomSelect';
import './TaskBoard.css';

const STATUS_OPTIONS = [
  { value: 'waiting', label: 'Ожидает', color: 'var(--purple)', bg: 'var(--purple-light)', dot: 'var(--purple)' },
  { value: 'in_progress', label: 'В работе', color: 'var(--yellow)', bg: 'var(--yellow-light)', dot: 'var(--yellow)' },
  { value: 'completed', label: 'Выполнено', color: 'var(--green)', bg: 'var(--green-light)', dot: 'var(--green)' },
  { value: 'overdue', label: 'Просрочено', color: 'var(--red)', bg: 'var(--red-light)', dot: 'var(--red)' },
];

const ALL_STATUS_OPTIONS = [{ value: '', label: 'Все статусы' }, ...STATUS_OPTIONS];

const SLA_OPTIONS = [
  { value: '', label: 'SLA' },
  { value: 'green', label: 'В срок', dot: 'var(--green)' },
  { value: 'yellow', label: 'Скоро дедлайн', dot: 'var(--yellow)' },
  { value: 'red', label: 'Просрочено', dot: 'var(--red)' },
];

const SLA_CLASS = { green: 'sla-green', yellow: 'sla-yellow', red: 'sla-red' };
const STATUS_LABELS = { waiting: 'Ожидает', in_progress: 'В работе', completed: 'Выполнено', overdue: 'Просрочено' };
const SLA_LABELS = { green: '🟢 В срок', yellow: '🟡 Скоро дедлайн', red: '🔴 Просрочено' };
const PING_STORAGE = 'onboarding_autopings';

// ── Task Detail Modal ──
function TaskDetailModal({ task, onClose, onStatusChange, isHR }) {
  const [onboarding, setOnboarding] = useState(null);
  const [pinged, setPinged] = useState({});

  useEffect(() => {
    api.getOnboarding(task.onboarding_id).then(setOnboarding);
  }, [task.onboarding_id]);

  const daysLeft = Math.ceil((new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24));
  const deadlineLabel = daysLeft < 0
    ? `Просрочена на ${Math.abs(daysLeft)} дн.`
    : daysLeft === 0 ? 'Сегодня' : `Через ${daysLeft} дн.`;

  const handlePing = (name) => {
    setPinged(p => ({ ...p, [name]: true }));
    setTimeout(() => setPinged(p => ({ ...p, [name]: false })), 3000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="task-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tdm-header">
          <div>
            <h2>{task.title}</h2>
            <p className="tdm-desc">{task.description}</p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={onClose}>✕</button>
        </div>

        <div className="tdm-grid">
          <div className="tdm-field">
            <span className="tdm-label">Статус</span>
            <CustomSelect variant="status" value={task.status} options={STATUS_OPTIONS}
              onChange={(v) => onStatusChange(task.id, v)} />
          </div>
          <div className="tdm-field">
            <span className="tdm-label">SLA</span>
            <span>{SLA_LABELS[task.sla_status]}</span>
          </div>
          <div className="tdm-field">
            <span className="tdm-label">Дедлайн</span>
            <span className={daysLeft < 0 ? 'tdm-overdue' : daysLeft <= 2 ? 'tdm-warn' : ''}>
              {new Date(task.deadline).toLocaleDateString('ru')} · {deadlineLabel}
            </span>
          </div>
          <div className="tdm-field">
            <span className="tdm-label">Этап</span>
            <span className="badge badge-primary">{task.stage_name}</span>
          </div>
        </div>

        <div className="tdm-section">
          <h3>Участники</h3>
          <div className="tdm-people">
            <div className="tdm-person">
              <div className="tdm-avatar">{task.newcomer_name.split(' ').map(n => n[0]).join('')}</div>
              <div>
                <div className="tdm-person-name">{task.newcomer_name}</div>
                <div className="tdm-person-role">Новичок</div>
              </div>
              {isHR && <button className={`btn btn-sm tdm-ping-btn ${pinged[task.newcomer_name] ? 'pinged' : ''}`} onClick={() => handlePing(task.newcomer_name)}>{pinged[task.newcomer_name] ? '✓' : '📨 Пинг'}</button>}
            </div>
            <div className="tdm-person">
              <div className="tdm-avatar tdm-avatar-resp">{task.assigned_to_name.split(' ').map(n => n[0]).join('')}</div>
              <div>
                <div className="tdm-person-name">{task.assigned_to_name}</div>
                <div className="tdm-person-role">Ответственный ({task.responsible_role})</div>
              </div>
              {isHR && <button className={`btn btn-sm tdm-ping-btn ${pinged[task.assigned_to_name] ? 'pinged' : ''}`} onClick={() => handlePing(task.assigned_to_name)}>{pinged[task.assigned_to_name] ? '✓' : '📨 Пинг'}</button>}
            </div>
          </div>
        </div>

        {onboarding && (
          <div className="tdm-section tdm-onb-section">
            <h3>Онбординг</h3>
            <div className="tdm-onb-row">
              <span>{onboarding.newcomer_name}</span>
              <span className="badge badge-primary">{onboarding.template_role}</span>
              <span>Прогресс: {onboarding.progress}%</span>
            </div>
            <div className="progress-bar progress-primary" style={{ margin: '8px 0' }}>
              <div className="progress-fill" style={{ width: `${onboarding.progress}%` }}></div>
            </div>
            <Link to={`/onboardings/${onboarding.id}`} className="btn btn-outline btn-sm" onClick={onClose}>
              Открыть онбординг →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Auto-Ping Settings Modal ──
function AutoPingModal({ onClose }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(PING_STORAGE);
      return saved ? JSON.parse(saved) : { enabled: true, daysBefore: 2, channels: ['slack', 'email'] };
    } catch { return { enabled: true, daysBefore: 2, channels: ['slack', 'email'] }; }
  });

  const save = () => {
    localStorage.setItem(PING_STORAGE, JSON.stringify(settings));
    onClose();
  };

  const toggleChannel = (ch) => {
    setSettings(prev => ({
      ...prev,
      channels: prev.channels.includes(ch)
        ? prev.channels.filter(c => c !== ch)
        : [...prev.channels, ch],
    }));
  };

  const DAYS_OPTIONS = [
    { value: 1, label: 'За 1 день' },
    { value: 2, label: 'За 2 дня' },
    { value: 3, label: 'За 3 дня' },
    { value: 5, label: 'За 5 дней' },
    { value: 7, label: 'За 7 дней' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="ping-settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="psm-header">
          <h2>Автопинг настройки</h2>
          <button className="btn btn-outline btn-sm" onClick={onClose}>✕</button>
        </div>

        <p className="psm-desc">
          Автоматическое уведомление ответственных о приближающихся дедлайнах.
        </p>

        <div className="psm-toggle-row">
          <span>Автопинг</span>
          <button
            className={`psm-toggle ${settings.enabled ? 'on' : ''}`}
            onClick={() => setSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
          >
            <span className="psm-toggle-knob"></span>
          </button>
        </div>

        {settings.enabled && (
          <>
            <div className="psm-field">
              <label>Пинговать за сколько до дедлайна</label>
              <div className="psm-days">
                {DAYS_OPTIONS.map(d => (
                  <button
                    key={d.value}
                    className={`psm-day-btn ${settings.daysBefore === d.value ? 'active' : ''}`}
                    onClick={() => setSettings(prev => ({ ...prev, daysBefore: d.value }))}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="psm-field">
              <label>Каналы уведомлений</label>
              <div className="psm-channels">
                {[
                  { id: 'slack', icon: '💬', label: 'Slack' },
                  { id: 'email', icon: '📧', label: 'Email' },
                  { id: 'system', icon: '🔔', label: 'В системе' },
                ].map(ch => (
                  <button
                    key={ch.id}
                    className={`psm-channel ${settings.channels.includes(ch.id) ? 'active' : ''}`}
                    onClick={() => toggleChannel(ch.id)}
                  >
                    <span>{ch.icon}</span>
                    <span>{ch.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="psm-preview">
              <div className="psm-preview-title">Пример уведомления:</div>
              <div className="psm-preview-msg">
                ⚠️ Задача <strong>«Ревью первого PR»</strong> для <strong>Мария Иванова</strong> — дедлайн через {settings.daysBefore} дн.
                Ответственный: Сергей Волков.
              </div>
            </div>
          </>
        )}

        <button className="btn btn-primary psm-save" onClick={save}>
          Сохранить настройки
        </button>
      </div>
    </div>
  );
}

// ── Add Employee Modal ──
function AddEmployeeModal({ onClose, onAdd }) {
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', template: '', department: '' });

  useEffect(() => { api.getTemplates().then(setTemplates); }, []);

  const deptOptions = [
    { value: '', label: 'Выберите отдел' },
    { value: 'Разработка', label: 'Разработка' },
    { value: 'Маркетинг', label: 'Маркетинг' },
    { value: 'Продажи', label: 'Продажи' },
    { value: 'Дизайн', label: 'Дизайн' },
    { value: 'IT', label: 'IT' },
    { value: 'HR', label: 'HR' },
  ];

  const tmplOptions = [
    { value: '', label: 'Выберите шаблон' },
    ...templates.map(t => ({ value: t.id, label: `${t.role_name} (${t.stages.length} этапов, ${t.tasks.length} задач)` })),
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.department || !form.template) return;
    onAdd(form);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="add-employee-modal" onClick={(e) => e.stopPropagation()}>
        <div className="aem-header">
          <h2>Запустить онбординг</h2>
          <button className="btn btn-outline btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="aem-field">
            <label>ФИО нового сотрудника</label>
            <input type="text" placeholder="Иван Петров" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="aem-field">
            <label>Email</label>
            <input type="email" placeholder="ivan@company.ru" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="aem-field">
            <label>Отдел</label>
            <CustomSelect variant="form" value={form.department} options={deptOptions}
              placeholder="Выберите отдел" onChange={v => setForm({ ...form, department: v })} />
          </div>
          <div className="aem-field">
            <label>Шаблон онбординга</label>
            <CustomSelect variant="form" value={form.template} options={tmplOptions}
              placeholder="Выберите шаблон" onChange={v => setForm({ ...form, template: v })} />
          </div>
          <button type="submit" className="btn btn-primary aem-submit">Запустить онбординг</button>
        </form>
      </div>
    </div>
  );
}

// ── Main TaskBoard ──
export default function TaskBoard() {
  const { user, isHR } = useUser();
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filterAssigned, setFilterAssigned] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSla, setFilterSla] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPingSettings, setShowPingSettings] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    setTasks([]); setFilterAssigned(''); setFilterStatus(''); setFilterSla('');
    api.getTasks().then(setTasks);
    api.getEmployees().then(setEmployees);
  }, [user?.id]);

  const handleStatusChange = async (taskId, newStatus) => {
    await api.updateTaskStatus(taskId, newStatus);
    const updated = await api.getTasks();
    setTasks(updated);
    if (selectedTask && selectedTask.id === taskId) {
      const fresh = updated.find(t => t.id === taskId);
      if (fresh) setSelectedTask(fresh);
    }
  };

  const handleAddEmployee = (form) => {
    alert(`Онбординг запущен!\n\nСотрудник: ${form.name}\nEmail: ${form.email}\nОтдел: ${form.department}\n\n(В демо-режиме данные не сохраняются)`);
  };

  const filtered = tasks.filter(t => {
    if (filterAssigned && t.assigned_to !== filterAssigned) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterSla && t.sla_status !== filterSla) return false;
    return true;
  });

  const assigneeOptions = [
    { value: '', label: 'Все ответственные' },
    ...[...new Set(tasks.map(t => t.assigned_to))].map(id => {
      const emp = employees.find(e => e.id === id);
      return { value: id, label: emp ? emp.full_name : id };
    }),
  ];

  return (
    <div className="taskboard">
      <div className="page-header">
        <h1>Доска задач</h1>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <p>Задачи по всем активным онбордингам</p>
{/* Кнопки перенесены на страницу Онбординги */}
        </div>
      </div>

      <div className="filters">
        <CustomSelect value={filterAssigned} options={assigneeOptions}
          placeholder="Все ответственные" onChange={setFilterAssigned} />
        <CustomSelect value={filterStatus} options={ALL_STATUS_OPTIONS}
          placeholder="Все статусы" onChange={setFilterStatus} />
        <CustomSelect value={filterSla} options={SLA_OPTIONS}
          placeholder="Все SLA" onChange={setFilterSla} />
        <div className="task-count">{filtered.length} задач</div>
      </div>

      <div className="card table-container">
        <table>
          <thead>
            <tr>
              <th>SLA</th>
              <th>Задача</th>
              <th>Новичок</th>
              <th>Этап</th>
              <th>Ответственный</th>
              <th>Дедлайн</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(task => (
              <tr key={task.id} className="task-row" onClick={() => setSelectedTask(task)}>
                <td>
                  {task.status === 'completed'
                    ? <span className="sla-done">✓</span>
                    : <span className={`sla-dot ${SLA_CLASS[task.sla_status] || ''}`}></span>
                  }
                </td>
                <td>
                  <div className="task-title">{task.title}</div>
                  <div className="task-desc">{task.description}</div>
                </td>
                <td>{task.newcomer_name}</td>
                <td><span className="badge badge-primary">{task.stage_name}</span></td>
                <td>{task.assigned_to_name}</td>
                <td>{new Date(task.deadline).toLocaleDateString('ru')}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <CustomSelect variant="status" value={task.status} options={STATUS_OPTIONS}
                    onChange={v => handleStatusChange(task.id, v)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onStatusChange={handleStatusChange}
          isHR={isHR}
        />
      )}
{/* AddEmployee and AutoPing moved to Onboardings page */}
    </div>
  );
}
