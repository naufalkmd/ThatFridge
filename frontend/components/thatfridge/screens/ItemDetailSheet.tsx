"use client";

import Image from "next/image";
import { findItem, iconFor } from "@/lib/thatfridge/selectors";
import { daysLabel, freshColor } from "@/lib/thatfridge/utils";
import { useThatFridgeCtx } from "../ThatFridgeContext";
import PixelIcon from "../PixelIcon";

export default function ItemDetailSheet() {
  const { state, actions } = useThatFridgeCtx();
  const found = state.selectedItemId ? findItem(state, state.selectedItemId) : null;
  if (!found) return null;
  const { item, section } = found;

  const tip =
    item.freshness < 30
      ? `Use ${item.name.toLowerCase()} today for best quality.`
      : item.freshness < 60
        ? `Plan to use ${item.name.toLowerCase()} within the next couple days.`
        : `${item.name} is holding up well — no action needed.`;

  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(22,50,92,0.32)" }}>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: "#fff", borderRadius: "28px 28px 0 0", padding: "14px 22px 34px", animation: "pop .22s ease-out" }}>
        <div onClick={actions.goHome} style={{ width: 36, height: 5, borderRadius: 3, background: "rgba(22,50,92,0.18)", margin: "0 auto 20px", cursor: "pointer" }} />
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
          <div style={{ width: 88, height: 88, background: "#eaf6ff", borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "relative", width: 52, height: 52 }}>
              <PixelIcon icon={iconFor(item.icon)} />
            </div>
          </div>
        </div>
        <div style={{ textAlign: "center", fontSize: 20, fontWeight: 700, marginBottom: 2 }}>{item.name}</div>
        <div style={{ textAlign: "center", fontSize: 12.5, color: "rgba(22,50,92,0.45)", marginBottom: 18 }}>{section.name}</div>

        <div style={{ background: "#eaf6ff", borderRadius: 16, padding: "14px 16px", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>
            <span>Freshness</span>
            <span style={{ color: freshColor(item.freshness) }}>{item.freshness}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: "rgba(22,50,92,0.08)", overflow: "hidden", marginBottom: 10 }}>
            <div style={{ height: "100%", borderRadius: 3, width: `${item.freshness}%`, background: freshColor(item.freshness) }} />
          </div>
          <div style={{ fontSize: 12.5, color: "rgba(22,50,92,0.6)" }}>
            {daysLabel(item.days)} · {item.note}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", background: "#eef2f7", borderRadius: 14, padding: "10px 14px", marginBottom: 20 }}>
          <Image src="/images/thatfridge/guardian-mascot.png" alt="" width={32} height={32} style={{ objectFit: "contain", flex: "none" }} />
          <div style={{ fontSize: 12.5, lineHeight: 1.45, color: "#16325c" }}>{tip}</div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <div onClick={actions.markUsed} style={{ flex: 1, textAlign: "center", padding: 13, borderRadius: 14, background: "#16325c", color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
            Mark as used
          </div>
          <div onClick={actions.discardItem} style={{ flex: 1, textAlign: "center", padding: 13, borderRadius: 14, background: "#fff", border: "1px solid rgba(22,50,92,0.14)", color: "#c1452e", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
            Discard
          </div>
        </div>
      </div>
    </div>
  );
}
