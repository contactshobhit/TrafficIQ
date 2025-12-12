import React, { useRef, useState } from 'react';
import SummaryCards from './components/SummaryCards';
import AggregatedTable from './components/AggregatedTable';
import EditFiltersModal from './components/EditFiltersModal';

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
  const [tableSearch, setTableSearch] = useState('');
  const [sortCol, setSortCol] = useState('count');
  const [sortDir, setSortDir] = useState('desc');
  const [activeBox, setActiveBox] = useState('');
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
    // Find the column for traffic/count: prefer 'count', else 'total'
    let countIdx = header.findIndex(h => h.toLowerCase().includes('count'));
    if (countIdx === -1) {
      countIdx = header.findIndex(h => h.toLowerCase().includes('total'));
    }
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
  let filteredAgg = agg;
  if (activeBox === 'phishing') filteredAgg = filteredAgg.filter(r => r.cat === 'phishing');
  else if (activeBox === 'adult') filteredAgg = filteredAgg.filter(r => r.cat === 'adult');
  else if (activeBox === 'user') filteredAgg = filteredAgg.filter(r => r.cat === 'user');
  else if (activeBox === 'all') filteredAgg = agg;
  filteredAgg = filteredAgg.filter(r => (!search || r.reg.includes(search) || r.host.includes(search)) && (!tableSearch || r.reg.toLowerCase().includes(tableSearch.toLowerCase()) || r.host.toLowerCase().includes(tableSearch.toLowerCase()) || r.cat.toLowerCase().includes(tableSearch.toLowerCase())));
  // Sort
  filteredAgg = [...filteredAgg].sort((a, b) => {
    let vA = a[sortCol], vB = b[sortCol];
    if (sortCol === 'count') { vA = +vA; vB = +vB; }
    if (vA < vB) return sortDir === 'asc' ? -1 : 1;
    if (vA > vB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });
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
    <div style={{ maxWidth: '95%', margin: '28px auto', padding: 20, fontFamily: 'Roboto, Open Sans, Arial, sans-serif', background: '#f3f6fa', borderRadius: 18, boxShadow: '0 4px 32px rgba(37,99,235,0.07)' }}>
      <div className="header" style={{ width: '100%', padding: '0 15px' }}>
        <h2 style={{ margin: 0 }}>DNS Log Analyzer</h2>
      </div>
      <div className="filter-bar" style={{ width: '100%', padding: '0 15px', display: 'flex', gap: 16, alignItems: 'center', marginBottom: 18, marginTop: 12 }}>
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
      <SummaryCards summary={summary} activeBox={activeBox} setActiveBox={setActiveBox} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, alignItems: 'start' }}>
        <AggregatedTable
          data={filteredAgg}
          sortCol={sortCol}
          sortDir={sortDir}
          setSortCol={setSortCol}
          setSortDir={setSortDir}
          tableSearch={tableSearch}
          setTableSearch={setTableSearch}
        />
        <div style={{ background: '#fff', borderRadius: 10, padding: '8px 4px', border: '1px solid #eee', minWidth: 0 }}>
          <h3 style={{ margin: 0 }}>Preview (first 200 rows)</h3>
          <div style={{ marginTop: 8, maxHeight: 520, overflow: 'auto', minWidth: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: 14 }}>
              <colgroup>
                <col style={{ width: '38%' }} />
                <col style={{ width: '22%' }} />
                <col style={{ width: '22%' }} />
                <col style={{ width: '18%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={{ padding: '4px 6px', textAlign: 'left', whiteSpace: 'nowrap' }}>Hostname / URL</th>
                  <th style={{ padding: '4px 6px', textAlign: 'left', whiteSpace: 'nowrap' }}>Registered</th>
                  <th style={{ padding: '4px 6px', textAlign: 'left', whiteSpace: 'nowrap' }}>Category</th>
                  <th style={{ padding: '4px 6px', textAlign: 'right', whiteSpace: 'nowrap' }}>Count</th>
                </tr>
              </thead>
              <tbody>
                {filteredPreview.map((r, i) => (
                  <tr key={i}>
                    <td style={{ padding: '3px 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.host}</td>
                    <td style={{ padding: '3px 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.reg}</td>
                    <td style={{ padding: '3px 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.cat}</td>
                    <td style={{ padding: '3px 6px', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <EditFiltersModal
        show={showModal}
        onClose={() => setShowModal(false)}
        editPrefs={editPrefs}
        setEditPrefs={setEditPrefs}
        onSave={() => {
          const newPrefs = {
            phishKeys: splitList(editPrefs.phishKeys),
            phishTlds: splitList(editPrefs.phishTlds),
            adultKeys: splitList(editPrefs.adultKeys),
            adultTlds: splitList(editPrefs.adultTlds),
            infraKeys: splitList(editPrefs.infraKeys),
          };
          setPrefs(newPrefs);
          setShowModal(false);
          if (rows.length) parseCsv(rows.map(r => [r.raw, r.host, r.reg, r.cat, r.count].join(',')).join('\n'));
        }}
      />
    </div>
  );
}
