import React, { useRef, useState } from 'react';

import TeamAvatar from './TeamAvatar';
import { compressImage } from '../utils/image';

/**
 * Modal-based photo picker. User chooses a local image, we compress/square
 * it, preview it, and on Save hand the resulting data URL back to the
 * parent via `onSave(dataUrl)`.
 *
 * Props:
 *  - open          : boolean - controls visibility
 *  - title         : string  - header text
 *  - currentPhoto  : string  - existing data URL (for initial preview + remove)
 *  - fallbackName  : string  - name used for initials when no photo is set
 *  - onSave        : async (dataUrl) => void
 *  - onRemove      : async () => void            (optional, hides remove btn if omitted)
 *  - onClose       : () => void
 *  - saving        : boolean - when true, buttons disabled ("Saving…")
 */
function PhotoUploader({
  open,
  title = 'Upload photo',
  currentPhoto = '',
  fallbackName = '',
  onSave,
  onRemove,
  onClose,
  saving = false,
}) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(currentPhoto || '');
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState(null);
  const [working, setWorking] = useState(false);

  // Reset internal state whenever the modal is reopened for a different
  // subject. Keeping this in an effect would be fine but explicit branches
  // on `open` are cheaper.
  React.useEffect(() => {
    if (open) {
      setPreview(currentPhoto || '');
      setDirty(false);
      setError(null);
    }
  }, [open, currentPhoto]);

  if (!open) return null;

  const handlePick = () => {
    if (inputRef.current) inputRef.current.click();
  };

  const handleFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setError(null);
    try {
      setWorking(true);
      const dataUrl = await compressImage(file);
      setPreview(dataUrl);
      setDirty(true);
    } catch (err) {
      setError(err.message || 'Could not load that image');
    } finally {
      setWorking(false);
      // Allow re-selecting the same file next time.
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!dirty || !preview) return;
    try {
      await onSave(preview);
    } catch (_) {
      // Parent surfaces errors via its own state; we just keep the modal open.
    }
  };

  const handleRemove = async () => {
    if (!onRemove) return;
    try {
      await onRemove();
    } catch (_) {
      // Parent surfaces errors.
    }
  };

  const busy = saving || working;

  return (
    <div className="modal-backdrop" onClick={busy ? undefined : onClose}>
      <div
        className="modal photo-uploader-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{title}</h3>

        <div className="photo-preview">
          <TeamAvatar name={fallbackName} photo={preview} size={140} />
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={handleFile}
          style={{ display: 'none' }}
        />

        <button
          type="button"
          className="btn"
          onClick={handlePick}
          disabled={busy}
        >
          {working
            ? 'Processing…'
            : preview
            ? 'Choose a different image'
            : 'Choose an image'}
        </button>

        <p className="muted small">
          We'll resize and compress the image to keep it small (roughly 256×256).
          PNG, JPEG, WEBP or GIF.
        </p>

        {error && <p className="form-message error">{error}</p>}

        <div className="modal-actions">
          {onRemove && currentPhoto && !dirty && (
            <button
              type="button"
              className="btn danger"
              onClick={handleRemove}
              disabled={busy}
            >
              Remove photo
            </button>
          )}
          <button
            type="button"
            className="btn"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={handleSave}
            disabled={busy || !dirty || !preview}
          >
            {saving ? 'Saving…' : 'Save photo'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PhotoUploader;
