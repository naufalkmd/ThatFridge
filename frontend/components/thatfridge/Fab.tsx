"use client";

import { useThatFridgeCtx } from "./ThatFridgeContext";

export default function Fab() {
  const { state, actions } = useThatFridgeCtx();
  if (state.screen !== "home") return null;

  return (
    <div
      onClick={actions.openAdd}
      style={{
        position: "absolute",
        right: 20,
        bottom: 118,
        width: 54,
        height: 54,
        borderRadius: 27,
        background: "#16325c",
        boxShadow: "0 10px 22px rgba(22,50,92,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        zIndex: 5,
      }}
    >
      <div style={{ position: "relative", width: 20, height: 20 }}>
        <div style={{ position: "absolute", top: 9, left: 0, width: 20, height: 2.4, background: "#fff", borderRadius: 2 }} />
        <div style={{ position: "absolute", left: 9, top: 0, width: 2.4, height: 20, background: "#fff", borderRadius: 2 }} />
      </div>
    </div>
  );
}
