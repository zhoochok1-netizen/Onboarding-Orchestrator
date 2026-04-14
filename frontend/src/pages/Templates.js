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

function TemplateModal({ onClose, onSave, initial }) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    roleName: initial?.role_name || '',
    description: initial?.description || '',
  });
  const [stages, setStages] = useState(
    initial ? initial.stages.map(s => ({ ...s })) : DEFAULT_STAGES.map(s => ({ ...s }))
  );
  const [tasks, setTasks] = useState(
    initial ? initial.tasks.map(t => ({ ...t })) : []
  );
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', stage_id: '', responsible_role: 'hr', deadline_days: 1 });
  const [activeStageId, setActiveStageId] = useState(null);
  const [saving, setSaving] = useState(false);

  const addStage = () => {
    const n = stages.length + 1;
    setStages(p => [...p, { id: 'ns-' + Date.now(), name: '', description: '', order: n }]);
  };
  const updateStage = (id, field, val) => setStages(p => p.map(s => s.id === id ? { ...s, [field]: val } : s));
  const removeStage = (id) => { setStages(p => p.filter(s => s.id !== id)); setTasks(p => p.filter(t => t.stage_id !== id)); };

  const addTask = () => {
    if (!newTask.title || !newTask.stage_id) return;
    setTasks(p => [...p, { ...newTask, id: 'nt-' + Date.now() }]);
    setNewTask({ title: '', stage_id: newTask.stage_id, responsible_role: 'hr', deadline_days: 1 });
    setShowAddTask(false);
  };
  const removeTask = (id) => setTasks(p => p.filter(t => t.id !== id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.roleName || stages.length === 0 || saving) return;
    setSaving(true);
    try {
      const payload = {
        role_name: form.roleName,
        description: form.description,
        stages: stages.map((s, i) => ({ id: s.id, name: s.name, description: s.description, order: i + 1 })),
        tasks: tasks.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description || '',
          stage_id: t.stage_id,
          responsible_role: t.responsible_role,
          deadline_days: t.deadline_days,
        })),
      };
      let result;
      if (isEdit) {
        result = await api.updateTemplate(initial.id, payload);
      } else {
        result = await api.createTemplate(payload);
      }
      onSave(result);
      onClose();
    } catch (err) {
      console.error('Failed to save template:', err);
    } finally {
      setSaving(false);
    }
  };

  const stageOpts = [{ value: '', label: 'Выберите этап' }, ...stages.filter(s => s.name).map(s => ({ value: s.id, label: s.name }))];
  const tasksForStage = (stageId) => tasks.filter(t => t.stage_id === stageId);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="ct-modal" onClick={e => e.stopPropagation()}>
        <div className="ct-modal-header">
          <div>
            <h2>{isEdit ? 'Редактировать шаблон' : 'Создать шаблон онбординга'}</h2>
            <p className="ct-modal-sub">{isEdit ? 'Измените этапы и задачи' : 'Настройте этапы и задачи для новой роли'}</p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
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

          <div className="ct-columns">
            {/* Left: Stages */}
            <div className="ct-col ct-col-stages">
              <div className="ct-block">
                <div className="ct-block-header">
                  <h3>📌 Этапы ({stages.length})</h3>
                  <button type="button" className="btn btn-outline btn-sm" onClick={addStage}>+ Этап</button>
                </div>
                <div className="ct-stage-list">
                  {stages.map((stage, i) => (
                    <div
                      key={stage.id}
                      className={`ct-stage-card ${activeStageId === stage.id ? 'ct-stage-active' : ''}`}
                      onClick={() => setActiveStageId(stage.id)}
                    >
                      <div className="ct-stage-badge">{i + 1}</div>
                      <div className="ct-stage-fields">
                        <input type="text" placeholder="Название этапа" value={stage.name}
                          onChange={e => updateStage(stage.id, 'name', e.target.value)}
                          onClick={e => e.stopPropagation()} />
                        <input type="text" placeholder="Описание" value={stage.description}
                          className="ct-stage-desc-input"
                          onChange={e => updateStage(stage.id, 'description', e.target.value)}
                          onClick={e => e.stopPropagation()} />
                      </div>
                      <div className="ct-stage-actions">
                        <span className="ct-stage-task-count">{tasksForStage(stage.id).length}</span>
                        {stages.length > 1 && (
                          <button type="button" className="ct-stage-remove" onClick={(e) => { e.stopPropagation(); removeStage(stage.id); }}>✕</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Tasks */}
            <div className="ct-col ct-col-tasks">
              <div className="ct-block">
                <div className="ct-block-header">
                  <h3>📋 Задачи ({tasks.length})</h3>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowAddTask(!showAddTask)}>
                    {showAddTask ? 'Отмена' : '+ Задача'}
                  </button>
                </div>

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
                        <label>Дни</label>
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

                <div className="ct-tasks-scroll">
                  {stages.filter(s => s.name).map(stage => {
                    const st = tasksForStage(stage.id);
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

                  {tasks.length === 0 && !showAddTask && (
                    <div className="ct-empty">
                      <div className="ct-empty-icon">📋</div>
                      <div>Пока нет задач</div>
                      <div className="ct-empty-hint">Нажмите «+ Задача» чтобы создать первую</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary ct-submit" disabled={!form.roleName || stages.length === 0 || saving}>
            {saving ? 'Сохранение...' : isEdit ? `Сохранить изменения` : `Создать шаблон (${stages.length} этапов, ${tasks.length} задач)`}
          </button>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ template, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteTemplate(template.id);
      onConfirm(template.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="ct-delete-modal" onClick={e => e.stopPropagation()}>
        <div className="ct-delete-icon">🗑️</div>
        <h3>Удалить шаблон?</h3>
        <p>Шаблон «{template.role_name}» будет удалён. Это действие нельзя отменить.</p>
        <div className="ct-delete-actions">
          <button className="btn btn-outline" onClick={onClose}>Отмена</button>
          <button className="btn ct-btn-danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Удаление...' : 'Удалить'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Templates() {
  const { isHR } = useUser();
  const [templates, setTemplates] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editTemplate, setEditTemplate] = useState(null);
  const [deleteTemplate, setDeleteTemplate] = useState(null);

  useEffect(() => { api.getTemplates().then(setTemplates); }, []);

  const handleSave = (saved) => {
    setTemplates(prev => {
      const exists = prev.find(t => t.id === saved.id);
      if (exists) return prev.map(t => t.id === saved.id ? saved : t);
      return [...prev, saved];
    });
  };

  const handleDelete = (id) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

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
              <div className="template-header-top">
                <h2>{tmpl.role_name}</h2>
                {isHR && (
                  <div className="template-actions">
                    <button className="template-action-btn" title="Редактировать" onClick={() => setEditTemplate(tmpl)}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button className="template-action-btn template-action-danger" title="Удалить" onClick={() => setDeleteTemplate(tmpl)}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
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

      {showCreate && <TemplateModal onClose={() => setShowCreate(false)} onSave={handleSave} />}
      {editTemplate && <TemplateModal initial={editTemplate} onClose={() => setEditTemplate(null)} onSave={handleSave} />}
      {deleteTemplate && <DeleteConfirmModal template={deleteTemplate} onClose={() => setDeleteTemplate(null)} onConfirm={handleDelete} />}
    </div>
  );
}
