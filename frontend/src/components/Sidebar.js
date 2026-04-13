import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const navItems = [
  { path: '/dashboard', icon: '📊', label: 'Дашборд' },
  { path: '/tasks', icon: '✅', label: 'Доска задач' },
  { path: '/onboardings', icon: '🚀', label: 'Онбординги' },
  { path: '/templates', icon: '📋', label: 'Шаблоны' },
  { path: '/chat', icon: '💬', label: 'AI Чатбот' },
  { path: '/knowledge', icon: '📚', label: 'База знаний' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <div>
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
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-stats-card">
          <div className="sidebar-stats-title">Активные</div>
          <div className="sidebar-stats-row">
            <span className="sidebar-stats-number">10</span>
            <span className="sidebar-stats-label">онбордингов</span>
          </div>
          <div className="sidebar-stats-bar">
            <div className="sidebar-stats-fill" style={{ width: '48%' }}></div>
          </div>
          <div className="sidebar-stats-hint">48% задач выполнено</div>
        </div>
      </div>
    </aside>
  );
}
