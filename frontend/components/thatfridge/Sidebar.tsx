"use client";

import type { ComponentType } from "react";
import { House, MessageCircle, Package, Plus, Refrigerator as FridgeIcon, Users } from "lucide-react";
import { useThatFridgeCtx } from "./ThatFridgeContext";

interface NavDef {
  key: "home" | "inventory" | "chat" | "activity";
  label: string;
  Icon: ComponentType<{ size?: number; strokeWidth?: number }>;
}

const NAV_ITEMS: NavDef[] = [
  { key: "home", label: "Home", Icon: House },
  { key: "inventory", label: "Inventory", Icon: Package },
  { key: "chat", label: "Chat", Icon: MessageCircle },
  { key: "activity", label: "Crew", Icon: Users },
];

// Wide-viewport (>=900px) sidebar navigation — the desktop counterpart to TabBar,
// which stays mobile-only. See globals.css for the breakpoint that swaps between them.
export default function Sidebar() {
  const { state, actions } = useThatFridgeCtx();

  const userInitials = (state.currentUser?.name || "Friend")
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside
      className="thatfridge-sidebar"
      style={{ flexDirection: "column", gap: 24, background: "#16325c", color: "#fff", padding: "22px 16px", height: "100%", boxSizing: "border-box" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 6px" }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
          <FridgeIcon size={17} color="#fff" strokeWidth={1.8} />
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.2 }}>ThatFridge</div>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_ITEMS.map((item) => {
          const active = item.key === "activity" ? state.screen === "foodHub" : state.screen === item.key;
          return (
            <div
              key={item.key}
              onClick={() => (item.key === "activity" ? actions.openRecipesHub() : actions.goTab(item.key))}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "10px 12px",
                borderRadius: 11,
                fontSize: 13.5,
                fontWeight: 600,
                color: active ? "#fff" : "rgba(255,255,255,0.68)",
                background: active ? "rgba(255,255,255,0.14)" : "transparent",
                cursor: "pointer",
              }}
            >
              <item.Icon size={17} strokeWidth={2} />
              {item.label}
            </div>
          );
        })}
      </nav>

      {state.fridges.length > 0 && (
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: "rgba(255,255,255,0.4)", padding: "0 12px", marginBottom: 6 }}>
            Your fridges
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div
              onClick={() => actions.selectFridgeScope("all")}
              style={{
                padding: "8px 12px",
                borderRadius: 11,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                color: state.kitchenScope === "all" ? "#fff" : "rgba(255,255,255,0.68)",
                background: state.kitchenScope === "all" ? "rgba(255,255,255,0.1)" : "transparent",
              }}
            >
              All Fridges
            </div>
            {state.fridges.map((f, i) => {
              const active = state.kitchenScope === "active" && state.activeFridge === i;
              return (
                <div
                  key={f.id}
                  onClick={() => actions.selectFridgeScope(i)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 11,
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    color: active ? "#fff" : "rgba(255,255,255,0.68)",
                    background: active ? "rgba(255,255,255,0.1)" : "transparent",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {f.name}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div
        onClick={actions.openAdd}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "11px 14px",
          borderRadius: 11,
          background: "#fff",
          color: "#16325c",
          fontWeight: 700,
          fontSize: 13.5,
          cursor: "pointer",
        }}
      >
        <Plus size={16} strokeWidth={2.4} />
        Add item
      </div>

      <div style={{ flex: 1 }} />

      <div
        onClick={actions.openProfile}
        style={{ display: "flex", alignItems: "center", gap: 10, padding: 8, borderRadius: 11, cursor: "pointer" }}
      >
        <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flex: "none" }}>
          {userInitials}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {state.currentUser?.name || "Friend"}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {state.currentUser?.email || ""}
          </div>
        </div>
      </div>
    </aside>
  );
}
