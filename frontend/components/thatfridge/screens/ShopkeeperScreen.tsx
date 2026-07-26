"use client";

import Image from "next/image";
import { getBuyAgainSuggestions, iconFor } from "@/lib/thatfridge/selectors";
import { useThatFridgeCtx } from "../ThatFridgeContext";
import PixelIcon from "../PixelIcon";
import ShoppingListPanel from "../ShoppingListPanel";

export default function ShopkeeperScreen() {
  const { state, actions } = useThatFridgeCtx();
  const suggestions = getBuyAgainSuggestions(state);

  return (
    <div style={{ position: "absolute", inset: 0, background: "#eaf6ff", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          flex: "none",
          position: "relative",
          padding: "26px 20px 18px",
          background:
            "repeating-linear-gradient(135deg, #c1452e 0 22px, #d9c9a3 22px 44px)",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(22,50,92,0.15), rgba(22,50,92,0.55))" }} />
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12 }}>
          <div
            onClick={actions.goHome}
            style={{ width: 32, height: 32, borderRadius: 16, background: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 15, color: "#16325c", flex: "none" }}
          >
            ✕
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", textShadow: "0 2px 6px rgba(0,0,0,0.35)" }}>Shopkeeper&apos;s corner</div>
        </div>
        <div style={{ position: "relative", display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 14 }}>
          <div style={{ fontSize: 12.5, color: "#fff", maxWidth: 220, lineHeight: 1.4, textShadow: "0 1px 4px rgba(0,0,0,0.35)" }}>
            Your grocery list and what to pick up again, all in one aisle.
          </div>
          <div style={{ position: "relative", width: 72, height: 72, flex: "none" }}>
            <Image src="/images/thatfridge/shopkeeper-agent.png" alt="Shopkeeper" width={72} height={72} style={{ objectFit: "contain" }} />
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px 100px" }}>
        {suggestions.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.3, color: "rgba(22,50,92,0.5)", marginBottom: 8 }}>BUY AGAIN?</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {suggestions.map((s) => (
                <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", boxShadow: "0 6px 16px rgba(22,50,92,0.06)", borderRadius: 14, padding: "10px 14px" }}>
                  <div style={{ position: "relative", width: 26, height: 26, flex: "none" }}>
                    <PixelIcon icon={iconFor(s.icon)} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: "rgba(22,50,92,0.45)" }}>Used {s.count}× before</div>
                  </div>
                  <div
                    onClick={() => actions.addPredictedToShopping(s.name, s.icon)}
                    style={{ width: 30, height: 30, borderRadius: 10, background: "#16325c", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, flex: "none" }}
                  >
                    +
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.3, color: "rgba(22,50,92,0.5)", marginBottom: 8 }}>SHOPPING LIST</div>
        <ShoppingListPanel />
      </div>
    </div>
  );
}
