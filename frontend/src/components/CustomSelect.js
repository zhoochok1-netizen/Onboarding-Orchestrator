import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import './CustomSelect.css';

export default function CustomSelect({ value, onChange, options, placeholder, variant }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef(null);

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected ? selected.label : placeholder || 'Выберите...';

  const updatePos = useCallback(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left, width: Math.max(rect.width, 160) });
    }
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (open) updatePos();
  }, [open, updatePos]);

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  const colorStyle = variant === 'status' && selected?.color
    ? { '--cs-color': selected.color, '--cs-bg': selected.bg }
    : {};

  return (
    <div className={`cs ${variant || ''} ${open ? 'cs-open' : ''}`} ref={ref} style={colorStyle}>
      <button type="button" className="cs-trigger" onClick={() => setOpen(!open)}>
        {selected?.dot && <span className="cs-dot" style={{ background: selected.dot }}></span>}
        <span className="cs-label">{displayLabel}</span>
        <svg className="cs-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && ReactDOM.createPortal(
        <div
          className="cs-dropdown"
          style={{ position: 'fixed', top: pos.top, left: pos.left, minWidth: pos.width }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`cs-option ${opt.value === value ? 'cs-selected' : ''}`}
              onClick={() => handleSelect(opt.value)}
              style={opt.color ? { '--opt-color': opt.color } : {}}
            >
              {opt.dot && <span className="cs-dot" style={{ background: opt.dot }}></span>}
              <span>{opt.label}</span>
              {opt.value === value && (
                <svg className="cs-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
