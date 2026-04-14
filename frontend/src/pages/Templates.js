import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useUser } from '../context/UserContext';
import CustomSelect from '../components/CustomSelect';
import './Templates.css';

const ROLE_ICONS = { hr: '👤', it: '💻', manager: '👔', mentor: '🎓', newcomer: '🆕' };
const ROLE_LABELS = { hr: 'HR', it: 'IT', manager: 'Руководитель', mentor: 'Наставник' };
const ROLE_OPTIONS = [
  { value: 'hr', label: '👤 HR' }, { value: 'it', label: '💻 IT' },
  { value: 'manager', label: '👔 Руководитель' }, { value: 'mentor', label: '🎓 Наставник' },
];

const DEFAULT_STAGES = [
  { id: 'ns-1', name: 'День 1', description: 'Первый рабочий день', order: 1 },
  { id: 'ns-2', name: 'Неделя 1', description: 'Знакомство с командой', order: 2 },
  { id: 'ns-3', name: 'Месяц 1', description: 'Погружение в работу', order: 3 },
];

function CreateTemplateModal({ onClose }) {
  const [form, setForm] = useState({ roleName: '', description: '' });
  const [stages, setStages] = useState(DEFAULT_STAGES.map(s => ({ ...s })));
  const [tasks, setTasks] = useState([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', stage_id: '', responsible_role: 'hr', deadline_days: 1 });

  const addStage = () => {
    const n = stages.length + 1;
    setStages(p => [...p, { id: 'ns-' + Date.now(), name: '', description: '', order: n }]);
  };
  const updateStage = (id, field, val) => setStages(p => p.map(s => s.id === id ? { ...s, [field]: val } : s));
  const removeStage = (id) => { setStages(p => p.filter(s => s.id !== id)); setTasks(p => p.filter(t => t.stage_id !== id)); };

  const addTask = () => {
    if (!newTask.title || !newTask.stage_id) return;
    setTasks(p => [...p, { ...newTask, id: 'nt-' + Date.now() }]);
    setNewTask({ title: '', stage_id: '', responsible_role: 'hr', deadline_days: 1 });
    setShowAddTask(false);
  };
  const removeTask = (id) => setTasks(p => p.filter(t => t.id !== id));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.roleName || stages.length === 0) return;
    alert(`Шаблон «${form.roleName}» создан!\n${stages.length} этапов, ${tasks.length} задач\n\n(Демо-режим)`);
    onClose();
  };

  const stageOpts = [{ value: '', label: 'Выберите этап' }, ...stages.filter(s => s.name).map(s => ({ value: s.id, label: s.name }))];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="ct-modal" onClick={e => e.stopPropagation()}>
        <div className="ct-modal-header">
          <div>
            <h2>Создать шаблон онбординга</h2>
            <p className="ct-modal-sub">Настройте этапы и задачи для новой роли</p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic info */}
          <div className="ct-form-grid">
            <div className="ct-field">
              <label>Название роли</label>
              <input type="text" placeholder="например: Аналитик данных" value={form.roleName}
                onChange={e => setForm({ ...form, roleName: e.target.value })} required />
            </div>
            <div className="ct-field">
              <label>Описание</label>
              <input type="text" placeholder="Шаблон онбординга для..." value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>

          {/* Stages */}
          <div className="ct-block">
            <div className="ct-block-header">
              <h3>📌 Этапы ({stages.length})</h3>
              <button type="button" className="btn btn-outline btn-sm" onClick={addStage}>+ Добавить</button>
            </div>
            <div className="ct-stage-list">
              {stages.map((stage, i) => (
                <div key={stage.id} className="ct-stage-card">
                  <div className="ct-stage-badge">{i + 1}</div>
                  <div className="ct-stage-fields">
                    <input type="text" placeholder="Название (День 1, Неделя 1...)" value={stage.name}
                      onChange={e => updateStage(stage.id, 'name', e.target.value)} />
                    <input type="text" placeholder="Описание этапа" value={stage.description}
                      className="ct-stage-desc-input"
                      onChange={e => updateStage(stage.id, 'description', e.target.value)} />
                  </div>
                  {stages.length > 1 && (
                    <button type="button" className="ct-stage-remove" onClick={() => removeStage(stage.id)}>✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tasks */}
          <div className="ct-block">
            <div className="ct-block-header">
              <h3>📋 Задачи ({tasks.length})</h3>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowAddTask(!showAddTask)}>
                {showAddTask ? 'Отмена' : '+ Добавить'}
              </button>
            </div>

            {tasks.length > 0 ? (
              <div className="ct-tasks-list">
                {stages.filter(s => s.name).map(stage => {
                  const st = tasks.filter(t => t.stage_id === stage.id);
                  if (!st.length) return null;
                  return (
                    <div key={stage.id} className="ct-tasks-group">
                      <div className="ct-tasks-group-label">{stage.name}</div>
                      {st.map(task => (
                        <div key={task.id} className="ct-task-card">
                          <span className="ct-task-card-icon">{ROLE_ICONS[task.responsible_role] || '📋'}</span>
                          <div className="ct-task-card-info">
                            <span className="ct-task-card-title">{task.title}</span>
                            <span className="ct-task-card-meta">{ROLE_LABELS[task.responsible_role]} · {task.deadline_days} дн.</span>
                          </div>
                          <button type="button" className="ct-stage-remove" onClick={() => removeTask(task.id)}>✕</button>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ) : !showAddTask && (
              <div className="ct-empty">Пока нет задач. Нажмите «+ Добавить» чтобы создать первую.</div>
            )}

            {showAddTask && (
              <div className="ct-add-task-form">
                <div className="ct-field">
                  <label>Название задачи</label>
                  <input type="text" placeholder="Провести welcome-встречу" value={newTask.title}
                    onChange={e => setNewTask({ ...newTask, title: e.target.value })} />
                </div>
                <div className="ct-add-task-row">
                  <div className="ct-field ct-field-grow">
                    <label>Этап</label>
                    <CustomSelect variant="form" value={newTask.stage_id} options={stageOpts}
                      placeholder="Этап" onChange={v => setNewTask({ ...newTask, stage_id: v })} />
                  </div>
                  <div className="ct-field ct-field-grow">
                    <label>Ответственный</label>
                    <CustomSelect variant="form" value={newTask.responsible_role} options={ROLE_OPTIONS}
                      placeholder="Роль" onChange={v => setNewTask({ ...newTask, responsible_role: v })} />
                  </div>
                  <div className="ct-field" style={{ width: 80 }}>
                    <label>Дедлайн</label>
                    <input type="number" min="1" max="90" value={newTask.deadline_days}
                      onChange={e => setNewTask({ ...newTask, deadline_days: Number(e.target.value) })} />
                  </div>
                </div>
                <button type="button" className="btn btn-primary ct-add-task-btn" onClick={addTask}
                  disabled={!newTask.title || !newTask.stage_id}>
                  Добавить задачу
                </button>
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary ct-submit" disabled={!form.roleName || stages.length === 0}>
            Создать шаблон ({stages.length} этапов, {tasks.length} задач)
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
          {isHR && <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Создать шаблон</button>}
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
