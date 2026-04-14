import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useUser } from '../context/UserContext';
import CustomSelect from '../components/CustomSelect';
import './Onboardings.css';

const PING_STORAGE = 'onboarding_autopings';

// ── Auto-Ping Settings ──
function AutoPingModal({ onClose }) {
  const [settings, setSettings] = useState(() => {
    try { const s = localStorage.getItem(PING_STORAGE); return s ? JSON.parse(s) : { enabled: true, daysBefore: 2, channels: ['slack', 'email'] }; }
    catch { return { enabled: true, daysBefore: 2, channels: ['slack', 'email'] }; }
  });
  const save = () => { localStorage.setItem(PING_STORAGE, JSON.stringify(settings)); onClose(); };
  const toggleCh = (ch) => setSettings(p => ({ ...p, channels: p.channels.includes(ch) ? p.channels.filter(c => c !== ch) : [...p.channels, ch] }));
  const DAYS = [{ v: 1, l: '1 день' }, { v: 2, l: '2 дня' }, { v: 3, l: '3 дня' }, { v: 5, l: '5 дней' }, { v: 7, l: '7 дней' }];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="onb-modal" onClick={e => e.stopPropagation()}>
        <div className="onb-modal-header"><h2>Автопинг настройки</h2><button className="btn btn-outline btn-sm" onClick={onClose}>✕</button></div>
        <p className="onb-modal-desc">Автоматическое уведомление ответственных о приближающихся дедлайнах.</p>
        <div className="ap-toggle-row">
          <span>Автопинг</span>
          <button className={`ap-toggle ${settings.enabled ? 'on' : ''}`} onClick={() => setSettings(p => ({ ...p, enabled: !p.enabled }))}>
            <span className="ap-toggle-knob"></span>
          </button>
        </div>
        {settings.enabled && (<>
          <div className="ap-field">
            <label>Пинговать за</label>
            <div className="ap-pills">{DAYS.map(d => (
              <button key={d.v} className={`ap-pill ${settings.daysBefore === d.v ? 'active' : ''}`}
                onClick={() => setSettings(p => ({ ...p, daysBefore: d.v }))}>{d.l}</button>
            ))}</div>
          </div>
          <div className="ap-field">
            <label>Каналы</label>
            <div className="ap-channels">
              {[{ id: 'slack', icon: '💬', l: 'Slack' }, { id: 'email', icon: '📧', l: 'Email' }, { id: 'system', icon: '🔔', l: 'В системе' }].map(ch => (
                <button key={ch.id} className={`ap-channel ${settings.channels.includes(ch.id) ? 'active' : ''}`}
                  onClick={() => toggleCh(ch.id)}><span>{ch.icon}</span><span>{ch.l}</span></button>
              ))}
            </div>
          </div>
          <div className="ap-preview">
            <div className="ap-preview-title">Пример:</div>
            <div className="ap-preview-msg">⚠️ <strong>«Ревью первого PR»</strong> для <strong>Мария Иванова</strong> — дедлайн через {settings.daysBefore} дн. Ответственный: Сергей Волков.</div>
          </div>
        </>)}
        <button className="btn btn-primary onb-modal-submit" onClick={save}>Сохранить</button>
      </div>
    </div>
  );
}

// ── Create Onboarding Modal with Task Editor ──
function CreateOnboardingModal({ onClose }) {
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', department: '', templateId: '' });
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: '', stage_id: '', responsible_role: 'hr', deadline_days: 1 });

  useEffect(() => { api.getTemplates().then(setTemplates); }, []);

  const selectedTemplate = templates.find(t => t.id === form.templateId);

  // When template changes, load its tasks
  const handleTemplateChange = (val) => {
    setForm(f => ({ ...f, templateId: val }));
    const tmpl = templates.find(t => t.id === val);
    if (tmpl) {
      setTasks(tmpl.tasks.map(t => ({ ...t, _enabled: true })));
    } else {
      setTasks([]);
    }
  };

  const toggleTask = (taskId) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, _enabled: !t._enabled } : t));
  };

  const addCustomTask = () => {
    if (!newTask.title || !newTask.stage_id) return;
    const id = 'custom-' + Date.now();
    setTasks(prev => [...prev, { ...newTask, id, _enabled: true, description: 'Пользовательская задача' }]);
    setNewTask({ title: '', stage_id: '', responsible_role: 'hr', deadline_days: 1 });
  };

  const removeTask = (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.templateId) return;
    try {
      await api.createOnboarding({
        name: form.name,
        email: form.email,
        department: form.department,
        template_id: form.templateId,
      });
      onClose();
      window.location.reload();
    } catch (err) {
      alert('Ошибка: ' + err.message);
    }
  };

  const deptOptions = [{ value: '', label: 'Выберите отдел' }, ...['Разработка', 'Маркетинг', 'Продажи', 'Дизайн', 'IT', 'HR'].map(d => ({ value: d, label: d }))];
  const tmplOptions = [{ value: '', label: 'Выберите шаблон' }, ...templates.map(t => ({ value: t.id, label: `${t.role_name} (${t.tasks.length} задач)` }))];
  const roleOptions = [{ value: 'hr', label: 'HR' }, { value: 'it', label: 'IT' }, { value: 'manager', label: 'Руководитель' }, { value: 'mentor', label: 'Наставник' }];
  const ROLE_ICONS = { hr: '👤', it: '💻', manager: '👔', mentor: '🎓' };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="onb-modal onb-modal-wide" onClick={e => e.stopPropagation()}>
        <div className="onb-modal-header"><h2>Запустить онбординг</h2><button className="btn btn-outline btn-sm" onClick={onClose}>✕</button></div>
        <form onSubmit={handleSubmit}>
          <div className="co-grid">
            <div className="co-field">
              <label>ФИО</label>
              <input type="text" placeholder="Иван Петров" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="co-field">
              <label>Email</label>
              <input type="email" placeholder="ivan@company.ru" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="co-field">
              <label>Отдел</label>
              <CustomSelect variant="form" value={form.department} options={deptOptions} placeholder="Отдел" onChange={v => setForm({ ...form, department: v })} />
            </div>
            <div className="co-field">
              <label>Шаблон</label>
              <CustomSelect variant="form" value={form.templateId} options={tmplOptions} placeholder="Шаблон" onChange={handleTemplateChange} />
            </div>
          </div>

          {selectedTemplate && (
            <div className="co-tasks-editor">
              <h3>Задачи онбординга <span className="co-tasks-count">{tasks.filter(t => t._enabled).length} из {tasks.length}</span></h3>

              {selectedTemplate.stages.map(stage => {
                const stageTasks = tasks.filter(t => t.stage_id === stage.id);
                if (!stageTasks.length) return null;
                return (
                  <div key={stage.id} className="co-stage">
                    <div className="co-stage-label">{stage.name}</div>
                    {stageTasks.map(task => (
                      <div key={task.id} className={`co-task ${!task._enabled ? 'co-task-disabled' : ''}`}>
                        <button type="button" className={`co-task-toggle ${task._enabled ? 'on' : ''}`}
                          onClick={() => toggleTask(task.id)}>
                          {task._enabled ? '✓' : ''}
                        </button>
                        <span className="co-task-icon">{ROLE_ICONS[task.responsible_role] || '📋'}</span>
                        <div className="co-task-info">
                          <span className="co-task-title">{task.title}</span>
                          <span className="co-task-meta">{roleOptions.find(r => r.value === task.responsible_role)?.label} · {task.deadline_days} дн.</span>
                        </div>
                        {task.id.startsWith('custom-') && (
                          <button type="button" className="co-task-remove" onClick={() => removeTask(task.id)}>✕</button>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}

              <div className="co-add-task">
                <h4>+ Добавить задачу</h4>
                <div className="co-add-row">
                  <input type="text" placeholder="Название задачи" value={newTask.title}
                    onChange={e => setNewTask({ ...newTask, title: e.target.value })} />
                  <CustomSelect variant="form" value={newTask.stage_id}
                    options={[{ value: '', label: 'Этап' }, ...selectedTemplate.stages.map(s => ({ value: s.id, label: s.name }))]}
                    placeholder="Этап" onChange={v => setNewTask({ ...newTask, stage_id: v })} />
                  <CustomSelect variant="form" value={newTask.responsible_role}
                    options={roleOptions} placeholder="Роль"
                    onChange={v => setNewTask({ ...newTask, responsible_role: v })} />
                  <input type="number" min="1" max="90" value={newTask.deadline_days} style={{ width: 60 }}
                    onChange={e => setNewTask({ ...newTask, deadline_days: Number(e.target.value) })} />
                  <button type="button" className="btn btn-outline btn-sm" onClick={addCustomTask}>+</button>
                </div>
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary onb-modal-submit" disabled={!form.name || !form.templateId}>
            Запустить онбординг ({tasks.filter(t => t._enabled).length} задач)
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main ──
export default function Onboardings() {
  const { user, isHR } = useUser();
  const [onboardings, setOnboardings] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showPing, setShowPing] = useState(false);

  useEffect(() => {
    setOnboardings([]);
    api.getOnboardings().then(setOnboardings);
  }, [user?.id]);

  return (
    <div className="onboardings-page">
      <div className="page-header">
        <h1>Активные онбординги</h1>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p>Все текущие процессы адаптации сотрудников</p>
          {isHR && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline" onClick={() => setShowPing(true)}>⚙️ Автопинг</button>
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Запустить онбординг</button>
            </div>
          )}
        </div>
      </div>

      <div className="card-grid">
        {onboardings.map((o) => {
          const completedTasks = o.tasks.filter((t) => t.status === 'completed').length;
          const overdueTasks = o.tasks.filter((t) => t.status === 'overdue').length;
          const inProgressTasks = o.tasks.filter((t) => t.status === 'in_progress').length;

          return (
            <Link to={`/onboardings/${o.id}`} key={o.id} className="card onboarding-list-card">
              <div className="onb-header">
                <div className="avatar-circle">{o.newcomer_name.split(' ').map((n) => n[0]).join('')}</div>
                <div>
                  <h3>{o.newcomer_name}</h3>
                  <div className="onb-role">{o.template_role}</div>
                </div>
              </div>
              <div className="onb-info">
                <div className="onb-info-row"><span>Начало</span><strong>{new Date(o.start_date).toLocaleDateString('ru')}</strong></div>
                <div className="onb-info-row"><span>Текущий этап</span><strong>{o.current_stage}</strong></div>
              </div>
              <div className="progress-section">
                <div className="progress-header"><span>Прогресс</span><span>{o.progress}%</span></div>
                <div className="progress-bar progress-primary"><div className="progress-fill" style={{ width: `${o.progress}%` }}></div></div>
              </div>
              <div className="onb-stats">
                <div className="onb-stat"><span className="onb-stat-value" style={{ color: 'var(--green)' }}>{completedTasks}</span><span className="onb-stat-label">Готово</span></div>
                <div className="onb-stat"><span className="onb-stat-value" style={{ color: 'var(--yellow)' }}>{inProgressTasks}</span><span className="onb-stat-label">В работе</span></div>
                <div className="onb-stat"><span className="onb-stat-value" style={{ color: 'var(--red)' }}>{overdueTasks}</span><span className="onb-stat-label">Просрочено</span></div>
              </div>
            </Link>
          );
        })}
      </div>

      {showCreate && <CreateOnboardingModal onClose={() => setShowCreate(false)} />}
      {showPing && <AutoPingModal onClose={() => setShowPing(false)} />}
    </div>
  );
}
