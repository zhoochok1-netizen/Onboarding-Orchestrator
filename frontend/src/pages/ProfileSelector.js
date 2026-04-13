import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useUser } from '../context/UserContext';
import './ProfileSelector.css';

const ROLE_META = {
  hr: { label: 'HR', icon: '👤', desc: 'Видит все онбординги, задачи и SLA' },
  manager: { label: 'Руководитель', icon: '👔', desc: 'Видит все онбординги и задачи своего отдела' },
  it: { label: 'IT', icon: '💻', desc: 'Видит свои задачи по настройке доступов' },
  mentor: { label: 'Наставник', icon: '🎓', desc: 'Видит задачи по своим подопечным' },
  newcomer: { label: 'Новичок', icon: '🆕', desc: 'Видит свой маршрут и чат-помощник' },
};

export default function ProfileSelector() {
  const [employees, setEmployees] = useState([]);
  const [groupedByRole, setGroupedByRole] = useState({});
  const { login } = useUser();

  useEffect(() => {
    api.getEmployees().then((data) => {
      setEmployees(data);
      const grouped = {};
      for (const emp of data) {
        if (!grouped[emp.role]) grouped[emp.role] = [];
        grouped[emp.role].push(emp);
      }
      setGroupedByRole(grouped);
    });
  }, []);

  const roleOrder = ['hr', 'manager', 'it', 'mentor', 'newcomer'];

  return (
    <div className="profile-selector">
      <div className="profile-selector-inner">
        <div className="ps-header">
          <div className="ps-logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <h1>Onboarding Orchestrator</h1>
          <p>Выберите профиль для входа</p>
        </div>

        <div className="ps-roles">
          {roleOrder.map((role) => {
            const meta = ROLE_META[role];
            const emps = groupedByRole[role] || [];
            if (!emps.length) return null;
            return (
              <div key={role} className="ps-role-group">
                <div className="ps-role-header">
                  <span className="ps-role-icon">{meta.icon}</span>
                  <div>
                    <h2>{meta.label}</h2>
                    <span className="ps-role-desc">{meta.desc}</span>
                  </div>
                </div>
                <div className="ps-employees">
                  {emps.map((emp) => (
                    <button key={emp.id} className="ps-employee-btn" onClick={() => login(emp)}>
                      <div className="ps-avatar">
                        {emp.full_name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div className="ps-emp-info">
                        <span className="ps-emp-name">{emp.full_name}</span>
                        <span className="ps-emp-dept">{emp.department}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
