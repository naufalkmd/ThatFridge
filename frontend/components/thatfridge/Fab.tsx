"use client";

import { Plus } from "lucide-react";
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
      <Plus size={22} color="#fff" strokeWidth={2.4} />
    </div>
  );
}
