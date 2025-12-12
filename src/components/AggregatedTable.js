import React from "react";

/**
 * AggregatedTable - sortable, filterable table for DNS data
 * @param {Object} props
 * @param {Array} props.data - table rows
 * @param {string} props.sortCol - column to sort
 * @param {string} props.sortDir - direction
 * @param {function} props.setSortCol - setter
 * @param {function} props.setSortDir - setter
 * @param {string} props.tableSearch - search string
 * @param {function} props.setTableSearch - setter
 */
const HEADERS = [
  { key: "reg", label: "Registered" },
  { key: "host", label: "Platform" },
  { key: "count", label: "Count" },
  { key: "cat", label: "Category" },
];

export default function AggregatedTable({ data, sortCol, sortDir, setSortCol, setSortDir, tableSearch, setTableSearch }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: 18, border: "1.5px solid #e0e7ef", boxShadow: "0 2px 12px #e0e7ef", marginBottom: 24 }}>
      <h3 style={{ margin: 0 }}>Aggregated Registered Domains</h3>
      <div style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>Group by registered domain · sorted by count</div>
      <input
        type="text"
        placeholder="Search table..."
        value={tableSearch}
        onChange={e => setTableSearch(e.target.value)}
        style={{ marginBottom: 10, padding: 6, borderRadius: 6, border: "1px solid #eee", width: 220 }}
      />
      <div style={{ marginTop: 8, maxHeight: 520, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15, fontFamily: 'Roboto, Open Sans, Arial, sans-serif' }}>
          <thead>
            <tr style={{ background: "#2563eb", color: "white", fontWeight: "bold" }}>
              {HEADERS.map(h => (
                <th
                  key={h.key}
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    setSortCol(h.key);
                    setSortDir(sortCol === h.key && sortDir === "asc" ? "desc" : "asc");
                  }}
                >
                  {h.label} {sortCol === h.key ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((r, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? "#f6f8fa" : "white" }}>
                <td style={{ fontWeight: 500 }}>{r.reg}</td>
                <td>{r.host}</td>
                <td>{r.count}</td>
                <td>{r.cat}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
