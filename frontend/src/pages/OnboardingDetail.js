import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import './OnboardingDetail.css';

const STATUS_LABELS = {
  waiting: 'Ожидает',
  in_progress: 'В работе',
  completed: 'Выполнено',
  overdue: 'Просрочено',
};

const STATUS_BADGE = {
  waiting: 'badge-purple',
  in_progress: 'badge-yellow',
  completed: 'badge-green',
  overdue: 'badge-red',
};

export default function OnboardingDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.getOnboarding(id).then(setData);
  }, [id]);

  if (!data) return <div className="loading">Загрузка...</div>;

  const stages = [...new Set(data.tasks.map((t) => t.stage_name))];

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
                  <div key={task.id} className={`detail-task ${task.status === 'completed' ? 'task-completed' : ''}`}>
                    <div className={`sla-dot ${task.sla_status === 'green' ? 'sla-green' : task.sla_status === 'yellow' ? 'sla-yellow' : 'sla-red'}`}></div>
                    <div className="detail-task-info">
                      <div className="detail-task-title">{task.title}</div>
                      <div className="detail-task-desc">{task.description}</div>
                      <div className="detail-task-meta">
                        {task.assigned_to_name} · до {new Date(task.deadline).toLocaleDateString('ru')}
                      </div>
                    </div>
                    <span className={`badge ${STATUS_BADGE[task.status]}`}>
                      {STATUS_LABELS[task.status]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
