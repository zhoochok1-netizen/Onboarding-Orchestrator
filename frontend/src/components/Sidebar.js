import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { api } from '../api/client';
import './Sidebar.css';

const NAV = {
  hr: [
    { path: '/dashboard', icon: '📊', label: 'Дашборд' },
    { path: '/tasks', icon: '✅', label: 'Доска задач' },
    { path: '/templates', icon: '📋', label: 'Шаблоны' },
    { path: '/chat', icon: '💬', label: 'AI Чатбот' },
    { path: '/knowledge', icon: '📚', label: 'База знаний' },
  ],
  manager: [
    { path: '/dashboard', icon: '📊', label: 'Дашборд' },
    { path: '/tasks', icon: '✅', label: 'Задачи отдела' },
    { path: '/templates', icon: '📋', label: 'Шаблоны' },
    { path: '/knowledge', icon: '📚', label: 'База знаний' },
  ],
  it: [
    { path: '/dashboard', icon: '📊', label: 'Мои задачи' },
    { path: '/tasks', icon: '✅', label: 'Доска задач' },
    { path: '/knowledge', icon: '📚', label: 'База знаний' },
  ],
  mentor: [
    { path: '/dashboard', icon: '📊', label: 'Дашборд' },
    { path: '/tasks', icon: '✅', label: 'Доска задач' },
    { path: '/knowledge', icon: '📚', label: 'База знаний' },
  ],
  newcomer: [
    { path: '/dashboard', icon: '🏠', label: 'Мой онбординг' },
    { path: '/tasks', icon: '✅', label: 'Мои задачи' },
    { path: '/chat', icon: '💬', label: 'AI Помощник' },
    { path: '/knowledge', icon: '📚', label: 'База знаний' },
  ],
};

const FOOTER_LABELS = {
  hr: { title: 'Общая статистика', countLabel: 'онбордингов' },
  manager: { title: 'Мой отдел', countLabel: 'онбордингов' },
  it: { title: 'Мои задачи', countLabel: 'назначено' },
  mentor: { title: 'Мои подопечные', countLabel: 'новичков' },
  newcomer: { title: 'Мой прогресс', countLabel: 'выполнено' },
};

export default function Sidebar({ collapsed, onToggle }) {
  const { user } = useUser();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!user) return;
    api.getDashboard().then((data) => setStats(data.stats));
  }, [user?.id]);

  const role = user?.role || 'newcomer';
  const navItems = NAV[role] || NAV.newcomer;
  const footer = FOOTER_LABELS[role] || FOOTER_LABELS.newcomer;

  let footerNumber = '—';
  let footerPercent = 0;
  let footerHint = '';

  if (stats) {
    if (role === 'newcomer') {
      const done = stats.completed || 0;
      const total = stats.total_tasks || 1;
      footerNumber = `${done}/${total}`;
      footerPercent = Math.round((done / total) * 100);
      footerHint = `${footerPercent}% задач выполнено`;
    } else if (role === 'it' || role === 'mentor') {
      footerNumber = stats.total_tasks || 0;
      const done = stats.completed || 0;
      const total = stats.total_tasks || 1;
      footerPercent = Math.round((done / total) * 100);
      footerHint = `${done} выполнено`;
    } else {
      footerNumber = stats.active_onboardings || 0;
      const done = stats.completed || 0;
      const total = stats.total_tasks || 1;
      footerPercent = Math.round((done / total) * 100);
      footerHint = `${footerPercent}% задач выполнено`;
    }
  }

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <div className="logo-text">
            <div className="logo-title">Onboarding</div>
            <div className="logo-subtitle">Orchestrator</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Меню</div>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            <span className="nav-active-indicator"></span>
            {collapsed && <span className="nav-tooltip">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {!collapsed && (
          <div className="sidebar-stats-card">
            <div className="sidebar-stats-title">{footer.title}</div>
            <div className="sidebar-stats-row">
              <span className="sidebar-stats-number">{footerNumber}</span>
              <span className="sidebar-stats-label">{footer.countLabel}</span>
            </div>
            <div className="sidebar-stats-bar">
              <div className="sidebar-stats-fill" style={{ width: `${footerPercent}%` }}></div>
            </div>
            <div className="sidebar-stats-hint">{footerHint}</div>
          </div>
        )}

        <button className="sidebar-toggle" onClick={onToggle} title={collapsed ? 'Развернуть' : 'Свернуть'}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {collapsed ? (
              <polyline points="9 18 15 12 9 6" />
            ) : (
              <polyline points="15 18 9 12 15 6" />
            )}
          </svg>
          {!collapsed && <span>Свернуть</span>}
          {collapsed && <span className="nav-tooltip">Развернуть</span>}
        </button>
      </div>
    </aside>
  );
}
