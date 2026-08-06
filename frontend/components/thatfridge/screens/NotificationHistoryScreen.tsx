"use client";

import { useRef, useState } from "react";
import { Check, ChefHat, ChevronLeft, Hourglass, ShoppingCart, X } from "lucide-react";
import { timeAgo } from "@/lib/thatfridge/utils";
import { useThatFridgeCtx } from "../ThatFridgeContext";
import type { NotificationEvent, NotificationKind } from "@/lib/thatfridge/types";

const CLEAR_THRESHOLD = -80;

const KIND_META: Record<NotificationKind, { Icon: typeof Hourglass; color: string }> = {
  expiring: { Icon: Hourglass, color: "#c1452e" },
  lowStock: { Icon: ShoppingCart, color: "#3f8f5c" },
  recipe: { Icon: ChefHat, color: "#d99a2b" },
};

function NotificationRow({ event, onDismiss }: { event: NotificationEvent; onDismiss: (id: string) => void }) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const meta = KIND_META[event.kind];

  const onPointerDown = (e: React.PointerEvent) => {
    if (event.done) return;
    startX.current = e.clientX;
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setDragX(Math.min(0, e.clientX - startX.current));
  };
  const endDrag = () => {
    if (!dragging) return;
    setDragging(false);
    if (dragX < CLEAR_THRESHOLD) onDismiss(event.id);
    setDragX(0);
  };

  return (
    <div style={{ position: "relative", borderRadius: 16, marginBottom: 10, overflow: "hidden" }}>
      {dragX < 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#c1452e",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            padding: "0 22px",
            color: "#fff",
            fontSize: 12.5,
            fontWeight: 700,
          }}
        >
          Clear
        </div>
      )}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        style={{
          position: "relative",
          transform: `translateX(${dragX}px)`,
          transition: dragging ? "none" : "transform .2s ease",
          background: event.done ? "#eef1f4" : "#fff",
          borderRadius: 16,
          padding: "13px 14px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          boxShadow: "0 6px 16px rgba(22,50,92,0.06)",
          touchAction: "pan-y",
          userSelect: "none",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: event.done ? "rgba(22,50,92,0.08)" : `${meta.color}1a`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: "none",
          }}
        >
          <meta.Icon size={17} color={event.done ? "rgba(22,50,92,0.35)" : meta.color} strokeWidth={2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: event.done ? "rgba(22,50,92,0.4)" : "#16325c",
              textDecoration: event.done ? "line-through" : "none",
              marginBottom: 2,
            }}
          >
            {event.message}
          </div>
          <div style={{ fontSize: 11, color: "rgba(22,50,92,0.4)" }}>
            {event.fridgeName} · {timeAgo(event.createdAt)}
          </div>
        </div>
        {event.done ? (
          <Check size={17} color="#3f8f5c" strokeWidth={2.5} style={{ flex: "none" }} />
        ) : (
          <div
            onClick={() => onDismiss(event.id)}
            style={{ fontSize: 11.5, fontWeight: 700, color: "#2f6fb0", cursor: "pointer", padding: "6px 4px", flex: "none" }}
          >
            Clear
          </div>
        )}
      </div>
    </div>
  );
}

export default function NotificationHistoryScreen() {
  const { state, actions } = useThatFridgeCtx();
  const events = state.notificationEvents;

  return (
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#eaf6ff,#cfe8fb 55%,#eaf6ff)", display: "flex", flexDirection: "column" }}>
      <div className="thatfridge-wide-content" style={{ flex: "none", padding: "28px 20px 14px", display: "flex", alignItems: "center", gap: 12, boxSizing: "border-box" }}>
        <div
          onClick={actions.goHome}
          style={{ width: 32, height: 32, borderRadius: 16, background: "#fff", border: "1px solid rgba(22,50,92,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flex: "none" }}
        >
          <X className="thatfridge-hide-desktop" size={15} color="rgba(22,50,92,0.5)" strokeWidth={2} />
          <ChevronLeft className="thatfridge-show-desktop" size={17} color="rgba(22,50,92,0.5)" strokeWidth={2.2} />
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>Notifications</div>
          <div style={{ fontSize: 11.5, color: "rgba(22,50,92,0.5)" }}>Swipe left or tap Clear to mark as done</div>
        </div>
      </div>

      <div className="thatfridge-wide-content" style={{ flex: 1, overflowY: "auto", padding: "6px 20px 100px", boxSizing: "border-box" }}>
        {events.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(22,50,92,0.45)", fontSize: 13 }}>
            You&apos;re all caught up — no notifications yet.
          </div>
        ) : (
          events.map((event) => <NotificationRow key={event.id} event={event} onDismiss={actions.dismissNotificationWithUndo} />)
        )}
      </div>
    </div>
  );
}
