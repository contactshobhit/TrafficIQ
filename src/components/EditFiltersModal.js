import React from "react";

/**
 * EditFiltersModal - modal for editing filter lists
 * @param {Object} props
 * @param {boolean} props.show - show modal
 * @param {function} props.onClose - close handler
 * @param {Object} props.editPrefs - filter values
 * @param {function} props.setEditPrefs - setter
 * @param {function} props.onSave - save handler
 */
export default function EditFiltersModal({ show, onClose, editPrefs, setEditPrefs, onSave }) {
  if (!show) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
      <div style={{ width: 480, background: 'white', borderRadius: 10, padding: 24, boxShadow: '0 18px 60px rgba(2,6,23,0.2)' }}>
        <h3>Edit Filters & Mappings</h3>
        <p style={{ color: '#888', fontSize: 13 }}>Modify the keyword lists and TLDs. Changes are applied immediately.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: '#888' }}>Phishing Keywords (comma separated)</label>
            <textarea value={editPrefs.phishKeys} onChange={e => setEditPrefs({ ...editPrefs, phishKeys: e.target.value })} style={{ width: '100%', height: 48, marginBottom: 8 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#888' }}>Phishing High-Risk TLDs (comma separated)</label>
            <textarea value={editPrefs.phishTlds} onChange={e => setEditPrefs({ ...editPrefs, phishTlds: e.target.value })} style={{ width: '100%', height: 48, marginBottom: 8 }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: '#888' }}>Adult Keywords (comma separated)</label>
            <textarea value={editPrefs.adultKeys} onChange={e => setEditPrefs({ ...editPrefs, adultKeys: e.target.value })} style={{ width: '100%', height: 48, marginBottom: 8 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#888' }}>Adult TLDs (comma separated)</label>
            <textarea value={editPrefs.adultTlds} onChange={e => setEditPrefs({ ...editPrefs, adultTlds: e.target.value })} style={{ width: '100%', height: 48, marginBottom: 8 }} />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={{ fontSize: 12, color: '#888' }}>Infrastructure / CDN patterns (comma separated)</label>
          <textarea value={editPrefs.infraKeys} onChange={e => setEditPrefs({ ...editPrefs, infraKeys: e.target.value })} style={{ width: '100%', height: 48, marginBottom: 8 }} />
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn" style={{ background: '#eef2ff', color: '#2563eb', border: '1px solid #2563eb22', borderRadius: 8, padding: '8px 12px', fontWeight: 500, cursor: 'pointer' }} onClick={onClose}>Close</button>
          <button className="btn" style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, padding: '8px 12px', fontWeight: 500, cursor: 'pointer' }} onClick={onSave}>Save & Apply</button>
        </div>
      </div>
    </div>
  );
}
