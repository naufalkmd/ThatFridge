"use client";

import { Camera, Check, ChevronRight, Keyboard, Minus, Plus, Receipt, Refrigerator, ScanBarcode, Sparkles, X } from "lucide-react";
import { FOOD_ICON_KEYS, STORAGE_LOCATIONS } from "@/lib/thatfridge/data";
import { useThatFridgeCtx } from "../ThatFridgeContext";
import FoodIcon from "../FoodIcon";
import type { ScanMethod, StorageLocation } from "@/lib/thatfridge/types";

const SCAN_METHODS: { key: ScanMethod; title: string; desc: string; Icon: typeof Receipt }[] = [
  { key: "receipt", title: "Scan receipt", desc: "Snap your grocery receipt", Icon: Receipt },
  { key: "barcode", title: "Scan barcode", desc: "Point at a product barcode", Icon: ScanBarcode },
  { key: "photo", title: "Photo of fridge", desc: "Let AI spot what changed", Icon: Camera },
  { key: "manual", title: "Add manually", desc: "Type in the item yourself", Icon: Keyboard },
];

const fieldStyle: React.CSSProperties = {
  width: "100%",
  border: "none",
  outline: "none",
  background: "#fff",
  boxShadow: "0 6px 16px rgba(22,50,92,0.06)",
  borderRadius: 14,
  padding: "12px 14px",
  fontSize: 13.5,
  color: "#16325c",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: 0.3,
  color: "rgba(22,50,92,0.5)",
  marginBottom: 6,
};

const AGENT_SUGGEST_META = {
  guardian: { label: "Guardian", color: "#c1452e" },
  organizer: { label: "Organizer", color: "#2f6fb0" },
} as const;

function AgentSuggestButton({ agent, onClick }: { agent: keyof typeof AGENT_SUGGEST_META; onClick: () => void }) {
  const meta = AGENT_SUGGEST_META[agent];
  return (
    <div
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 10px", borderRadius: 10, background: `${meta.color}1a`, color: meta.color, fontSize: 11.5, fontWeight: 700, cursor: "pointer", flex: "none" }}
    >
      <Sparkles size={13} strokeWidth={2.2} />
      {meta.label}
    </div>
  );
}

function LocationPicker({ value, onChange }: { value: StorageLocation; onChange: (loc: StorageLocation) => void }) {
  return (
    <div style={{ display: "flex", gap: 4, flex: "none" }}>
      {STORAGE_LOCATIONS.map((opt) => {
        const active = opt.key === value;
        return (
          <div
            key={opt.key}
            onClick={() => onChange(opt.key)}
            title={opt.label}
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              background: active ? opt.color : "#eaf6ff",
              color: active ? "#fff" : "rgba(22,50,92,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 9.5,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            {opt.short}
          </div>
        );
      })}
    </div>
  );
}

export default function AddScreen() {
  const { state, actions } = useThatFridgeCtx();
  const scanningLabel =
    state.scanMethod === "barcode" ? "Reading barcode…" : state.scanMethod === "receipt" ? "Reading receipt…" : "Scanning fridge photo…";
  const checkedCount = state.detected.filter((d) => d.checked).length;
  const targetFridge = state.fridges[state.addFridgeIndex];
  const sections = targetFridge?.sections || [];

  return (
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#eaf6ff,#cfe8fb)", padding: "28px 20px 30px", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div style={{ fontSize: 20, fontWeight: 800 }}>{state.addStep === -1 ? "Add to fridge" : `Add to ${targetFridge?.name || "fridge"}`}</div>
        <div onClick={actions.goHome} style={{ width: 32, height: 32, borderRadius: 16, background: "#fff", border: "1px solid rgba(22,50,92,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <X size={15} color="rgba(22,50,92,0.5)" strokeWidth={2} />
        </div>
      </div>

      {state.addStep === -1 && (
        <>
          <div style={{ fontSize: 13, color: "rgba(22,50,92,0.55)", marginBottom: 16 }}>Which fridge are you adding to?</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {state.fridges.map((f, i) => {
              const itemCount = f.sections.reduce((n, sec) => n + sec.items.length, 0);
              return (
                <div key={f.id} onClick={() => actions.selectAddFridge(i)} style={{ display: "flex", alignItems: "center", gap: 14, background: "#fff", boxShadow: "0 6px 16px rgba(22,50,92,0.06)", borderRadius: 16, padding: 16, cursor: "pointer" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "#eaf6ff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                    <Refrigerator size={19} color="#4a6fa5" strokeWidth={2} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 2 }}>{f.name}</div>
                    <div style={{ fontSize: 12, color: "rgba(22,50,92,0.5)" }}>{itemCount} item{itemCount === 1 ? "" : "s"}</div>
                  </div>
                  <ChevronRight size={17} color="rgba(22,50,92,0.3)" />
                </div>
              );
            })}
          </div>
        </>
      )}

      {state.addStep === 0 && (
        <>
          <div style={{ fontSize: 13, color: "rgba(22,50,92,0.55)", marginBottom: 16 }}>Choose how you&apos;d like to add items</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {SCAN_METHODS.map((m) => (
              <div key={m.key} onClick={() => actions.chooseMethod(m.key)} style={{ display: "flex", alignItems: "center", gap: 14, background: "#fff", boxShadow: "0 6px 16px rgba(22,50,92,0.06)", borderRadius: 16, padding: 16, cursor: "pointer" }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "#eaf6ff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                  <m.Icon size={19} color="#4a6fa5" strokeWidth={2} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 2 }}>{m.title}</div>
                  <div style={{ fontSize: 12, color: "rgba(22,50,92,0.5)" }}>{m.desc}</div>
                </div>
                <ChevronRight size={17} color="rgba(22,50,92,0.3)" />
              </div>
            ))}
          </div>
        </>
      )}

      {state.addStep === 1 && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
          <div style={{ position: "relative", width: 160, height: 160, borderRadius: 24, background: "#eaf6ff", overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: "#4a6fa5", animation: "scanline 1.1s linear infinite" }} />
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: "rgba(22,50,92,0.6)" }}>{scanningLabel}</div>
        </div>
      )}

      {state.addStep === 2 && (
        <>
          <div style={{ fontSize: 13, color: "rgba(22,50,92,0.55)", marginBottom: 14 }}>
            Found {state.detected.length} items — the scan can&apos;t tell expiry dates, so set one below or let Guardian estimate it
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, overflowY: "auto" }}>
            {state.detected.map((d) => (
              <div key={d.id} style={{ background: "#fff", boxShadow: "0 6px 16px rgba(22,50,92,0.06)", borderRadius: 14, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                <div onClick={() => actions.toggleDetected(d.id)} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                  <div style={{ position: "relative", width: 28, height: 28, flex: "none" }}>
                    <FoodIcon icon={d.icon} />
                  </div>
                  <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{d.name}</div>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 7,
                      border: `1.5px solid ${d.checked ? "#2f6fb0" : "rgba(22,50,92,0.25)"}`,
                      background: d.checked ? "#2f6fb0" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: "none",
                    }}
                  >
                    {d.checked && <Check size={13} color="#fff" strokeWidth={2.5} />}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <select
                    value={d.section}
                    onChange={(e) => actions.onDetectedSectionChange(d.id, e.target.value)}
                    style={{ flex: 1, border: "none", outline: "none", background: "#eaf6ff", borderRadius: 10, padding: "8px 10px", fontSize: 12.5, color: "#16325c", appearance: "none" }}
                  >
                    {sections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.name}
                      </option>
                    ))}
                  </select>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#eaf6ff", borderRadius: 10, padding: "0 8px", flex: "none" }}>
                    <div onClick={() => actions.adjustDetectedQty(d.id, -1)} style={{ cursor: "pointer", padding: 4, display: "flex" }}>
                      <Minus size={12} color="#16325c" strokeWidth={2.4} />
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "#16325c", minWidth: 14, textAlign: "center" }}>{d.qty}</div>
                    <div onClick={() => actions.adjustDetectedQty(d.id, 1)} style={{ cursor: "pointer", padding: 4, display: "flex" }}>
                      <Plus size={12} color="#16325c" strokeWidth={2.4} />
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="date"
                    value={d.expiryDate}
                    onChange={(e) => actions.onDetectedExpiryChange(d.id, e.target.value)}
                    style={{ flex: 1, border: "none", outline: "none", background: "#eaf6ff", borderRadius: 10, padding: "8px 10px", fontSize: 12.5, color: "#16325c" }}
                  />
                  <AgentSuggestButton agent="guardian" onClick={() => actions.suggestDetectedExpiry(d.id)} />
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <LocationPicker value={d.location} onChange={(loc) => actions.onDetectedLocationChange(d.id, loc)} />
                  <div style={{ flex: 1 }} />
                  <AgentSuggestButton agent="organizer" onClick={() => actions.suggestDetectedLocation(d.id)} />
                </div>
              </div>
            ))}
          </div>
          <div onClick={actions.confirmAdd} style={{ textAlign: "center", padding: 14, borderRadius: 14, background: "#16325c", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 14 }}>
            Add {checkedCount} items
          </div>
        </>
      )}

      {state.addStep === 3 && (
        <>
          <div style={{ fontSize: 13, color: "rgba(22,50,92,0.55)", marginBottom: 16 }}>Fill in the details for this item</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1, overflowY: "auto" }}>
            <div>
              <div style={labelStyle}>NAME</div>
              <input
                autoFocus
                value={state.manualName}
                onChange={(e) => actions.onManualNameChange(e.target.value)}
                placeholder="e.g. Sourdough bread"
                style={fieldStyle}
              />
            </div>
            <div>
              <div style={labelStyle}>PICTURE</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {FOOD_ICON_KEYS.map((key) => (
                  <div
                    key={key}
                    onClick={() => actions.onManualIconChange(key)}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      background: "#eaf6ff",
                      border: `2px solid ${state.manualIcon === key ? "#2f6fb0" : "transparent"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ position: "relative", width: 26, height: 26 }}>
                      <FoodIcon icon={key} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={labelStyle}>STORE IN</div>
              <select
                value={state.manualSectionId}
                onChange={(e) => actions.onManualSectionChange(e.target.value)}
                style={{ ...fieldStyle, appearance: "none" }}
              >
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div style={labelStyle}>STORE WHERE</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <LocationPicker value={state.manualLocation} onChange={actions.onManualLocationChange} />
                <div style={{ flex: 1 }} />
                <AgentSuggestButton agent="organizer" onClick={actions.suggestManualLocation} />
              </div>
            </div>
            <div>
              <div style={labelStyle}>BEST BEFORE</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="date"
                  value={state.manualExpiryDate}
                  onChange={(e) => actions.onManualExpiryDateChange(e.target.value)}
                  style={{ ...fieldStyle, flex: 1 }}
                />
                <AgentSuggestButton agent="guardian" onClick={actions.suggestManualExpiry} />
              </div>
            </div>
            <div>
              <div style={labelStyle}>NOTE (OPTIONAL)</div>
              <input
                value={state.manualNote}
                onChange={(e) => actions.onManualNoteChange(e.target.value)}
                placeholder="e.g. 2 loaves"
                style={fieldStyle}
              />
            </div>
          </div>
          <div
            onClick={actions.confirmManualAdd}
            style={{
              textAlign: "center",
              padding: 14,
              borderRadius: 14,
              background: state.manualName.trim() ? "#16325c" : "rgba(22,50,92,0.25)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              marginTop: 14,
            }}
          >
            Add item
          </div>
        </>
      )}
    </div>
  );
}
