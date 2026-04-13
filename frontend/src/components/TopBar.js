import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import './TopBar.css';

const PAGE_TITLES = {
  '/dashboard': { title: 'Дашборд', subtitle: 'Обзор активности' },
  '/tasks': { title: 'Доска задач', subtitle: 'Управление задачами' },
  '/onboardings': { title: 'Онбординги', subtitle: 'Процессы адаптации' },
  '/templates': { title: 'Шаблоны', subtitle: 'Маршруты адаптации' },
  '/chat': { title: 'AI Чатбот', subtitle: 'Помощник по онбордингу' },
  '/knowledge': { title: 'База знаний', subtitle: 'Документы компании' },
};

const ROLE_LABELS = {
  hr: 'HR-менеджер',
  manager: 'Руководитель',
  it: 'IT-специалист',
  mentor: 'Наставник',
  newcomer: 'Новый сотрудник',
};

export default function TopBar() {
  const location = useLocation();
  const { user, logout } = useUser();
  const [showProfile, setShowProfile] = useState(false);

  const basePath = '/' + location.pathname.split('/')[1];
  const page = PAGE_TITLES[basePath] || { title: 'Onboarding', subtitle: '' };

  const initials = user?.full_name?.split(' ').map((n) => n[0]).join('') || '??';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div>
          <h1 className="topbar-title">{page.title}</h1>
          {page.subtitle && <span className="topbar-subtitle">{page.subtitle}</span>}
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="text" placeholder="Поиск..." />
        </div>

        <button className="topbar-icon-btn notification-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="notification-dot"></span>
        </button>

        <div className="topbar-profile" onClick={() => setShowProfile(!showProfile)}>
          <div className="topbar-avatar">{initials}</div>
          <div className="topbar-user-info">
            <span className="topbar-user-name">{user?.full_name}</span>
            <span className="topbar-user-role">{ROLE_LABELS[user?.role] || user?.role}</span>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`chevron ${showProfile ? 'open' : ''}`}>
            <polyline points="6 9 12 15 18 9" />
          </svg>

          {showProfile && (
            <div className="profile-dropdown">
              <div className="profile-dropdown-header">
                <div className="topbar-avatar avatar-lg">{initials}</div>
                <div>
                  <div className="dropdown-name">{user?.full_name}</div>
                  <div className="dropdown-email">{user?.email}</div>
                </div>
              </div>
              <div className="profile-dropdown-divider"></div>
              <div className="dropdown-role-badge">
                {ROLE_LABELS[user?.role]} · {user?.department}
              </div>
              <div className="profile-dropdown-divider"></div>
              <button className="dropdown-item dropdown-item-danger" onClick={(e) => { e.stopPropagation(); logout(); }}>
                Сменить профиль
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
