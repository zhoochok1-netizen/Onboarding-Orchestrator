import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useUser } from '../context/UserContext';
import './Onboardings.css';

export default function Onboardings() {
  const { user } = useUser();
  const [onboardings, setOnboardings] = useState([]);

  useEffect(() => {
    setOnboardings([]);
    api.getOnboardings().then(setOnboardings);
  }, [user?.id]);

  return (
    <div className="onboardings-page">
      <div className="page-header">
        <h1>Активные онбординги</h1>
        <p>Все текущие процессы адаптации сотрудников</p>
      </div>

      <div className="card-grid">
        {onboardings.map((o) => {
          const completedTasks = o.tasks.filter((t) => t.status === 'completed').length;
          const overdueTasks = o.tasks.filter((t) => t.status === 'overdue').length;
          const inProgressTasks = o.tasks.filter((t) => t.status === 'in_progress').length;

          return (
            <Link to={`/onboardings/${o.id}`} key={o.id} className="card onboarding-list-card">
              <div className="onb-header">
                <div className="avatar-circle">
                  {o.newcomer_name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <h3>{o.newcomer_name}</h3>
                  <div className="onb-role">{o.template_role}</div>
                </div>
              </div>

              <div className="onb-info">
                <div className="onb-info-row">
                  <span>Начало</span>
                  <strong>{new Date(o.start_date).toLocaleDateString('ru')}</strong>
                </div>
                <div className="onb-info-row">
                  <span>Текущий этап</span>
                  <strong>{o.current_stage}</strong>
                </div>
              </div>

              <div className="progress-section">
                <div className="progress-header">
                  <span>Прогресс</span>
                  <span>{o.progress}%</span>
                </div>
                <div className="progress-bar progress-primary">
                  <div className="progress-fill" style={{ width: `${o.progress}%` }}></div>
                </div>
              </div>

              <div className="onb-stats">
                <div className="onb-stat">
                  <span className="onb-stat-value" style={{ color: 'var(--green)' }}>{completedTasks}</span>
                  <span className="onb-stat-label">Готово</span>
                </div>
                <div className="onb-stat">
                  <span className="onb-stat-value" style={{ color: 'var(--yellow)' }}>{inProgressTasks}</span>
                  <span className="onb-stat-label">В работе</span>
                </div>
                <div className="onb-stat">
                  <span className="onb-stat-value" style={{ color: 'var(--red)' }}>{overdueTasks}</span>
                  <span className="onb-stat-label">Просрочено</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
