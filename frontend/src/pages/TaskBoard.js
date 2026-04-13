import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import './TaskBoard.css';

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

const SLA_CLASS = {
  green: 'sla-green',
  yellow: 'sla-yellow',
  red: 'sla-red',
};

export default function TaskBoard() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filterAssigned, setFilterAssigned] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    api.getTasks().then(setTasks);
    api.getEmployees().then(setEmployees);
  }, []);

  const handleStatusChange = async (taskId, newStatus) => {
    await api.updateTaskStatus(taskId, newStatus);
    const updated = await api.getTasks();
    setTasks(updated);
  };

  const filtered = tasks.filter((t) => {
    if (filterAssigned && t.assigned_to !== filterAssigned) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    return true;
  });

  const assignedEmployees = [...new Set(tasks.map((t) => t.assigned_to))].map((id) => {
    const emp = employees.find((e) => e.id === id);
    return emp ? { id: emp.id, name: emp.full_name } : { id, name: id };
  });

  return (
    <div className="taskboard">
      <div className="page-header">
        <h1>Доска задач</h1>
        <p>Задачи по всем активным онбордингам</p>
      </div>

      <div className="filters">
        <select value={filterAssigned} onChange={(e) => setFilterAssigned(e.target.value)}>
          <option value="">Все ответственные</option>
          {assignedEmployees.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Все статусы</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <div className="task-count">{filtered.length} задач</div>
      </div>

      <div className="card table-container">
        <table>
          <thead>
            <tr>
              <th>SLA</th>
              <th>Задача</th>
              <th>Новичок</th>
              <th>Этап</th>
              <th>Ответственный</th>
              <th>Дедлайн</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((task) => (
              <tr key={task.id}>
                <td><span className={`sla-dot ${SLA_CLASS[task.sla_status]}`}></span></td>
                <td>
                  <div className="task-title">{task.title}</div>
                  <div className="task-desc">{task.description}</div>
                </td>
                <td>{task.newcomer_name}</td>
                <td><span className="badge badge-primary">{task.stage_name}</span></td>
                <td>{task.assigned_to_name}</td>
                <td>{new Date(task.deadline).toLocaleDateString('ru')}</td>
                <td>
                  <select
                    className={`status-select ${STATUS_BADGE[task.status]?.replace('badge-', 'status-')}`}
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                  >
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
