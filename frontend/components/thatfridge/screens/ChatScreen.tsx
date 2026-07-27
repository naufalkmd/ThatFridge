"use client";

import { useEffect } from "react";
import { useThatFridgeCtx } from "../ThatFridgeContext";

const QUICK_ASKS = ["What's expiring soon?", "What can I cook tonight?", "What do I need to buy?", "How's my fridge doing?"];

export default function ChatScreen() {
  const { state, actions, chatScrollRef } = useThatFridgeCtx();

  useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [state.chatMessages, state.isTyping, chatScrollRef]);

  const showQuickAsks = state.chatMessages.length <= 3;

  return (
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#eaf6ff,#cfe8fb 55%,#eaf6ff)", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: "none", padding: "28px 20px 14px", display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.55)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(22,50,92,0.06)" }}>
        <div onClick={actions.goHome} style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", color: "#16325c", fontSize: 20, fontWeight: 600, cursor: "pointer", flex: "none" }}>
          ‹
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15.5, fontWeight: 800 }}>Quick Chat</div>
          <div style={{ fontSize: 11.5, color: "rgba(22,50,92,0.5)" }}>Quick answers about your fridge</div>
        </div>
        <div onClick={actions.clearChat} style={{ fontSize: 11.5, fontWeight: 700, color: "#2f6fb0", cursor: "pointer", padding: "6px 4px" }}>
          Clear
        </div>
      </div>

      <div ref={chatScrollRef} style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px", display: "flex", flexDirection: "column", gap: 12 }}>
        {state.chatMessages.map((m) => (
          <div key={m.id} style={{ display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start", animation: "pop .18s ease-out" }}>
            {m.from === "bot" ? (
              <div style={{ maxWidth: "82%", background: "#fff", boxShadow: "0 6px 16px rgba(22,50,92,0.08)", borderRadius: "4px 16px 16px 16px", padding: "11px 14px", fontSize: 13.5, lineHeight: 1.5 }}>
                {m.text}
              </div>
            ) : (
              <div style={{ maxWidth: "78%", background: "#16325c", color: "#fff", borderRadius: "16px 4px 16px 16px", padding: "11px 14px", fontSize: 13.5, lineHeight: 1.5 }}>{m.text}</div>
            )}
          </div>
        ))}

        {state.isTyping && (
          <div style={{ maxWidth: "82%", background: "#fff", boxShadow: "0 6px 16px rgba(22,50,92,0.08)", borderRadius: "4px 16px 16px 16px", padding: "13px 16px", display: "flex", gap: 4, alignItems: "center" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(22,50,92,0.35)", animation: "bounce 1.1s ease-in-out infinite" }} />
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(22,50,92,0.35)", animation: "bounce 1.1s ease-in-out infinite .15s" }} />
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(22,50,92,0.35)", animation: "bounce 1.1s ease-in-out infinite .3s" }} />
          </div>
        )}
      </div>

      {showQuickAsks && (
        <div style={{ flex: "none", padding: "0 16px 10px", display: "flex", gap: 8, overflowX: "auto" }}>
          {QUICK_ASKS.map((label) => (
            <div
              key={label}
              onClick={() => actions.askQuick(label)}
              style={{ flex: "none", whiteSpace: "nowrap", background: "#fff", border: "1px solid rgba(22,50,92,0.1)", boxShadow: "0 4px 10px rgba(22,50,92,0.05)", borderRadius: 14, padding: "8px 13px", fontSize: 12, fontWeight: 600, color: "#16325c", cursor: "pointer" }}
            >
              {label}
            </div>
          ))}
        </div>
      )}

      <div style={{ flex: "none", padding: "8px 14px 24px", background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(22,50,92,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
        <input
          value={state.chatDraft}
          onChange={(e) => actions.onDraftChange(e.target.value)}
          onKeyDown={(e) => actions.onChatKeyDown(e.key)}
          placeholder="Ask about your fridge…"
          style={{ flex: 1, border: "none", outline: "none", background: "#eef4fa", borderRadius: 20, padding: "11px 16px", fontSize: 13.5, color: "#16325c" }}
        />
        <div onClick={actions.sendMessage} style={{ width: 38, height: 38, borderRadius: 19, background: "#16325c", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flex: "none", color: "#fff", fontSize: 15 }}>
          ↑
        </div>
      </div>
    </div>
  );
}
