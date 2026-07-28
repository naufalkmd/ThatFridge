"use client";

import type { ComponentType } from "react";
import { House, MessageCircle, Package, Plus, Users } from "lucide-react";
import { useThatFridgeCtx } from "./ThatFridgeContext";

interface TabDef {
  key: "home" | "inventory" | "chat" | "activity";
  label: string;
  Icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
}

const LEFT_TABS: TabDef[] = [
  { key: "home", label: "Home", Icon: House },
  { key: "inventory", label: "Inventory", Icon: Package },
];

const RIGHT_TABS: TabDef[] = [
  { key: "chat", label: "Chat", Icon: MessageCircle },
  { key: "activity", label: "Crew", Icon: Users },
];

export default function TabBar() {
  const { state, actions } = useThatFridgeCtx();
  const showTabBar = state.screen === "home" || state.screen === "inventory" || state.screen === "foodHub" || state.screen === "chat";
  if (!showTabBar) return null;

  const renderTab = (tab: TabDef) => {
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
        <tab.Icon size={16} color={color} strokeWidth={2.2} />
        <div style={{ fontSize: 12, fontWeight: 700, color }}>{tab.label}</div>
      </div>
    );
  };

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
      {LEFT_TABS.map(renderTab)}
      <div style={{ width: 58, flex: "none" }} />
      {RIGHT_TABS.map(renderTab)}

      <div
        onClick={actions.openAdd}
        style={{
          position: "absolute",
          left: "50%",
          top: -22,
          transform: "translateX(-50%)",
          width: 58,
          height: 58,
          borderRadius: 29,
          background: "#16325c",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 10px 22px rgba(22,50,92,0.35)",
          border: "4px solid rgba(255,255,255,0.85)",
        }}
      >
        <Plus size={24} color="#fff" strokeWidth={2.4} />
      </div>
    </div>
  );
}
