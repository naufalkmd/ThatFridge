"use client";

import Image from "next/image";
import { getAllItems, iconFor } from "@/lib/thatfridge/selectors";
import { useThatFridgeCtx } from "../ThatFridgeContext";
import PixelIcon from "../PixelIcon";
import type { StorageLocation } from "@/lib/thatfridge/types";

const LOCATIONS: { key: StorageLocation; label: string; short: string; blurb: string; color: string }[] = [
  { key: "fridge", label: "Fridge", short: "Fr", blurb: "Everyday chilled items", color: "#2f6fb0" },
  { key: "freezer", label: "Freezer", short: "Fz", blurb: "Long-term frozen items", color: "#3f5c85" },
  { key: "pantry", label: "Pantry", short: "Pa", blurb: "Shelf-stable, room temp", color: "#b5702f" },
];

export default function OrganizerScreen() {
  const { state, actions } = useThatFridgeCtx();
  const items = getAllItems(state);

  return (
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#eaf6ff,#cfe8fb 55%,#eaf6ff)", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: "none", padding: "28px 20px 14px", display: "flex", alignItems: "center", gap: 12 }}>
        <div
          onClick={actions.goHome}
          style={{ width: 32, height: 32, borderRadius: 16, background: "#fff", border: "1px solid rgba(22,50,92,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 15, color: "rgba(22,50,92,0.5)", flex: "none" }}
        >
          ✕
        </div>
        <div style={{ position: "relative", width: 34, height: 34, flex: "none" }}>
          <Image src="/images/thatfridge/organizer-agent.png" alt="" width={34} height={34} style={{ objectFit: "contain" }} />
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>Organizer</div>
          <div style={{ fontSize: 11.5, color: "rgba(22,50,92,0.5)" }}>Tap a spot to move an item there</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "6px 20px 100px" }}>
        {items.length === 0 && (
          <div style={{ textAlign: "center", color: "rgba(22,50,92,0.45)", fontSize: 13, marginTop: 40 }}>
            Nothing to organize yet — add items to sort them into place.
          </div>
        )}
        {LOCATIONS.map((loc) => {
          const locItems = items.filter((i) => (i.location || "fridge") === loc.key);
          return (
            <div key={loc.key} style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.3, color: loc.color }}>
                  {loc.label.toUpperCase()} ({locItems.length})
                </div>
                <div style={{ fontSize: 11, color: "rgba(22,50,92,0.4)" }}>{loc.blurb}</div>
              </div>
              <div style={{ background: "#fff", boxShadow: "0 6px 16px rgba(22,50,92,0.06)", borderRadius: 16, overflow: "hidden" }}>
                {locItems.length === 0 && (
                  <div style={{ padding: "14px", fontSize: 12.5, color: "rgba(22,50,92,0.35)", textAlign: "center" }}>Nothing here yet</div>
                )}
                {locItems.map((item) => {
                  const current = item.location || "fridge";
                  return (
                    <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderBottom: "1px solid rgba(22,50,92,0.06)" }}>
                      <div style={{ position: "relative", width: 26, height: 26, flex: "none" }}>
                        <PixelIcon icon={iconFor(item.icon)} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 600 }}>{item.name}</div>
                      <div style={{ display: "flex", gap: 4, flex: "none" }}>
                        {LOCATIONS.map((opt) => {
                          const active = opt.key === current;
                          return (
                            <div
                              key={opt.key}
                              onClick={() => actions.setItemLocation(item.id, opt.key)}
                              title={opt.label}
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: 8,
                                background: active ? opt.color : "rgba(22,50,92,0.06)",
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
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
