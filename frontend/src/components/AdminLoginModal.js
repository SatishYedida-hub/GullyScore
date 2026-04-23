import React, { useEffect, useRef, useState } from 'react';

import { getErrorMessage } from '../services/api';
import { verifyAdminToken } from '../services/adminService';
import { setAdminToken } from '../utils/adminToken';

// Small modal for unlocking admin / owner mode. The key is verified
// server-side before being stored, so a typo never "half-unlocks" the UI.
function AdminLoginModal({ open, onClose, onUnlocked }) {
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setValue('');
      setError(null);
      setInfo(null);
      const id = window.setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 50);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const candidate = value.trim();
    if (!candidate) {
      setError('Enter your admin key.');
      return;
    }
    setError(null);
    setInfo(null);
    try {
      setSubmitting(true);
      const { data } = await verifyAdminToken(candidate);
      if (data?.configured === false) {
        setInfo(
          'Admin protection is not configured on the server. Deletes are open to everyone. Set ADMIN_TOKEN on the backend to lock them.'
        );
        setAdminToken('');
        if (onUnlocked) onUnlocked({ configured: false });
        return;
      }
      if (data?.isAdmin) {
        setAdminToken(candidate);
        if (onUnlocked) onUnlocked({ configured: true });
        if (onClose) onClose();
      } else {
        setError('That key didn\u2019t match.');
      }
    } catch (err) {
      if (err?.response?.status === 401) {
        setError('That key didn\u2019t match.');
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={submitting ? undefined : onClose}
    >
      <div
        className="modal admin-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-modal-title"
      >
        <h3 id="admin-modal-title">Unlock admin mode</h3>

        <form onSubmit={handleSubmit} className="admin-modal-form">
          <p className="muted small">
            Enter the admin key you set on the server (
            <code>ADMIN_TOKEN</code>). Only the owner needs this. It\u2019s
            stored on this device so you don\u2019t have to re-enter it.
          </p>

          <label className="form-field">
            <span>Admin key</span>
            <input
              ref={inputRef}
              type="password"
              autoComplete="off"
              spellCheck="false"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="your-secret-admin-key"
              disabled={submitting}
            />
          </label>

          {error && <p className="form-message error">{error}</p>}
          {info && <p className="form-message">{info}</p>}

          <div className="modal-actions">
            <button
              type="button"
              className="btn"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn primary"
              disabled={submitting}
            >
              {submitting ? 'Checking\u2026' : 'Unlock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminLoginModal;
