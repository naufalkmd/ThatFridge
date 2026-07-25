"use client";

import { getAllItems, iconFor } from "@/lib/thatfridge/selectors";
import { daysLabel, freshColor } from "@/lib/thatfridge/utils";
import { useThatFridgeCtx } from "../ThatFridgeContext";
import PixelIcon from "../PixelIcon";

const SUGGESTIONS = ["Dairy", "Produce", "Leftovers", "Meat"];

export default function SearchScreen() {
  const { state, actions } = useThatFridgeCtx();
  const q = state.searchQuery.trim().toLowerCase();
  const results = q
    ? getAllItems(state).filter((i) => i.name.toLowerCase().includes(q) || i.sectionName.toLowerCase().includes(q))
    : [];

  return (
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#eaf6ff,#cfe8fb 55%,#eaf6ff)", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: "none", padding: "28px 20px 14px", display: "flex", alignItems: "center", gap: 10 }}>
        <div onClick={actions.goHome} style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", color: "#16325c", fontSize: 20, fontWeight: 600, cursor: "pointer", flex: "none" }}>
          ‹
        </div>
        <input
          autoFocus
          value={state.searchQuery}
          onChange={(e) => actions.onSearchChange(e.target.value)}
          placeholder="Search your fridge…"
          style={{ flex: 1, border: "none", outline: "none", background: "#fff", boxShadow: "0 6px 16px rgba(22,50,92,0.08)", borderRadius: 14, padding: "11px 16px", fontSize: 14, color: "#16325c" }}
        />
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 20px 30px" }}>
        {q.length === 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
            {SUGGESTIONS.map((label) => (
              <div
                key={label}
                onClick={() => actions.onSearchChange(label)}
                style={{ background: "#fff", border: "1px solid rgba(22,50,92,0.1)", boxShadow: "0 4px 10px rgba(22,50,92,0.05)", borderRadius: 14, padding: "8px 13px", fontSize: 12, fontWeight: 600, color: "#16325c", cursor: "pointer" }}
              >
                {label}
              </div>
            ))}
          </div>
        )}
        {results.length > 0 && (
          <div style={{ background: "#fff", boxShadow: "0 6px 16px rgba(22,50,92,0.06)", borderRadius: 16, overflow: "hidden" }}>
            {results.map((item) => (
              <div key={item.id} onClick={() => actions.selectItem(item.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderBottom: "1px solid rgba(22,50,92,0.06)", cursor: "pointer" }}>
                <div style={{ position: "relative", width: 38, height: 38, flex: "none", borderRadius: 11, background: "#f6f1e4", padding: 6, boxSizing: "border-box" }}>
                  <PixelIcon icon={iconFor(item.icon)} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{item.name}</div>
                  <div style={{ fontSize: 11.5, color: "rgba(22,50,92,0.45)" }}>{item.sectionName}</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: freshColor(item.freshness) }}>{daysLabel(item.days)}</div>
              </div>
            ))}
          </div>
        )}
        {q.length > 0 && results.length === 0 && (
          <div style={{ textAlign: "center", color: "rgba(22,50,92,0.45)", fontSize: 13, marginTop: 30 }}>No items match &quot;{state.searchQuery}&quot;</div>
        )}
      </div>
    </div>
  );
}
