import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useUser } from '../context/UserContext';
import './Chatbot.css';

const ROLE_SUGGESTIONS = {
  hr: ['Что мне нужно сделать?', 'Какие задачи просрочены?', 'Прогресс онбордингов', 'График работы', 'ДМС и компенсации', 'Удалённая работа'],
  manager: ['Мои задачи', 'Прогресс отдела', 'Просроченные задачи', 'Встречи команды', 'Система оценки', 'Jira'],
  it: ['Мои задачи', 'Как выдать доступы?', 'Политика безопасности', 'VPN', 'Git', 'Оффбординг'],
  mentor: ['Мои задачи', 'Прогресс подопечных', 'Встречи', 'Система оценки', 'Просроченные', 'Git'],
  newcomer: ['Что мне делать?', 'Мой прогресс', 'График', 'VPN', 'ДМС', 'Slack', 'Доступы', 'Встречи'],
};

const GREETING = 'Привет! 👋 Я AI-помощник по онбордингу.\n\n- **Задачи** — «что мне делать?»\n- **Прогресс** — «мой прогресс»\n- **Процессы** — график, VPN, доступы, Jira\n- **Документы** — [База знаний](/knowledge)';

const STORAGE_KEY = 'onboarding_chat_';

function TaskDetailModal({ taskId, onClose }) {
  const [task, setTask] = useState(null);
  const [onboarding, setOnboarding] = useState(null);

  useEffect(() => {
    api.getTasks().then((tasks) => {
      const found = tasks.find((t) => t.id === taskId);
      if (found) {
        setTask(found);
        api.getOnboarding(found.onboarding_id).then(setOnboarding);
      }
    });
  }, [taskId]);

  if (!task) return null;

  const STATUS_MAP = { waiting: 'Ожидает', in_progress: 'В работе', completed: 'Выполнено', overdue: 'Просрочено' };
  const SLA_MAP = { green: '🟢 В срок', yellow: '🟡 Скоро дедлайн', red: '🔴 Просрочено' };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="detail-modal-header">
          <h2>{task.title}</h2>
          <button className="btn btn-outline btn-sm" onClick={onClose}>✕</button>
        </div>
        <p className="detail-modal-desc">{task.description}</p>
        <div className="detail-modal-grid">
          <div className="dm-field"><span className="dm-label">Статус</span><span className={`badge badge-${task.status === 'completed' ? 'green' : task.status === 'overdue' ? 'red' : 'yellow'}`}>{STATUS_MAP[task.status]}</span></div>
          <div className="dm-field"><span className="dm-label">SLA</span><span>{SLA_MAP[task.sla_status]}</span></div>
          <div className="dm-field"><span className="dm-label">Дедлайн</span><span>{new Date(task.deadline).toLocaleDateString('ru')}</span></div>
          <div className="dm-field"><span className="dm-label">Этап</span><span className="badge badge-primary">{task.stage_name}</span></div>
          <div className="dm-field"><span className="dm-label">Новичок</span><span>{task.newcomer_name}</span></div>
          <div className="dm-field"><span className="dm-label">Ответственный</span><span>{task.assigned_to_name}</span></div>
        </div>
        {onboarding && (
          <div className="dm-onboarding">
            <h3>Онбординг: {onboarding.newcomer_name}</h3>
            <div className="dm-onb-meta">
              <span>{onboarding.template_role}</span>
              <span>Этап: {onboarding.current_stage}</span>
              <span>Прогресс: {onboarding.progress}%</span>
            </div>
            <div className="progress-bar progress-primary" style={{ marginTop: 8 }}>
              <div className="progress-fill" style={{ width: `${onboarding.progress}%` }}></div>
            </div>
            <Link to={`/onboardings/${onboarding.id}`} className="btn btn-outline btn-sm" style={{ marginTop: 12 }} onClick={onClose}>
              Открыть онбординг →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function OnboardingDetailModal({ onboardingId, onClose }) {
  const [onboarding, setOnboarding] = useState(null);

  useEffect(() => {
    api.getOnboarding(onboardingId).then(setOnboarding);
  }, [onboardingId]);

  if (!onboarding) return null;

  const completed = onboarding.tasks.filter((t) => t.status === 'completed').length;
  const overdue = onboarding.tasks.filter((t) => t.status === 'overdue').length;
  const inProgress = onboarding.tasks.filter((t) => t.status === 'in_progress').length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="detail-modal-header">
          <h2>{onboarding.newcomer_name}</h2>
          <button className="btn btn-outline btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="dm-onb-hero">
          <span className="badge badge-primary">{onboarding.template_role}</span>
          <span>Начало: {new Date(onboarding.start_date).toLocaleDateString('ru')}</span>
          <span>Этап: **{onboarding.current_stage}**</span>
        </div>
        <div className="detail-modal-grid">
          <div className="dm-field"><span className="dm-label">Прогресс</span><span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{onboarding.progress}%</span></div>
          <div className="dm-field"><span className="dm-label">Выполнено</span><span style={{ color: 'var(--green)' }}>{completed}</span></div>
          <div className="dm-field"><span className="dm-label">В работе</span><span style={{ color: 'var(--yellow)' }}>{inProgress}</span></div>
          <div className="dm-field"><span className="dm-label">Просрочено</span><span style={{ color: 'var(--red)' }}>{overdue}</span></div>
        </div>
        <div className="progress-bar progress-primary" style={{ margin: '12px 0' }}>
          <div className="progress-fill" style={{ width: `${onboarding.progress}%` }}></div>
        </div>
        {overdue > 0 && (
          <div className="dm-overdue-list">
            <h3>⚠️ Просроченные задачи</h3>
            {onboarding.tasks.filter((t) => t.status === 'overdue').map((t) => (
              <div key={t.id} className="dm-task-row">
                <span className="sla-dot sla-red"></span>
                <span>{t.title}</span>
                <span className="dm-task-meta">до {new Date(t.deadline).toLocaleDateString('ru')} · {t.assigned_to_name}</span>
              </div>
            ))}
          </div>
        )}
        <Link to={`/onboardings/${onboarding.id}`} className="btn btn-primary" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }} onClick={onClose}>
          Перейти к онбордингу
        </Link>
      </div>
    </div>
  );
}

function MarkdownMessage({ content, onTaskClick, onOnboardingClick }) {
  // Preprocess: convert task:/onboarding: links to data-attributes on <a> with safe hrefs
  const processed = content
    .replace(/\[([^\]]+)\]\(task:([^)]+)\)/g, '[$1](#task--$2)')
    .replace(/\[([^\]]+)\]\(onboarding:([^)]+)\)/g, '[$1](#onb--$2)');

  const handleClick = (e) => {
    const link = e.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    if (href.startsWith('#task--')) {
      e.preventDefault();
      e.stopPropagation();
      onTaskClick(href.replace('#task--', ''));
    } else if (href.startsWith('#onb--')) {
      e.preventDefault();
      e.stopPropagation();
      onOnboardingClick(href.replace('#onb--', ''));
    }
  };

  return (
    <div onClick={handleClick}>
      <ReactMarkdown
        components={{
          a: ({ href, children }) => {
            if (href && href.startsWith('#task--')) {
              return <a href={href} className="chat-entity-link">{children}</a>;
            }
            if (href && href.startsWith('#onb--')) {
              return <a href={href} className="chat-entity-link chat-entity-onb">{children}</a>;
            }
            if (href && href.startsWith('/')) {
              return <Link to={href} className="chat-link">{children}</Link>;
            }
            return <a href={href} target="_blank" rel="noopener noreferrer" className="chat-link">{children}</a>;
          },
          table: ({ children }) => (
            <div className="chat-table-wrap"><table className="chat-table">{children}</table></div>
          ),
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}

export default function Chatbot() {
  const { user } = useUser();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalTask, setModalTask] = useState(null);
  const [modalOnb, setModalOnb] = useState(null);
  const messagesEnd = useRef(null);

  const suggestions = ROLE_SUGGESTIONS[user?.role] || ROLE_SUGGESTIONS.newcomer;
  const storageKey = STORAGE_KEY + (user?.id || 'anon');

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setMessages(JSON.parse(saved));
      } else {
        setMessages([{ role: 'assistant', content: GREETING }]);
      }
    } catch {
      setMessages([{ role: 'assistant', content: GREETING }]);
    }
    setInput('');
    setLoading(false);
  }, [storageKey]);

  // Save to localStorage
  const saveMessages = useCallback((msgs) => {
    try { localStorage.setItem(storageKey, JSON.stringify(msgs)); } catch {}
  }, [storageKey]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', content: text.trim() };
    const withUser = [...messages, userMsg];
    setMessages(withUser);
    saveMessages(withUser);
    setInput('');
    setLoading(true);

    try {
      const data = await api.sendChat(text.trim());
      const withResponse = [...withUser, { role: 'assistant', content: data.response }];
      setMessages(withResponse);
      saveMessages(withResponse);
    } catch {
      const withError = [...withUser, { role: 'assistant', content: 'Произошла ошибка. Попробуйте позже.' }];
      setMessages(withError);
      saveMessages(withError);
    }
    setLoading(false);
  };

  const clearChat = () => {
    const fresh = [{ role: 'assistant', content: GREETING }];
    setMessages(fresh);
    saveMessages(fresh);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="chatbot-page">
      <div className="page-header">
        <h1>AI Чатбот</h1>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p>Помощник знает ваш контекст и задачи</p>
          {messages.length > 1 && (
            <button className="btn btn-outline btn-sm" onClick={clearChat}>Очистить чат</button>
          )}
        </div>
      </div>

      <div className="chat-container card">
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-message ${msg.role}`}>
              <div className="message-avatar">
                {msg.role === 'assistant' ? '🤖' : '👤'}
              </div>
              <div className="message-content">
                <div className="message-bubble">
                  {msg.role === 'assistant' ? (
                    <MarkdownMessage
                      content={msg.content}
                      onTaskClick={setModalTask}
                      onOnboardingClick={setModalOnb}
                    />
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="chat-message assistant">
              <div className="message-avatar">🤖</div>
              <div className="message-content">
                <div className="message-bubble typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEnd} />
        </div>

        <div className="chat-suggestions">
          {suggestions.map((s) => (
            <button key={s} className="suggestion-btn" onClick={() => sendMessage(s)}>
              {s}
            </button>
          ))}
        </div>

        <form className="chat-input-form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Напишите ваш вопрос..."
            disabled={loading}
          />
          <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()}>
            Отправить
          </button>
        </form>
      </div>

      {modalTask && <TaskDetailModal taskId={modalTask} onClose={() => setModalTask(null)} />}
      {modalOnb && <OnboardingDetailModal onboardingId={modalOnb} onClose={() => setModalOnb(null)} />}
    </div>
  );
}
