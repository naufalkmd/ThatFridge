"use client";

import { useThatFridgeCtx } from "./ThatFridgeContext";

export default function UndoToast() {
  const { state, actions } = useThatFridgeCtx();
  if (!state.undoMessage) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        transform: "translateX(-50%)",
        bottom: 186,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 12px 12px 18px",
        background: "#16325c",
        color: "#fff",
        borderRadius: 16,
        boxShadow: "0 10px 28px rgba(22,50,92,0.3)",
        zIndex: 6,
        animation: "pop .2s ease-out",
        width: "calc(100% - 40px)",
      }}
    >
      <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {state.undoMessage}
      </div>
      <div
        onClick={actions.undoLastRemoval}
        style={{ fontSize: 13, fontWeight: 800, color: "#8fc3ff", cursor: "pointer", flex: "none", padding: "4px 6px" }}
      >
        Undo
      </div>
    </div>
  );
}
