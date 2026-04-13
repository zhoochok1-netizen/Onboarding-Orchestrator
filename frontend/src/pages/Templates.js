import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useUser } from '../context/UserContext';
import CustomSelect from '../components/CustomSelect';
import './Templates.css';

const ROLE_ICONS = { hr: '👤', it: '💻', manager: '👔', mentor: '🎓', newcomer: '🆕' };
const ROLE_LABELS = { hr: 'HR', it: 'IT', manager: 'Руководитель', mentor: 'Наставник', newcomer: 'Новичок' };
const ROLE_OPTIONS = [
  { value: 'hr', label: 'HR' }, { value: 'it', label: 'IT' },
  { value: 'manager', label: 'Руководитель' }, { value: 'mentor', label: 'Наставник' },
];

const DEFAULT_STAGES = [
  { id: 'new-s1', name: 'День 1', description: 'Первый рабочий день', order: 1 },
  { id: 'new-s2', name: 'Неделя 1', description: 'Знакомство с командой', order: 2 },
  { id: 'new-s3', name: 'Месяц 1', description: 'Погружение в работу', order: 3 },
];

function CreateTemplateModal({ onClose }) {
  const [form, setForm] = useState({ roleName: '', description: '' });
  const [stages, setStages] = useState(DEFAULT_STAGES.map(s => ({ ...s })));
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: '', stage_id: '', responsible_role: 'hr', deadline_days: 1 });

  const addStage = () => {
    const id = 'new-s' + (stages.length + 1);
    setStages(prev => [...prev, { id, name: '', description: '', order: prev.length + 1 }]);
  };

  const updateStage = (id, field, value) => {
    setStages(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeStage = (id) => {
    setStages(prev => prev.filter(s => s.id !== id));
    setTasks(prev => prev.filter(t => t.stage_id !== id));
  };

  const addTask = () => {
    if (!newTask.title || !newTask.stage_id) return;
    setTasks(prev => [...prev, { ...newTask, id: 'nt-' + Date.now() }]);
    setNewTask({ title: '', stage_id: '', responsible_role: 'hr', deadline_days: 1 });
  };

  const removeTask = (id) => setTasks(prev => prev.filter(t => t.id !== id));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.roleName || stages.length === 0) return;
    alert(`Шаблон создан!\n\n${form.roleName}\n${stages.length} этапов, ${tasks.length} задач\n\n(Демо-режим)`);
    onClose();
  };

  const stageOptions = [{ value: '', label: 'Этап' }, ...stages.filter(s => s.name).map(s => ({ value: s.id, label: s.name }))];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="onb-modal onb-modal-wide" onClick={e => e.stopPropagation()}>
        <div className="onb-modal-header"><h2>Создать шаблон</h2><button className="btn btn-outline btn-sm" onClick={onClose}>✕</button></div>
        <form onSubmit={handleSubmit}>
          <div className="co-grid">
            <div className="co-field">
              <label>Название роли</label>
              <input type="text" placeholder="Аналитик данных" value={form.roleName} onChange={e => setForm({ ...form, roleName: e.target.value })} required />
            </div>
            <div className="co-field">
              <label>Описание</label>
              <input type="text" placeholder="Шаблон онбординга для аналитиков" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>

          <div className="ct-section">
            <div className="ct-section-header">
              <h3>Этапы</h3>
              <button type="button" className="btn btn-outline btn-sm" onClick={addStage}>+ Этап</button>
            </div>
            <div className="ct-stages">
              {stages.map((stage, i) => (
                <div key={stage.id} className="ct-stage-row">
                  <span className="ct-stage-num">{i + 1}</span>
                  <input type="text" placeholder="Название этапа" value={stage.name}
                    onChange={e => updateStage(stage.id, 'name', e.target.value)} />
                  <input type="text" placeholder="Описание" value={stage.description}
                    onChange={e => updateStage(stage.id, 'description', e.target.value)} />
                  {stages.length > 1 && (
                    <button type="button" className="ct-remove" onClick={() => removeStage(stage.id)}>✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="ct-section">
            <h3>Задачи ({tasks.length})</h3>
            {tasks.length > 0 && (
              <div className="ct-task-list">
                {tasks.map(task => (
                  <div key={task.id} className="ct-task-item">
                    <span>{ROLE_ICONS[task.responsible_role] || '📋'}</span>
                    <span className="ct-task-title">{task.title}</span>
                    <span className="ct-task-meta">{stages.find(s => s.id === task.stage_id)?.name} · {ROLE_LABELS[task.responsible_role]} · {task.deadline_days} дн.</span>
                    <button type="button" className="ct-remove" onClick={() => removeTask(task.id)}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <div className="co-add-row">
              <input type="text" placeholder="Название задачи" value={newTask.title}
                onChange={e => setNewTask({ ...newTask, title: e.target.value })} />
              <CustomSelect variant="form" value={newTask.stage_id} options={stageOptions}
                placeholder="Этап" onChange={v => setNewTask({ ...newTask, stage_id: v })} />
              <CustomSelect variant="form" value={newTask.responsible_role} options={ROLE_OPTIONS}
                placeholder="Роль" onChange={v => setNewTask({ ...newTask, responsible_role: v })} />
              <input type="number" min="1" max="90" value={newTask.deadline_days} style={{ width: 60 }}
                onChange={e => setNewTask({ ...newTask, deadline_days: Number(e.target.value) })} />
              <button type="button" className="btn btn-outline btn-sm" onClick={addTask}>+</button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary onb-modal-submit" disabled={!form.roleName}>
            Создать шаблон
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Templates() {
  const { isHR } = useUser();
  const [templates, setTemplates] = useState([]);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => { api.getTemplates().then(setTemplates); }, []);

  return (
    <div className="templates-page">
      <div className="page-header">
        <h1>Шаблоны онбординга</h1>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p>Маршруты адаптации по ролям</p>
          {isHR && (
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Создать шаблон</button>
          )}
        </div>
      </div>

      <div className="card-grid">
        {templates.map((tmpl) => (
          <div key={tmpl.id} className="card template-card">
            <div className="template-header">
              <h2>{tmpl.role_name}</h2>
              <p>{tmpl.description}</p>
            </div>
            <div className="template-stages">
              {tmpl.stages.map((stage) => (
                <div key={stage.id} className="stage-block">
                  <div className="stage-label"><span className="stage-dot"></span>{stage.name}</div>
                  <div className="stage-tasks">
                    {tmpl.tasks.filter((t) => t.stage_id === stage.id).map((task) => (
                      <div key={task.id} className="template-task">
                        <span className="task-role-icon">{ROLE_ICONS[task.responsible_role]}</span>
                        <div>
                          <div className="task-name">{task.title}</div>
                          <div className="task-meta">{ROLE_LABELS[task.responsible_role]} · до {task.deadline_days} дн.</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="template-footer">
              <span className="badge badge-primary">{tmpl.stages.length} этапов</span>
              <span className="badge badge-purple">{tmpl.tasks.length} задач</span>
            </div>
          </div>
        ))}
      </div>

      {showCreate && <CreateTemplateModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
