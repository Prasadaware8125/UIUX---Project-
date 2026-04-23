import React, { useState, useEffect, useCallback } from 'react';

let toastFn = null;

export const showToast = (message, type = 'info') => {
  if (toastFn) toastFn(message, type);
};

const Toast = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    toastFn = (message, type) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };
    return () => { toastFn = null; };
  }, []);

  const icon = { success: '✅', error: '❌', info: 'ℹ️' };

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span>{icon[t.type]}</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 500 }}>{t.message}</p>
          </div>
          <button
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 16, cursor: 'pointer' }}
          >×</button>
        </div>
      ))}
    </div>
  );
};

export default Toast;
