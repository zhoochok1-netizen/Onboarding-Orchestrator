import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import './Templates.css';

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.getTemplates().then(setTemplates);
  }, []);

  const ROLE_ICONS = { hr: '👤', it: '💻', manager: '👔', mentor: '🎓', newcomer: '🆕' };
  const ROLE_LABELS = { hr: 'HR', it: 'IT', manager: 'Руководитель', mentor: 'Наставник', newcomer: 'Новичок' };

  return (
    <div className="templates-page">
      <div className="page-header">
        <h1>Шаблоны онбординга</h1>
        <p>Маршруты адаптации по ролям</p>
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
                  <div className="stage-label">
                    <span className="stage-dot"></span>
                    {stage.name}
                  </div>
                  <div className="stage-tasks">
                    {tmpl.tasks
                      .filter((t) => t.stage_id === stage.id)
                      .map((task) => (
                        <div key={task.id} className="template-task">
                          <span className="task-role-icon">{ROLE_ICONS[task.responsible_role]}</span>
                          <div>
                            <div className="task-name">{task.title}</div>
                            <div className="task-meta">
                              {ROLE_LABELS[task.responsible_role]} · до {task.deadline_days} дн.
                            </div>
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
    </div>
  );
}
