import React from "react";

/**
 * SummaryCards - clickable summary/statistics cards for DNS categories
 * @param {Object} props
 * @param {Object} props.summary - summary stats
 * @param {string} props.activeBox - currently selected box
 * @param {function} props.setActiveBox - setter for active box
 */
const CARD_CONFIG = [
  { key: "all", label: "TOTAL DOMAINS", value: s => s.totalDomains, color: "#2563eb" },
  { key: "all", label: "TOTAL REQUESTS", value: s => s.totalRequests, color: "#2563eb" },
  { key: "user", label: "USER-FACING", value: s => s.user, color: "#2563eb" },
  { key: "phishing", label: "PHISHING SUSPECTS", value: s => s.phishing, color: "#ef4444" },
  { key: "adult", label: "ADULT / PORN", value: s => s.adult, color: "#ef4444" },
];

export default function SummaryCards({ summary, activeBox, setActiveBox }) {
  return (
    <div className="summary-cards" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 15, marginBottom: 24 }}>
      {CARD_CONFIG.map((card, i) => (
        <div
          key={i}
          style={{
            padding: 18,
            borderRadius: 16,
            background: "#f8fafc",
            textAlign: "center",
            border: "1.5px solid #e0e7ef",
            cursor: "pointer",
            boxShadow:
              activeBox === card.key
                ? `0 0 0 3px ${card.color}`
                : "0 2px 8px #e0e7ef",
            transition: "box-shadow 0.2s",
          }}
          onClick={() => setActiveBox(card.key)}
        >
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6, fontWeight: 500 }}>{card.label}</div>
          <div style={{ fontWeight: 800, fontSize: 22, color: card.color }}>{card.value(summary)}</div>
        </div>
      ))}
    </div>
  );
}
