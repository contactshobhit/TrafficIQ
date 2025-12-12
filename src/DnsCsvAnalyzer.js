import React, { useRef, useState } from 'react';

// Helper functions from the HTML reference
function splitList(text) {
  return text.split(',').map(s => s.trim()).filter(Boolean);
}
function getRegisteredDomain(host) {
  if (!host) return '';
  host = host.split(':')[0].toLowerCase().replace(/^\.+|\.+$/g, '');
  const parts = host.split('.');
  if (parts.length <= 2) return host;
  const twoLevel = ['co.uk', 'gov.uk', 'ac.uk', 'co.in', 'com.au', 'com.br', 'co.nz'];
  const last2 = parts.slice(-2).join('.');
  if (twoLevel.includes(last2)) return parts.slice(-3).join('.');
  return parts.slice(-2).join('.');
}
function extractHostname(raw) {
  if (!raw) return '';
  try {
    if (raw.startsWith('http://') || raw.startsWith('https://')) return new URL(raw).hostname;
  } catch (e) {}
  return raw.split('/')[0].replace(/.*@/, '').replace(/^\.+|\.+$/g, '');
}

// Classification logic
function classifyHost(host, prefs) {
  const h = host.toLowerCase();
  if (prefs.infraKeys.some(k => h.includes(k))) return 'infrastructure';
  if (prefs.phishKeys.some(k => h.includes(k))) return 'phishing';
  if (prefs.phishTlds.some(tld => h.endsWith(tld))) return 'phishing';
  if (prefs.adultKeys.some(k => h.includes(k))) return 'adult';
  if (prefs.adultTlds.some(tld => h.endsWith(tld))) return 'adult';
  // Heuristic: user-facing if not infra/phish/adult
  return 'user';
}

const DEFAULTS = {
  phishKeys: splitList('login,signin,secure,verify,auth,bank,wallet,payment,update,confirm,alert'),
  phishTlds: splitList('.zip,.kim,.rest,.xyz,.country,.gq,.work,.ml,.cf'),
  adultKeys: splitList('porn,sex,xxx,xvideos,xnxx,cam,hentai,milf,escort'),
  adultTlds: splitList('.xxx,.adult,.porn'),
  infraKeys: splitList('akamai,cloudfront,cloudflare,amazonaws,akamaized,gstatic,googleusercontent,fbcdn,edgesuite,fastly,cdn'),
};

export default function DnsCsvAnalyzer() {
  const fileInput = useRef();
  const [fileName, setFileName] = useState('none');
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({
    totalDomains: 0,
    totalRequests: 0,
    user: 0,
    phishing: 0,
    adult: 0,
    infrastructure: 0,
  });
  const [agg, setAgg] = useState([]);
  const [preview, setPreview] = useState([]);
  const [search, setSearch] = useState('');
  const [prefs, setPrefs] = useState(DEFAULTS);
  const [showModal, setShowModal] = useState(false);
  const [editPrefs, setEditPrefs] = useState({ ...DEFAULTS });

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = evt => {
      const text = evt.target.result;
      parseCsv(text);
    };
    reader.readAsText(file);
  }

  function parseCsv(text) {
    // Simple CSV parse (assume comma, skip header)
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return;
    const header = lines[0].split(',');
    const hostIdx = header.findIndex(h => h.toLowerCase().includes('domain') || h.toLowerCase().includes('hostname'));
    const urlIdx = header.findIndex(h => h.toLowerCase().includes('url'));
    const countIdx = header.findIndex(h => h.toLowerCase().includes('count'));
    const data = lines.slice(1).map(line => {
      const cols = line.split(',');
      const raw = cols[urlIdx] || cols[hostIdx] || '';
      const host = extractHostname(raw);
      const reg = getRegisteredDomain(host);
      const cat = classifyHost(host, prefs);
      const count = countIdx >= 0 ? parseInt(cols[countIdx], 10) || 1 : 1;
      return { raw, host, reg, cat, count };
    });
    setRows(data);
    // Summary
    const domSet = new Set(data.map(r => r.reg));
    const summary = {
      totalDomains: domSet.size,
      totalRequests: data.reduce((a, b) => a + b.count, 0),
      user: data.filter(r => r.cat === 'user').length,
      phishing: data.filter(r => r.cat === 'phishing').length,
      adult: data.filter(r => r.cat === 'adult').length,
      infrastructure: data.filter(r => r.cat === 'infrastructure').length,
    };
    setSummary(summary);
    // Aggregation
    const aggMap = {};
    data.forEach(r => {
      if (!aggMap[r.reg]) aggMap[r.reg] = { ...r, count: 0 };
      aggMap[r.reg].count += r.count;
    });
    setAgg(Object.values(aggMap).sort((a, b) => b.count - a.count));
    setPreview(data.slice(0, 200));
  }

  // Filtering
  const filteredAgg = agg.filter(r => !search || r.reg.includes(search) || r.host.includes(search));
  const filteredPreview = preview.filter(r => !search || r.reg.includes(search) || r.host.includes(search));

  // Export visible CSV
  function exportVisibleCsv(data) {
    if (!data.length) {
      alert('No rows to export');
      return;
    }
    const ths = ['Registered','Platform','Count','Category'];
    const rowsOut = [ths.join(',')];
    data.forEach(r => {
      rowsOut.push([r.reg, r.host, r.count, r.cat].map(val => '"' + String(val).replace(/"/g, '""') + '"').join(','));
    });
    const blob = new Blob([rowsOut.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dns_filtered_aggregated.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ maxWidth: 1200, margin: '28px auto', padding: 20 }}>
      <h2>DNS Log Analyzer</h2>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 18 }}>
        <label style={{ background: '#fff', border: '1px dashed #ccc', borderRadius: 8, padding: '10px 14px', cursor: 'pointer' }}>
          📁 Upload DNS CSV
          <input type="file" accept=".csv" style={{ display: 'none' }} ref={fileInput} onChange={handleFile} />
        </label>
        <span style={{ color: '#888', fontSize: 13 }}>Detected file: {fileName}</span>
        <input
          className="search"
          placeholder="Search domain / platform..."
          style={{ padding: 8, borderRadius: 8, border: '1px solid #eef2ff', background: 'white', width: 260 }}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button
          className="btn"
          style={{ background: '#eef2ff', color: '#2563eb', border: '1px solid #2563eb22', borderRadius: 8, padding: '8px 12px', fontWeight: 500, cursor: 'pointer' }}
          onClick={() => exportVisibleCsv(filteredAgg)}
        >
          Export Visible CSV
        </button>
        <button
          className="btn"
          style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, padding: '8px 12px', fontWeight: 500, cursor: 'pointer' }}
          onClick={() => {
            setEditPrefs({
              phishKeys: prefs.phishKeys.join(','),
              phishTlds: prefs.phishTlds.join(','),
              adultKeys: prefs.adultKeys.join(','),
              adultTlds: prefs.adultTlds.join(','),
              infraKeys: prefs.infraKeys.join(','),
            });
            setShowModal(true);
          }}
        >
          ⚙️ Edit Filters
        </button>
      </div>
            {/* Edit Filters Modal */}
            {showModal && (
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
                    <button className="btn" style={{ background: '#eef2ff', color: '#2563eb', border: '1px solid #2563eb22', borderRadius: 8, padding: '8px 12px', fontWeight: 500, cursor: 'pointer' }} onClick={() => setShowModal(false)}>Close</button>
                    <button className="btn" style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, padding: '8px 12px', fontWeight: 500, cursor: 'pointer' }} onClick={() => {
                      const newPrefs = {
                        phishKeys: splitList(editPrefs.phishKeys),
                        phishTlds: splitList(editPrefs.phishTlds),
                        adultKeys: splitList(editPrefs.adultKeys),
                        adultTlds: splitList(editPrefs.adultTlds),
                        infraKeys: splitList(editPrefs.infraKeys),
                      };
                      setPrefs(newPrefs);
                      setShowModal(false);
                      // Re-parse rows if any
                      if (rows.length) parseCsv(rows.map(r => [r.raw, r.host, r.reg, r.cat, r.count].join(',')).join('\n'));
                    }}>Save & Apply</button>
                  </div>
                </div>
              </div>
            )}

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 18 }}>
        <div style={{ padding: 12, borderRadius: 10, background: '#fff', textAlign: 'center', border: '1px solid #eee' }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>TOTAL DOMAINS</div>
          <div style={{ fontWeight: 700, fontSize: 20 }}>{summary.totalDomains}</div>
        </div>
        <div style={{ padding: 12, borderRadius: 10, background: '#fff', textAlign: 'center', border: '1px solid #eee' }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>TOTAL REQUESTS</div>
          <div style={{ fontWeight: 700, fontSize: 20 }}>{summary.totalRequests}</div>
        </div>
        <div style={{ padding: 12, borderRadius: 10, background: '#fff', textAlign: 'center', border: '1px solid #eee' }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>USER-FACING</div>
          <div style={{ fontWeight: 700, fontSize: 20 }}>{summary.user}</div>
        </div>
        <div style={{ padding: 12, borderRadius: 10, background: '#fff', textAlign: 'center', border: '1px solid #eee' }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>PHISHING SUSPECTS</div>
          <div style={{ fontWeight: 700, fontSize: 20 }}>{summary.phishing}</div>
        </div>
        <div style={{ padding: 12, borderRadius: 10, background: '#fff', textAlign: 'center', border: '1px solid #eee' }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>ADULT / PORN</div>
          <div style={{ fontWeight: 700, fontSize: 20 }}>{summary.adult}</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, alignItems: 'start' }}>
        <div style={{ background: '#fff', borderRadius: 10, padding: 14, border: '1px solid #eee' }}>
          <h3 style={{ margin: 0 }}>Aggregated Registered Domains</h3>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>Group by registered domain · sorted by count</div>
          <div style={{ marginTop: 12, maxHeight: 520, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>Registered</th>
                  <th>Platform</th>
                  <th>Count</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {filteredAgg.map((r, i) => (
                  <tr key={i}>
                    <td>{r.reg}</td>
                    <td>{r.host}</td>
                    <td>{r.count}</td>
                    <td>{r.cat}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: 10, padding: 14, border: '1px solid #eee' }}>
          <h3 style={{ margin: 0 }}>Preview (first 200 rows)</h3>
          <div style={{ marginTop: 12, maxHeight: 520, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>Hostname / URL</th>
                  <th>Registered</th>
                  <th>Category</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {filteredPreview.map((r, i) => (
                  <tr key={i}>
                    <td>{r.host}</td>
                    <td>{r.reg}</td>
                    <td>{r.cat}</td>
                    <td>{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
