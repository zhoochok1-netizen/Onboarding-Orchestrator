import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useUser } from '../context/UserContext';
import CustomSelect from '../components/CustomSelect';
import './Dashboard.css';

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
          <div className="ap-field"><label>Пинговать за</label>
            <div className="ap-pills">{DAYS.map(d => (
              <button key={d.v} className={`ap-pill ${settings.daysBefore === d.v ? 'active' : ''}`}
                onClick={() => setSettings(p => ({ ...p, daysBefore: d.v }))}>{d.l}</button>
            ))}</div>
          </div>
          <div className="ap-field"><label>Каналы</label>
            <div className="ap-channels">
              {[{ id: 'slack', icon: '💬', l: 'Slack' }, { id: 'email', icon: '📧', l: 'Email' }, { id: 'system', icon: '🔔', l: 'В системе' }].map(ch => (
                <button key={ch.id} className={`ap-channel ${settings.channels.includes(ch.id) ? 'active' : ''}`}
                  onClick={() => toggleCh(ch.id)}><span>{ch.icon}</span><span>{ch.l}</span></button>
              ))}
            </div>
          </div>
          <div className="ap-preview">
            <div className="ap-preview-title">Пример:</div>
            <div className="ap-preview-msg">⚠️ <strong>«Ревью первого PR»</strong> для <strong>Мария Иванова</strong> — дедлайн через {settings.daysBefore} дн.</div>
          </div>
        </>)}
        <button className="btn btn-primary onb-modal-submit" onClick={save}>Сохранить</button>
      </div>
    </div>
  );
}

// ── Create Onboarding Modal ──
function CreateOnboardingModal({ onClose }) {
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', department: '', templateId: '' });
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: '', stage_id: '', responsible_role: 'hr', deadline_days: 1 });

  useEffect(() => { api.getTemplates().then(setTemplates); }, []);
  const selectedTemplate = templates.find(t => t.id === form.templateId);

  const handleTemplateChange = (val) => {
    setForm(f => ({ ...f, templateId: val }));
    const tmpl = templates.find(t => t.id === val);
    setTasks(tmpl ? tmpl.tasks.map(t => ({ ...t, _enabled: true })) : []);
  };

  const toggleTask = (id) => setTasks(p => p.map(t => t.id === id ? { ...t, _enabled: !t._enabled } : t));
  const addCustomTask = () => {
    if (!newTask.title || !newTask.stage_id) return;
    setTasks(p => [...p, { ...newTask, id: 'custom-' + Date.now(), _enabled: true, description: '' }]);
    setNewTask({ title: '', stage_id: '', responsible_role: 'hr', deadline_days: 1 });
  };
  const removeTask = (id) => setTasks(p => p.filter(t => t.id !== id));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.templateId) return;
    alert(`Онбординг запущен!\n\n${form.name} · ${selectedTemplate?.role_name}\nЗадач: ${tasks.filter(t => t._enabled).length}\n\n(Демо-режим)`);
    onClose();
  };

  const ROLE_ICONS = { hr: '👤', it: '💻', manager: '👔', mentor: '🎓' };
  const roleOpts = [{ value: 'hr', label: 'HR' }, { value: 'it', label: 'IT' }, { value: 'manager', label: 'Руководитель' }, { value: 'mentor', label: 'Наставник' }];
  const deptOpts = [{ value: '', label: 'Отдел' }, ...['Разработка', 'Маркетинг', 'Продажи', 'Дизайн', 'IT', 'HR'].map(d => ({ value: d, label: d }))];
  const tmplOpts = [{ value: '', label: 'Шаблон' }, ...templates.map(t => ({ value: t.id, label: `${t.role_name} (${t.tasks.length} задач)` }))];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="onb-modal onb-modal-wide" onClick={e => e.stopPropagation()}>
        <div className="onb-modal-header"><h2>Запустить онбординг</h2><button className="btn btn-outline btn-sm" onClick={onClose}>✕</button></div>
        <form onSubmit={handleSubmit}>
          <div className="co-grid">
            <div className="co-field"><label>ФИО</label><input type="text" placeholder="Иван Петров" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="co-field"><label>Email</label><input type="email" placeholder="ivan@company.ru" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
            <div className="co-field"><label>Отдел</label><CustomSelect variant="form" value={form.department} options={deptOpts} placeholder="Отдел" onChange={v => setForm({ ...form, department: v })} /></div>
            <div className="co-field"><label>Шаблон</label><CustomSelect variant="form" value={form.templateId} options={tmplOpts} placeholder="Шаблон" onChange={handleTemplateChange} /></div>
          </div>
          {selectedTemplate && (
            <div className="co-tasks-editor">
              <h3>Задачи <span className="co-tasks-count">{tasks.filter(t => t._enabled).length}/{tasks.length}</span></h3>
              {selectedTemplate.stages.map(stage => {
                const st = tasks.filter(t => t.stage_id === stage.id);
                if (!st.length) return null;
                return (<div key={stage.id} className="co-stage"><div className="co-stage-label">{stage.name}</div>
                  {st.map(task => (
                    <div key={task.id} className={`co-task ${!task._enabled ? 'co-task-disabled' : ''}`}>
                      <button type="button" className={`co-task-toggle ${task._enabled ? 'on' : ''}`} onClick={() => toggleTask(task.id)}>{task._enabled ? '✓' : ''}</button>
                      <span className="co-task-icon">{ROLE_ICONS[task.responsible_role] || '📋'}</span>
                      <div className="co-task-info"><span className="co-task-title">{task.title}</span><span className="co-task-meta">{task.deadline_days} дн.</span></div>
                      {task.id.startsWith('custom-') && <button type="button" className="co-task-remove" onClick={() => removeTask(task.id)}>✕</button>}
                    </div>
                  ))}</div>);
              })}
              <div className="co-add-task"><h4>+ Добавить задачу</h4>
                <div className="co-add-row">
                  <input type="text" placeholder="Название" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} />
                  <CustomSelect variant="form" value={newTask.stage_id} options={[{ value: '', label: 'Этап' }, ...selectedTemplate.stages.map(s => ({ value: s.id, label: s.name }))]} placeholder="Этап" onChange={v => setNewTask({ ...newTask, stage_id: v })} />
                  <CustomSelect variant="form" value={newTask.responsible_role} options={roleOpts} placeholder="Роль" onChange={v => setNewTask({ ...newTask, responsible_role: v })} />
                  <input type="number" min="1" max="90" value={newTask.deadline_days} style={{ width: 60 }} onChange={e => setNewTask({ ...newTask, deadline_days: Number(e.target.value) })} />
                  <button type="button" className="btn btn-outline btn-sm" onClick={addCustomTask}>+</button>
                </div>
              </div>
            </div>
          )}
          <button type="submit" className="btn btn-primary onb-modal-submit" disabled={!form.name || !form.templateId}>
            Запустить ({tasks.filter(t => t._enabled).length} задач)
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Dashboard ──
export default function Dashboard() {
  const { user, isHR } = useUser();
  const [data, setData] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showPing, setShowPing] = useState(false);

  useEffect(() => { setData(null); api.getDashboard().then(setData); }, [user?.id]);

  if (!data) return <div className="loading">Загрузка...</div>;

  const { stats, sla, onboardings } = data;

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Дашборд</h1>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p>Обзор всех активных онбордингов и SLA</p>
          {isHR && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline" onClick={() => setShowPing(true)}>⚙️ Автопинг</button>
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Запустить онбординг</button>
            </div>
          )}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--primary)' }}>{stats.active_onboardings}</div>
          <div className="stat-label">Активных онбордингов</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.total_tasks}</div>
          <div className="stat-label">Всего задач</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--green)' }}>{stats.completed}</div>
          <div className="stat-label">Выполнено</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--yellow)' }}>{stats.in_progress}</div>
          <div className="stat-label">В работе</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--red)' }}>{stats.overdue}</div>
          <div className="stat-label">Просрочено</div>
        </div>
      </div>

      <div className="sla-section">
        <div className="card">
          <h2>SLA-трекинг</h2>
          <div className="sla-bars">
            <div className="sla-bar-item">
              <div className="sla-bar-header"><span className="sla-dot sla-green"></span><span>В срок</span><strong>{sla.green}</strong></div>
              <div className="progress-bar progress-green"><div className="progress-fill" style={{ width: `${(sla.green / stats.total_tasks) * 100}%` }}></div></div>
            </div>
            <div className="sla-bar-item">
              <div className="sla-bar-header"><span className="sla-dot sla-yellow"></span><span>Подходит дедлайн</span><strong>{sla.yellow}</strong></div>
              <div className="progress-bar progress-yellow"><div className="progress-fill" style={{ width: `${(sla.yellow / stats.total_tasks) * 100}%` }}></div></div>
            </div>
            <div className="sla-bar-item">
              <div className="sla-bar-header"><span className="sla-dot sla-red"></span><span>Просрочено</span><strong>{sla.red}</strong></div>
              <div className="progress-bar progress-red"><div className="progress-fill" style={{ width: `${(sla.red / stats.total_tasks) * 100}%` }}></div></div>
            </div>
          </div>
        </div>
      </div>

      <div className="onboardings-section">
        <h2>Активные онбординги</h2>
        <div className="card-grid">
          {onboardings.map((o) => (
            <Link to={`/onboardings/${o.id}`} key={o.id} className="onboarding-card card">
              <div className="onboarding-card-header">
                <div className="avatar-circle">{o.newcomer_name.split(' ').map(n => n[0]).join('')}</div>
                <div>
                  <h3>{o.newcomer_name}</h3>
                  <span className="badge badge-primary">{o.template_role}</span>
                </div>
              </div>
              <div className="onboarding-card-body">
                <div className="onboarding-meta">
                  <span>Этап: <strong>{o.current_stage}</strong></span>
                  <span>Начало: {new Date(o.start_date).toLocaleDateString('ru')}</span>
                </div>
                <div className="progress-section">
                  <div className="progress-header"><span>Прогресс</span><span>{o.progress}%</span></div>
                  <div className={`progress-bar ${o.progress >= 70 ? 'progress-green' : o.progress >= 30 ? 'progress-primary' : 'progress-yellow'}`}>
                    <div className="progress-fill" style={{ width: `${o.progress}%` }}></div>
                  </div>
                </div>
                <div className="task-summary">
                  <span className="badge badge-green">{o.completed_tasks} выполнено</span>
                  {o.overdue_tasks > 0 && <span className="badge badge-red">{o.overdue_tasks} просрочено</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {showCreate && <CreateOnboardingModal onClose={() => setShowCreate(false)} />}
      {showPing && <AutoPingModal onClose={() => setShowPing(false)} />}
    </div>
  );
}
