import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import './KnowledgeBase.css';

export default function KnowledgeBase() {
  const [docs, setDocs] = useState([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);

  useEffect(() => {
    api.getKnowledge().then(setDocs);
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) {
      setSearchResults(null);
      return;
    }
    const results = await api.getKnowledge(search.trim());
    setSearchResults(results);
  };

  const openDoc = async (docId) => {
    const doc = await api.getDocument(docId);
    setSelectedDoc(doc);
  };

  const CATEGORY_ICONS = {
    'СОП': '📋',
    'ПВТР': '📖',
    'ЛНА': '🔒',
    'Гайд': '📘',
  };

  return (
    <div className="knowledge-page">
      <div className="page-header">
        <h1>База знаний</h1>
        <p>Поиск по документам компании — СОП, ЛНА, ПВТР и гайды</p>
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
    </div>
  );
}
