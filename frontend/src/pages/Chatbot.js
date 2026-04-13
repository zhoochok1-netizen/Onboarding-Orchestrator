import React, { useState, useRef, useEffect } from 'react';
import { api } from '../api/client';
import { useUser } from '../context/UserContext';
import './Chatbot.css';

const SUGGESTIONS = [
  'Какие у меня задачи?',
  'Какой график работы?',
  'Как настроить VPN?',
  'Как работать с CRM?',
  'Расскажи про дизайн-систему',
  'Процесс продаж',
  'Кто мой наставник?',
  'Как работать с Git?',
  'Политика безопасности',
  'Какой порядок отпуска?',
];

const GREETING = 'Привет! 👋 Я ваш помощник по онбордингу. Могу ответить на вопросы о процессах компании, подсказать ваши текущие задачи или найти информацию в базе знаний. Чем могу помочь?';

export default function Chatbot() {
  const { user } = useUser();
  const [messages, setMessages] = useState([{ role: 'assistant', content: GREETING }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEnd = useRef(null);

  useEffect(() => {
    setMessages([{ role: 'assistant', content: GREETING }]);
    setInput('');
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const data = await api.sendChat(text.trim());
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Произошла ошибка. Попробуйте позже.' }]);
    }
    setLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="chatbot-page">
      <div className="page-header">
        <h1>AI Чатбот</h1>
        <p>Задайте вопрос — помощник знает контекст вашего онбординга</p>
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
                  {msg.content.split('\n').map((line, j) => (
                    <React.Fragment key={j}>
                      {line}
                      {j < msg.content.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
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
          {SUGGESTIONS.map((s) => (
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
    </div>
  );
}
