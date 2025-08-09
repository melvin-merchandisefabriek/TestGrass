import React, { useState } from 'react';

// Minimal form: add a shape reference (existing JSON path already in /data or elsewhere)
const AddShapeForm = ({ onAdded }) => {
  const [id, setId] = useState('');
  const [path, setPath] = useState('/data/triangleShape.json');
  const [status, setStatus] = useState(null); // success | error message
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState('reference'); // 'reference' | 'new'
  const [filename, setFilename] = useState('newShape.json');
  const [shapeJsonText, setShapeJsonText] = useState('{\n  "id": "example-shape",\n  "name": "Example",\n  "width": 100,\n  "height": 100,\n  "controlPoints": [],\n  "segments": [],\n  "style": {"fill": "#ffffff22", "stroke": "#fff", "strokeWidth": 1}\n}');

  function handleSubmit(e) {
    e.preventDefault();
    if (!id.trim()) return;
    setSubmitting(true);
    setStatus(null);
    let payload;
    if (mode === 'reference') {
      payload = { mode: 'reference', id: id.trim(), path: path.trim() };
    } else {
      let parsed;
      try {
        parsed = JSON.parse(shapeJsonText);
      } catch (err) {
        setStatus('Invalid JSON');
        setSubmitting(false);
        return;
      }
      payload = { mode: 'new', id: id.trim(), filename: filename.trim(), shapeJson: parsed };
    }
    fetch('/api/shapes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(r => r.json().then(data => ({ ok: r.ok, data })))
      .then(({ ok, data }) => {
        if (ok) {
          setStatus('added');
          setId('');
          if (onAdded) onAdded(data);
        } else {
          setStatus(data.error || 'error');
        }
      })
      .catch(() => setStatus('network error'))
      .finally(() => setSubmitting(false));
  }

  return (
    <form onSubmit={handleSubmit} style={{ position: 'fixed', top: 10, left: 10, background: '#111', padding: '8px 12px', border: '1px solid #444', borderRadius: 4, color: '#eee', fontSize: 12, width: 260, maxHeight: '80vh', overflowY: 'auto' }}>
      <div style={{ marginBottom: 4, fontWeight: 'bold' }}>Add Shape</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
        <label style={{ cursor: 'pointer' }}>
          <input type="radio" value="reference" checked={mode === 'reference'} onChange={() => setMode('reference')} disabled={submitting} /> Ref
        </label>
        <label style={{ cursor: 'pointer' }}>
          <input type="radio" value="new" checked={mode === 'new'} onChange={() => setMode('new')} disabled={submitting} /> New
        </label>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label>
          ID:
          <input value={id} onChange={e => setId(e.target.value)} style={{ width: '100%', marginLeft: 4 }} disabled={submitting} />
        </label>
        {mode === 'reference' && (
          <label>
            Path:
            <input value={path} onChange={e => setPath(e.target.value)} style={{ width: '100%', marginLeft: 4 }} disabled={submitting} />
          </label>
        )}
        {mode === 'new' && (
          <>
            <label>
              Filename:
              <input value={filename} onChange={e => setFilename(e.target.value)} style={{ width: '100%', marginLeft: 4 }} disabled={submitting} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column' }}>
              JSON:
              <textarea value={shapeJsonText} onChange={e => setShapeJsonText(e.target.value)} rows={10} style={{ width: '100%', fontFamily: 'monospace', fontSize: 11 }} disabled={submitting} />
            </label>
          </>
        )}
        <button type="submit" disabled={submitting || !id.trim()} style={{ padding: '4px 8px' }}>Add</button>
        {status && <div style={{ color: status === 'added' ? '#4caf50' : '#f44336' }}>{status}</div>}
      </div>
    </form>
  );
};

export default AddShapeForm;
