import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import './Dashboard.css';

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.getDashboard().then(setData);
  }, []);

  if (!data) return <div className="loading">Загрузка...</div>;

  const { stats, sla, onboardings } = data;

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Дашборд</h1>
        <p>Обзор всех активных онбордингов и SLA</p>
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
              <div className="sla-bar-header">
                <span className="sla-dot sla-green"></span>
                <span>В срок</span>
                <strong>{sla.green}</strong>
              </div>
              <div className="progress-bar progress-green">
                <div className="progress-fill" style={{ width: `${(sla.green / stats.total_tasks) * 100}%` }}></div>
              </div>
            </div>
            <div className="sla-bar-item">
              <div className="sla-bar-header">
                <span className="sla-dot sla-yellow"></span>
                <span>Подходит дедлайн</span>
                <strong>{sla.yellow}</strong>
              </div>
              <div className="progress-bar progress-yellow">
                <div className="progress-fill" style={{ width: `${(sla.yellow / stats.total_tasks) * 100}%` }}></div>
              </div>
            </div>
            <div className="sla-bar-item">
              <div className="sla-bar-header">
                <span className="sla-dot sla-red"></span>
                <span>Просрочено</span>
                <strong>{sla.red}</strong>
              </div>
              <div className="progress-bar progress-red">
                <div className="progress-fill" style={{ width: `${(sla.red / stats.total_tasks) * 100}%` }}></div>
              </div>
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
                  <div className="progress-header">
                    <span>Прогресс</span>
                    <span>{o.progress}%</span>
                  </div>
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
    </div>
  );
}
