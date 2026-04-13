import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
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
  const { theme, toggle } = useTheme();
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

        <button className="topbar-icon-btn theme-toggle" onClick={toggle} title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}>
          {theme === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
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
