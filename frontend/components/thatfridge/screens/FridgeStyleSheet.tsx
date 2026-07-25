"use client";

import Image from "next/image";
import { FRIDGE_STYLES } from "@/lib/thatfridge/data";
import { iconFor } from "@/lib/thatfridge/selectors";
import { useThatFridgeCtx } from "../ThatFridgeContext";
import PixelIcon from "../PixelIcon";

export default function FridgeStyleSheet() {
  const { state, actions } = useThatFridgeCtx();
  const stylingFridge = state.fridges[state.stylingFridgeIndex];
  const currentStyle = stylingFridge?.style || "photo";

  const options: { key: string; label: string; isPhoto: boolean; iconData?: ReturnType<typeof iconFor>; bg?: string }[] = [
    { key: "photo", label: "Original photo", isPhoto: true },
    ...FRIDGE_STYLES.map((d) => ({ key: d.key, label: d.label, isPhoto: false, iconData: iconFor(d.icon), bg: d.bg })),
  ];

  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(22,50,92,0.32)" }}>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, top: 120, background: "#fff", borderRadius: "28px 28px 0 0", padding: "14px 22px 26px", animation: "pop .22s ease-out", display: "flex", flexDirection: "column" }}>
        <div onClick={actions.closeStylePicker} style={{ width: 36, height: 5, borderRadius: 3, background: "rgba(22,50,92,0.18)", margin: "0 auto 16px", cursor: "pointer", flex: "none" }} />
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 2 }}>Choose a look</div>
        <div style={{ fontSize: 12.5, color: "rgba(22,50,92,0.5)", marginBottom: 16 }}>{stylingFridge?.name}</div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
            {options.map((opt) => (
              <div
                key={opt.key}
                onClick={() => actions.selectFridgeStyle(opt.key as Parameters<typeof actions.selectFridgeStyle>[0])}
                style={{ cursor: "pointer", borderRadius: 16, padding: 8, background: "#f6f8fa", border: `2px solid ${opt.key === currentStyle ? "#16325c" : "transparent"}`, boxSizing: "border-box" }}
              >
                {opt.isPhoto ? (
                  <div style={{ width: "100%", height: 64, borderRadius: 10, overflow: "hidden", marginBottom: 8, position: "relative" }}>
                    <Image src="/images/thatfridge/fridge-hero.png" alt="" fill sizes="120px" style={{ objectFit: "cover" }} />
                  </div>
                ) : (
                  <div style={{ width: "100%", height: 64, borderRadius: 10, background: opt.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                    <div style={{ position: "relative", width: 36, height: 50 }}>
                      <PixelIcon icon={opt.iconData!} />
                    </div>
                  </div>
                )}
                <div style={{ fontSize: 11, fontWeight: 700, textAlign: "center", color: "#16325c" }}>{opt.label}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.3, color: "rgba(22,50,92,0.5)", marginBottom: 8 }}>OR UPLOAD YOUR OWN</div>
          <div onClick={() => actions.selectFridgeStyle("custom")} style={{ cursor: "pointer", borderRadius: 16, padding: 14, background: "#f6f8fa", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#eaf6ff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
              <div style={{ width: 18, height: 18, borderRadius: 5, background: "#4a6fa5" }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 2 }}>Photo from gallery</div>
              <div style={{ fontSize: 11.5, color: "rgba(22,50,92,0.5)" }}>Drop your own fridge photo</div>
            </div>
            <div style={{ color: "rgba(22,50,92,0.3)", fontSize: 16 }}>›</div>
          </div>
        </div>
      </div>
    </div>
  );
}
