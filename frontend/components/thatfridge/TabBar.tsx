"use client";

import { useThatFridgeCtx } from "./ThatFridgeContext";

const TAB_DEFS = [
  { key: "home" as const, label: "Home" },
  { key: "chat" as const, label: "Chat" },
  { key: "activity" as const, label: "Kitchen" },
];

export default function TabBar() {
  const { state, actions } = useThatFridgeCtx();
  const showTabBar = state.screen === "home" || state.screen === "foodHub" || state.screen === "chat";
  if (!showTabBar) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        transform: "translateX(-50%)",
        bottom: 22,
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: 6,
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(16px)",
        borderRadius: 26,
        boxShadow: "0 10px 28px rgba(22,50,92,0.16)",
        zIndex: 4,
      }}
    >
      {TAB_DEFS.map((tab) => {
        const active = tab.key === "activity" ? state.screen === "foodHub" : state.screen === tab.key;
        const color = active ? "#16325c" : "rgba(22,50,92,0.4)";
        const pillBg = active ? "#eaf6ff" : "transparent";
        return (
          <div
            key={tab.key}
            onClick={() => (tab.key === "activity" ? actions.openRecipesHub() : actions.goTab(tab.key))}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              padding: "9px 16px",
              borderRadius: 20,
              background: pillBg,
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
            <div style={{ fontSize: 12, fontWeight: 700, color }}>{tab.label}</div>
          </div>
        );
      })}
    </div>
  );
}
