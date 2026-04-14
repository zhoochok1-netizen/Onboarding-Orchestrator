import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { api } from '../api/client';
import { useUser } from '../context/UserContext';
import './KnowledgeBase.css';

function UploadModal({ onClose, onUploaded }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Гайд');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title.trim()) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', title.trim());
      fd.append('category', category);
      await api.uploadDocument(fd);
      onUploaded();
      onClose();
    } catch (err) {
      alert('Ошибка загрузки: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="doc-modal-overlay" onClick={onClose}>
      <div className="doc-modal card" onClick={(e) => e.stopPropagation()}>
        <div className="doc-modal-header">
          <h2>Загрузить документ</h2>
          <button className="btn btn-outline btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="upload-form">
          <div className="upload-field">
            <label>Название документа</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: СОП — Процесс согласования" required />
          </div>
          <div className="upload-field">
            <label>Категория</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="СОП">СОП</option>
              <option value="ПВТР">ПВТР</option>
              <option value="ЛНА">ЛНА</option>
              <option value="Гайд">Гайд</option>
            </select>
          </div>
          <div className="upload-field">
            <label>Файл (.txt, .md)</label>
            <input type="file" accept=".txt,.md,.csv" onChange={(e) => setFile(e.target.files[0])} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading || !file || !title.trim()}>
            {loading ? 'Загрузка...' : 'Загрузить'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function KnowledgeBase() {
  const { isHR } = useUser();
  const [docs, setDocs] = useState([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const loadDocs = () => api.getKnowledge().then(setDocs);
  useEffect(() => { loadDocs(); }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) {
      setSearchResults(null);
      return;
    }
    const results = await api.getKnowledge(search.trim());
    setSearchResults(results);
  };

  const handleAskAI = async (e) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    setAiAnswer(null);
    try {
      const res = await api.askKnowledge(aiQuestion.trim());
      setAiAnswer(res.answer);
    } catch (err) {
      setAiAnswer('Ошибка: ' + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const openDoc = async (docId) => {
    if (docId === 'ai-answer') return;
    const doc = await api.getDocument(docId);
    setSelectedDoc(doc);
  };

  const CATEGORY_ICONS = {
    'СОП': '📋',
    'ПВТР': '📖',
    'ЛНА': '🔒',
    'Гайд': '📘',
  };

  const handleAiLinkClick = (e) => {
    const link = e.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href');
    if (href && href.startsWith('knowledge:')) {
      e.preventDefault();
      const docId = href.replace('knowledge:', '');
      openDoc(docId);
    }
  };

  return (
    <div className="knowledge-page">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>База знаний</h1>
            <p>Поиск по документам компании — СОП, ЛНА, ПВТР и гайды</p>
          </div>
          {isHR && (
            <button className="btn btn-primary" onClick={() => setShowUpload(true)}>+ Загрузить документ</button>
          )}
        </div>
      </div>

      <form className="search-bar" onSubmit={handleSearch}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по базе знаний... (например: VPN, отпуск, доступы)"
        />
        <button type="submit" className="btn btn-primary">Искать</button>
        {searchResults && (
          <button type="button" className="btn btn-outline" onClick={() => { setSearch(''); setSearchResults(null); }}>
            Сбросить
          </button>
        )}
      </form>

      <div className="ai-ask-section card">
        <h3>Спросить AI по базе знаний</h3>
        <form className="ai-ask-form" onSubmit={handleAskAI}>
          <input
            type="text"
            value={aiQuestion}
            onChange={(e) => setAiQuestion(e.target.value)}
            placeholder="Задайте вопрос, например: как получить доступ к VPN?"
          />
          <button type="submit" className="btn btn-primary" disabled={aiLoading}>
            {aiLoading ? '⏳' : '🤖 Спросить AI'}
          </button>
        </form>
        {aiAnswer && (
          <div className="ai-answer" onClick={handleAiLinkClick}>
            <ReactMarkdown>{aiAnswer}</ReactMarkdown>
          </div>
        )}
      </div>

      {searchResults !== null ? (
        <div className="search-results">
          <h2>Результаты поиска: {searchResults.length} найдено</h2>
          {searchResults.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🔍</div>
              <p>Ничего не найдено. Попробуйте другой запрос или обратитесь к HR.</p>
            </div>
          ) : (
            <div className="results-list">
              {searchResults.map((r) => (
                <div key={r.id} className="card result-card" onClick={() => openDoc(r.id)}>
                  <div className="result-header">
                    <span className="result-icon">{CATEGORY_ICONS[r.category] || '📄'}</span>
                    <div>
                      <h3>{r.title}</h3>
                      <span className="badge badge-primary">{r.category}</span>
                    </div>
                  </div>
                  <div className="result-snippet">
                    <strong>Найдено:</strong>
                    <pre>{r.snippet}</pre>
                  </div>
                  <div className="result-source">Источник: {r.source}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="docs-grid card-grid">
          {docs.map((doc) => (
            <div key={doc.id} className="card doc-card" onClick={() => openDoc(doc.id)}>
              <div className="doc-icon">{CATEGORY_ICONS[doc.category] || '📄'}</div>
              <h3>{doc.title}</h3>
              <span className="badge badge-primary">{doc.category}</span>
              <div className="doc-meta">
                Загрузил: {doc.uploaded_by}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedDoc && (
        <div className="doc-modal-overlay" onClick={() => setSelectedDoc(null)}>
          <div className="doc-modal card" onClick={(e) => e.stopPropagation()}>
            <div className="doc-modal-header">
              <h2>{selectedDoc.title}</h2>
              <button className="btn btn-outline btn-sm" onClick={() => setSelectedDoc(null)}>✕</button>
            </div>
            <div className="doc-modal-meta">
              <span className="badge badge-primary">{selectedDoc.category}</span>
              <span>Загрузил: {selectedDoc.uploaded_by}</span>
            </div>
            <div className="doc-modal-content">
              <pre>{selectedDoc.content}</pre>
            </div>
          </div>
        </div>
      )}

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onUploaded={loadDocs} />}
    </div>
  );
}
