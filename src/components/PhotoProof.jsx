import { useState, useRef } from 'react';
import { insforge } from '../insforge';

/**
 * PhotoProof - shown with each clue.
 * Team uploads a group selfie as proof they reached the location.
 * @param {number} teamNumber
 * @param {string} location - the location they just arrived at
 * @param {function} onDone - called after successful upload (or skip)
 */
function PhotoProof({ teamNumber, location, onDone }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError('');
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');

    const path = `team${teamNumber}/${location}_${Date.now()}.jpg`;
    const { data, error: upErr } = await insforge.storage
      .from('th-proofs')
      .upload(path, file);

    if (upErr || !data) {
      setError('Upload failed. Try again or skip.');
      setUploading(false);
      return;
    }

    // Log submission in DB
    await insforge.database
      .from('th_submissions')
      .insert([{
        team_id: teamNumber,
        location: location,
        photo_url: data.url,
      }]);

    setUploading(false);
    setUploaded(true);
  };

  if (uploaded) {
    return (
      <div className="proof-done">
        <span className="proof-done-icon">✓</span>
        <span>Proof submitted! Scroll up for your next clue.</span>
        <button className="btn-link" onClick={onDone}>Continue →</button>
      </div>
    );
  }

  return (
    <div className="proof-box">
      <div className="proof-header">
        <span className="proof-label">// PROOF OF PRESENCE</span>
        <span className="proof-sub">Upload a group selfie at this location</span>
      </div>

      {preview ? (
        <div className="proof-preview-wrap">
          <img src={preview} alt="Group photo preview" className="proof-preview" />
          <button
            className="proof-change"
            onClick={() => { setFile(null); setPreview(null); }}
          >
            Change photo
          </button>
        </div>
      ) : (
        <button
          className="proof-upload-btn"
          onClick={() => inputRef.current.click()}
        >
          📷 Select Group Photo
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFile}
      />

      {error && <div className="proof-error">{error}</div>}

      <div className="proof-actions">
        {file && (
          <button
            className="btn-primary"
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? 'UPLOADING...' : 'SUBMIT PROOF'}
          </button>
        )}
        <button
          className="btn-skip"
          onClick={onDone}
          disabled={uploading}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

export default PhotoProof;
