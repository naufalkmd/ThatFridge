"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Bell, ChevronDown, Package, Palette, Refrigerator, Sparkles, TriangleAlert, X } from "lucide-react";
import { RECIPE_BY_ICON } from "@/lib/thatfridge/data";
import { getExpiringOwnedItems, getFridgeHeroViews, getGuardianItem, getLowStockItem, getRecipesView, getScopeLabel, getScopedItems } from "@/lib/thatfridge/selectors";
import { daysLabel, freshColor } from "@/lib/thatfridge/utils";
import { useThatFridgeCtx } from "../ThatFridgeContext";
import CrewScene from "../CrewScene";
import FoodIcon from "../FoodIcon";

const CLEAR_THRESHOLD = -80;
const OFFSCREEN_X = -420;

function SwipeToClear({ marginBottom, onClear, children }: { marginBottom: number; onClear: () => void; children: React.ReactNode }) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const movedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const pendingDeltaRef = useRef(0);

  const flushDrag = () => {
    rafRef.current = null;
    setDragX(pendingDeltaRef.current);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    draggingRef.current = true;
    movedRef.current = false;
    startXRef.current = e.clientX;
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const delta = e.clientX - startXRef.current;
    if (Math.abs(delta) > 4 && !movedRef.current) {
      movedRef.current = true;
      // Capture only once a real drag starts, so a plain tap's click event is never suppressed.
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    pendingDeltaRef.current = Math.min(0, delta);
    if (rafRef.current == null) rafRef.current = requestAnimationFrame(flushDrag);
  };
  const onPointerUp = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (pendingDeltaRef.current < CLEAR_THRESHOLD) {
      setDragX(OFFSCREEN_X);
      setTimeout(onClear, 200);
    } else {
      setDragX(0);
    }
  };
  const onClickCapture = (e: React.MouseEvent) => {
    if (movedRef.current) {
      e.stopPropagation();
      e.preventDefault();
      movedRef.current = false;
    }
  };

  return (
    <div style={{ position: "relative", marginBottom, borderRadius: 18, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "#c1452e", display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 22px" }}>
        <X size={17} color="#fff" strokeWidth={2.4} />
      </div>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={onClickCapture}
        style={{ transform: `translateX(${dragX}px)`, transition: dragging ? "none" : "transform 0.2s ease", touchAction: "pan-y", willChange: "transform" }}
      >
        {children}
      </div>
    </div>
  );
}

export default function HomeScreen() {
  const { state, actions } = useThatFridgeCtx();
  const [showScopeMenu, setShowScopeMenu] = useState(false);
  const [dismissedGuardianFor, setDismissedGuardianFor] = useState<string | null>(null);
  const [dismissedLowStockFor, setDismissedLowStockFor] = useState<string | null>(null);
  const [dismissedChefFor, setDismissedChefFor] = useState<string | null>(null);
  const fridgesView = getFridgeHeroViews(state);
  const heroSlide = state.heroSlide;
  const heroSlideCount = fridgesView.length + 1;
  const heroSlideWidthPct = 100 / heroSlideCount;
  const heroTrackWidth = `${heroSlideCount * 100}%`;
  const heroTranslate = `translateX(-${heroSlide * heroSlideWidthPct}%)`;

  const guardianItem = getGuardianItem(state);
  const lowStockItem = getLowStockItem(state);
  const scopedItems = getScopedItems(state);

  const totalItemCount = scopedItems.length;
  const expiringCount = scopedItems.filter((i) => i.freshness < 50).length;
  const suggestionCount = getRecipesView(state).filter((r) => r.haveCount > 0).length;

  const chefMessage = guardianItem
    ? `Try "${RECIPE_BY_ICON[guardianItem.icon] || "a quick stir-fry"}" tonight using your ${guardianItem.name.toLowerCase()}.`
    : "Your kitchen looks well stocked tonight.";

  const guardianMessage = guardianItem
    ? guardianItem.freshness < 30
      ? `${guardianItem.name} needs attention today — down to ${guardianItem.freshness}% freshness.`
      : `Use ${guardianItem.name.toLowerCase()} within ${guardianItem.days} day${guardianItem.days === 1 ? "" : "s"} for best quality.`
    : "";

  // These ids mirror buildNotificationSeed()'s per-fridge event ids, so clearing a Home
  // card also marks the matching entry in the Notifications page as done, and clearing it
  // there (event.done becomes true) also hides the Home card — kept in sync both ways.
  const guardianEventId = guardianItem ? `ev-expiring-${guardianItem.fridgeId}` : null;
  const lowStockEventId = lowStockItem ? `ev-lowstock-${lowStockItem.fridgeId}` : null;
  const chefEventId = guardianItem ? `ev-recipe-${guardianItem.fridgeId}` : null;
  const isEventDone = (id: string | null) => !!id && state.notificationEvents.find((n) => n.id === id)?.done;

  const chefKey = guardianItem?.id ?? "none";
  const guardianVisible = !!guardianItem && dismissedGuardianFor !== guardianItem.id && !isEventDone(guardianEventId);
  const lowStockVisible = !!lowStockItem && dismissedLowStockFor !== lowStockItem.id && !isEventDone(lowStockEventId);
  const chefVisible = dismissedChefFor !== chefKey && !isEventDone(chefEventId);

  const dotCount = heroSlideCount;
  const pendingNotifications = state.notificationEvents.filter((n) => !n.done).length;
  const expiringItems = getExpiringOwnedItems(state, 6);

  const userInitials = (state.currentUser?.name || "Friend")
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
    <div className="thatfridge-home-mobile" style={{ position: "absolute", inset: 0, overflowY: "auto", padding: "28px 20px 180px" }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div
          onClick={actions.openProfile}
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            background: "#16325c",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 13,
            fontWeight: 800,
            cursor: "pointer",
            flex: "none",
          }}
        >
          {userInitials}
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.3 }}>ThatFridge</div>
        <div
          onClick={actions.openNotificationHistory}
          style={{
            position: "relative",
            width: 34,
            height: 34,
            borderRadius: 17,
            background: "rgba(255,255,255,0.75)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(22,50,92,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flex: "none",
          }}
        >
          <Bell size={16} color="#16325c" strokeWidth={2} />
          {pendingNotifications > 0 && (
            <div
              style={{
                position: "absolute",
                top: 3,
                right: 4,
                width: 8,
                height: 8,
                borderRadius: 4,
                background: "#c1452e",
                border: "1.5px solid #fff",
              }}
            />
          )}
        </div>
      </div>

      {/* fridge scope picker */}
      <div style={{ position: "relative", marginBottom: 14, width: "fit-content" }}>
        <div
          onClick={() => setShowScopeMenu((v) => !v)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 12px",
            borderRadius: 12,
            background: "#fff",
            boxShadow: "0 4px 10px rgba(22,50,92,0.08)",
            cursor: "pointer",
            fontSize: 12.5,
            fontWeight: 700,
            color: "#16325c",
          }}
        >
          <Refrigerator size={14} color="#16325c" strokeWidth={2.2} />
          {getScopeLabel(state)}
          <ChevronDown size={13} color="#16325c" strokeWidth={2.2} />
        </div>
        {showScopeMenu && (
          <div style={{ position: "absolute", left: 0, top: "calc(100% + 6px)", background: "#fff", borderRadius: 12, boxShadow: "0 10px 24px rgba(22,50,92,0.14)", padding: 6, zIndex: 5, minWidth: 160 }}>
            {(
              [{ id: "all" as const, name: "All Fridges" }, ...state.fridges.map((f, i) => ({ id: i, name: f.name }))]
            ).map((opt) => {
              const active = opt.id === "all" ? state.kitchenScope === "all" : state.kitchenScope === "active" && state.activeFridge === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => {
                    actions.selectFridgeScope(opt.id);
                    setShowScopeMenu(false);
                  }}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    color: active ? "#2f6fb0" : "#16325c",
                    background: active ? "#eaf6ff" : "transparent",
                  }}
                >
                  {opt.name}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* overview */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Overview</div>
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { label: "Items", value: totalItemCount, color: "#2f6fb0", bg: "#eaf1fb", Icon: Package, onClick: () => actions.goTab("inventory") },
            {
              label: "Expiring soon",
              value: expiringCount,
              color: "#c1452e",
              bg: "#fbeae7",
              Icon: TriangleAlert,
              onClick: () => {
                actions.setInventorySortMode("expiry");
                actions.goTab("inventory");
              },
            },
            { label: "Suggestions", value: suggestionCount, color: "#3f8f5c", bg: "#eaf6ef", Icon: Sparkles, onClick: actions.openRecipesHub },
          ].map((k) => (
            <div
              key={k.label}
              onClick={k.onClick}
              style={{ flex: 1, background: "#fff", boxShadow: "0 6px 16px rgba(22,50,92,0.06)", borderRadius: 16, padding: "12px 8px", textAlign: "center", cursor: "pointer" }}
            >
              <div style={{ width: 28, height: 28, borderRadius: 9, background: k.bg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
                <k.Icon size={14} color={k.color} strokeWidth={2.2} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#16325c" }}>{k.value}</div>
              <div style={{ fontSize: 10, color: "rgba(22,50,92,0.5)", marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* fridge hero carousel */}
      <div style={{ position: "relative", overflow: "hidden", marginBottom: 10 }}>
        <div
          style={{ display: "flex", width: heroTrackWidth, transform: heroTranslate, transition: "transform .3s ease" }}
          onTouchStart={actions.onHeroSwipeStart}
          onTouchEnd={actions.onHeroSwipeEnd}
        >
          {fridgesView.map((fr, i) => (
            <div key={fr.id} style={{ width: `${heroSlideWidthPct}%`, flex: "none" }}>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: 236,
                  borderRadius: 28,
                  overflow: "hidden",
                  background: fr.bg,
                  animation: "glow 5s ease-in-out infinite",
                }}
              >
                {!fr.isCustom && (
                  <Image
                    src={fr.photoSrc}
                    alt="Illustration of a stocked fridge"
                    fill
                    sizes="420px"
                    style={{ objectFit: "cover", objectPosition: "center 15%" }}
                  />
                )}
                {fr.isCustom && (
                  <img
                    src={fr.photoSrc}
                    alt="Custom fridge photo"
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 15%" }}
                  />
                )}
                <div style={{ position: "absolute", top: 22, left: "16%", width: 3, height: 3, borderRadius: "50%", background: "#eaf3fb", animation: "drip 4s ease-in infinite" }} />
                <div style={{ position: "absolute", top: 18, left: "52%", width: 3, height: 3, borderRadius: "50%", background: "#eaf3fb", animation: "drip 4s ease-in infinite 1.3s" }} />
                <div style={{ position: "absolute", top: 14, left: 14, background: "rgba(255,255,255,0.85)", color: "#16325c", fontSize: 12, fontWeight: 800, padding: "6px 11px", borderRadius: 14 }}>
                  {fr.name}
                </div>
                <div style={{ position: "absolute", bottom: 12, left: 16, background: "rgba(22,50,92,0.55)", backdropFilter: "blur(6px)", color: "#fff", fontSize: 11, fontWeight: 600, padding: "5px 10px", borderRadius: 20 }}>
                  {fr.itemCount} items tracked
                </div>
                <div style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.85)", color: fr.color, fontSize: 12, fontWeight: 800, padding: "6px 11px", borderRadius: 14 }}>
                  {fr.freshness}% fresh
                </div>
                <div
                  onClick={() => actions.openStylePicker(i)}
                  style={{
                    position: "absolute",
                    right: 14,
                    bottom: 12,
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    background: "rgba(255,255,255,0.85)",
                    backdropFilter: "blur(6px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    zIndex: 2,
                  }}
                >
                  <Palette size={16} color="#16325c" strokeWidth={2} />
                </div>
              </div>
            </div>
          ))}
          <div style={{ width: `${heroSlideWidthPct}%`, flex: "none" }}>
            <div
              style={{
                width: "100%",
                height: 236,
                borderRadius: 28,
                background: "rgba(255,255,255,0.5)",
                border: "2px dashed rgba(22,50,92,0.22)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                padding: "0 30px",
                boxSizing: "border-box",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: "#16325c" }}>Add another fridge</div>
              <input
                value={state.newFridgeName}
                onChange={(e) => actions.onNewFridgeNameChange(e.target.value)}
                onKeyDown={(e) => actions.onNewFridgeNameKeyDown(e.key)}
                placeholder="e.g. Garage, Office…"
                style={{ width: "100%", border: "none", outline: "none", background: "#fff", borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "#16325c", boxSizing: "border-box" }}
              />
              <div onClick={actions.addFridge} style={{ background: "#16325c", color: "#fff", fontSize: 13, fontWeight: 700, padding: "9px 18px", borderRadius: 12, cursor: "pointer" }}>
                Add fridge
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 10 }}>
          {Array.from({ length: dotCount }).map((_, i) => (
            <div
              key={i}
              onClick={() => actions.selectHero(i)}
              style={{ width: 7, height: 7, borderRadius: 4, background: i === heroSlide ? "#16325c" : "rgba(22,50,92,0.25)", cursor: "pointer" }}
            />
          ))}
        </div>
      </div>
      <div style={{ height: 8 }} />

      {/* meet your crew */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Your crew</div>
        <CrewScene />
      </div>

      {/* guardian tip */}
      {guardianVisible && guardianItem && (
        <SwipeToClear
          marginBottom={14}
          onClear={() => {
            setDismissedGuardianFor(guardianItem.id);
            if (guardianEventId) actions.dismissNotificationWithUndo(guardianEventId);
          }}
        >
          <div
            onClick={() => actions.selectItem(guardianItem.id)}
            style={{ background: "#fff", boxShadow: "0 10px 24px rgba(22,50,92,0.1)", borderRadius: 18, padding: "14px 16px", cursor: "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <TriangleAlert size={15} color="#d99a2b" strokeWidth={2.2} />
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.4, color: "#16325c" }}>EXPIRING SOON</div>
              </div>
              <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 0.3, color: "#c1452e", background: "#c1452e1a", padding: "2px 7px", borderRadius: 6 }}>GUARDIAN</div>
            </div>
            <div style={{ fontSize: 13.5, lineHeight: 1.4, color: "#16325c" }}>{guardianMessage}</div>
          </div>
        </SwipeToClear>
      )}

      {/* low stock */}
      {lowStockVisible && lowStockItem && (
        <SwipeToClear
          marginBottom={18}
          onClear={() => {
            setDismissedLowStockFor(lowStockItem.id);
            if (lowStockEventId) actions.dismissNotificationWithUndo(lowStockEventId);
          }}
        >
          <div onClick={actions.openShoppingHub} style={{ background: "#fff", boxShadow: "0 10px 24px rgba(22,50,92,0.1)", borderRadius: 18, padding: "14px 16px", cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.4, color: "#16325c" }}>LOW STOCK</div>
              <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 0.3, color: "#3f8f5c", background: "#3f8f5c1a", padding: "2px 7px", borderRadius: 6 }}>SHOPKEEPER</div>
            </div>
            <div style={{ fontSize: 13.5, color: "#16325c" }}>
              {lowStockItem.name} — {lowStockItem.note.toLowerCase()}
            </div>
          </div>
        </SwipeToClear>
      )}

      {/* chef's pick */}
      {chefVisible && (
        <SwipeToClear
          marginBottom={22}
          onClear={() => {
            setDismissedChefFor(chefKey);
            if (chefEventId) actions.dismissNotificationWithUndo(chefEventId);
          }}
        >
          <div
            onClick={actions.openRecipesHub}
            style={{ background: "#fff", boxShadow: "0 10px 24px rgba(22,50,92,0.1)", borderRadius: 18, padding: "14px 16px", cursor: "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.4, color: "#16325c" }}>CHEF&apos;S PICK</div>
              <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 0.3, color: "#d99a2b", background: "#d99a2b1a", padding: "2px 7px", borderRadius: 6 }}>CHEF</div>
            </div>
            <div style={{ fontSize: 13.5, lineHeight: 1.4, color: "#16325c" }}>{chefMessage}</div>
          </div>
        </SwipeToClear>
      )}
    </div>

    {/* ============ Wide layout (>=900px) — see .thatfridge-home-wide in globals.css ============ */}
    <div className="thatfridge-home-wide">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5, marginBottom: 6 }}>Home</div>
          <div style={{ position: "relative", width: "fit-content" }}>
            <div
              onClick={() => setShowScopeMenu((v) => !v)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 12, background: "#fff", boxShadow: "0 6px 16px rgba(22,50,92,0.06)", cursor: "pointer", fontSize: 12.5, fontWeight: 700, color: "#16325c" }}
            >
              <Refrigerator size={14} color="#16325c" strokeWidth={2.2} />
              {getScopeLabel(state)}
              <ChevronDown size={13} color="#16325c" strokeWidth={2.2} />
            </div>
            {showScopeMenu && (
              <div style={{ position: "absolute", left: 0, top: "calc(100% + 6px)", background: "#fff", borderRadius: 12, boxShadow: "0 10px 24px rgba(22,50,92,0.14)", padding: 6, zIndex: 5, minWidth: 180 }}>
                {([{ id: "all" as const, name: "All Fridges" }, ...state.fridges.map((f, i) => ({ id: i, name: f.name }))]).map((opt) => {
                  const active = opt.id === "all" ? state.kitchenScope === "all" : state.kitchenScope === "active" && state.activeFridge === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => {
                        actions.selectFridgeScope(opt.id);
                        setShowScopeMenu(false);
                      }}
                      style={{ padding: "8px 10px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer", color: active ? "#2f6fb0" : "#16325c", background: active ? "#eaf6ff" : "transparent" }}
                    >
                      {opt.name}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div
          onClick={actions.openNotificationHistory}
          style={{ position: "relative", width: 38, height: 38, borderRadius: 19, background: "#fff", boxShadow: "0 6px 16px rgba(22,50,92,0.06)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flex: "none" }}
        >
          <Bell size={17} color="#16325c" strokeWidth={2} />
          {pendingNotifications > 0 && (
            <div style={{ position: "absolute", top: 4, right: 5, width: 8, height: 8, borderRadius: 4, background: "#c1452e", border: "1.5px solid #fff" }} />
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Items tracked", value: totalItemCount, color: "#2f6fb0", bg: "rgba(47,111,176,0.12)", Icon: Package, onClick: () => actions.goTab("inventory") },
          {
            label: "Expiring soon",
            value: expiringCount,
            color: "#c1452e",
            bg: "rgba(193,69,46,0.12)",
            Icon: TriangleAlert,
            onClick: () => {
              actions.setInventorySortMode("expiry");
              actions.goTab("inventory");
            },
          },
          { label: "Suggestions", value: suggestionCount, color: "#3f8f5c", bg: "rgba(63,143,92,0.12)", Icon: Sparkles, onClick: actions.openRecipesHub },
        ].map((k) => (
          <div
            key={k.label}
            onClick={k.onClick}
            style={{ display: "flex", alignItems: "center", gap: 14, background: "#fff", boxShadow: "0 6px 20px rgba(22,50,92,0.07)", borderRadius: 22, padding: "18px 20px", cursor: "pointer" }}
          >
            <div style={{ width: 42, height: 42, borderRadius: 13, background: k.bg, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
              <k.Icon size={20} color={k.color} strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: 12, color: "rgba(22,50,92,0.55)", fontWeight: 600, marginTop: 3 }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20, marginBottom: 20, alignItems: "start" }}>
        <div style={{ background: "#fff", boxShadow: "0 6px 20px rgba(22,50,92,0.07)", borderRadius: 22, padding: 20 }}>
          <div style={{ fontSize: 14.5, fontWeight: 800, marginBottom: 14 }}>Your fridges</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14 }}>
            {fridgesView.map((fr, i) => (
              <div
                key={fr.id}
                onClick={() => actions.selectFridgeScope(i)}
                style={{
                  position: "relative",
                  borderRadius: 16,
                  overflow: "hidden",
                  background: "linear-gradient(160deg,#234b7a,#16325c 70%)",
                  color: "#fff",
                  padding: 16,
                  minHeight: 148,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  cursor: "pointer",
                }}
              >
                <img
                  src={fr.photoSrc}
                  alt="Fridge preview"
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%" }}
                />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(22,50,92,0.12) 0%, rgba(22,50,92,0.45) 100%)" }} />
                <div style={{ position: "absolute", top: 14, left: 14, background: "rgba(255,255,255,0.85)", color: "#16325c", fontSize: 12, fontWeight: 800, padding: "6px 11px", borderRadius: 14 }}>
                  {fr.name}
                </div>
                <div style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.85)", color: fr.color, fontSize: 12, fontWeight: 800, padding: "6px 11px", borderRadius: 14 }}>
                  {fr.freshness}% fresh
                </div>
                <div style={{ position: "absolute", bottom: 12, left: 16, background: "rgba(22,50,92,0.55)", backdropFilter: "blur(6px)", color: "#fff", fontSize: 11, fontWeight: 600, padding: "5px 10px", borderRadius: 20 }}>
                  {fr.itemCount} items tracked
                </div>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    actions.openStylePicker(i);
                  }}
                  style={{
                    position: "absolute",
                    right: 12,
                    bottom: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 10px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.15)",
                    backdropFilter: "blur(6px)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    cursor: "pointer",
                    boxShadow: "0 8px 16px rgba(10, 30, 60, 0.16)",
                  }}
                >
                  <Palette size={14} color="#fff" strokeWidth={2.2} />
                  <div style={{ fontSize: 11, fontWeight: 800 }}>Customize</div>
                </div>
              </div>
            ))}
            <div
              style={{
                borderRadius: 16,
                background: "rgba(22,50,92,0.03)",
                border: "2px dashed rgba(22,50,92,0.15)",
                minHeight: 148,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                padding: 14,
              }}
            >
              <div style={{ fontSize: 12.5, fontWeight: 700 }}>Add another fridge</div>
              <input
                value={state.newFridgeName}
                onChange={(e) => actions.onNewFridgeNameChange(e.target.value)}
                onKeyDown={(e) => actions.onNewFridgeNameKeyDown(e.key)}
                placeholder="e.g. Garage, Office…"
                style={{ width: "100%", border: "none", outline: "none", background: "#fff", borderRadius: 10, padding: "8px 10px", fontSize: 12, color: "#16325c", boxSizing: "border-box" }}
              />
              <div onClick={actions.addFridge} style={{ background: "#16325c", color: "#fff", fontSize: 12, fontWeight: 700, padding: "7px 14px", borderRadius: 10, cursor: "pointer" }}>
                Add fridge
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: "#fff", boxShadow: "0 6px 20px rgba(22,50,92,0.07)", borderRadius: 22, padding: 20 }}>
          <div style={{ fontSize: 14.5, fontWeight: 800, marginBottom: 14 }}>Needs attention</div>
          {expiringItems.length === 0 ? (
            <div style={{ fontSize: 12.5, color: "rgba(22,50,92,0.5)" }}>Nothing expiring soon — you&apos;re all set.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {expiringItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => actions.selectItem(item.id)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: 8, borderRadius: 12, cursor: "pointer" }}
                >
                  <div style={{ position: "relative", width: 34, height: 34, borderRadius: 10, background: "#eaf6ff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", padding: 6, boxSizing: "border-box" }}>
                    <FoodIcon icon={item.icon} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: "rgba(22,50,92,0.5)" }}>{item.fridgeName}</div>
                  </div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: 20, flex: "none", color: freshColor(item.freshness), background: `${freshColor(item.freshness)}1a` }}>
                    {daysLabel(item.days)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ background: "#fff", boxShadow: "0 6px 20px rgba(22,50,92,0.07)", borderRadius: 22, padding: 20 }}>
        <div style={{ fontSize: 14.5, fontWeight: 800, marginBottom: 14 }}>Your crew</div>
        <CrewScene scale={1.12} mapScale={0.9} mapOffsetY={-22} />
      </div>

      <div style={{ height: 20 }} />

      <div style={{ background: "#fff", boxShadow: "0 6px 20px rgba(22,50,92,0.07)", borderRadius: 22, padding: 20 }}>
        <div style={{ fontSize: 14.5, fontWeight: 800, marginBottom: 14 }}>Your crew</div>
        {!guardianVisible && !lowStockVisible && !chefVisible ? (
          <div style={{ fontSize: 12.5, color: "rgba(22,50,92,0.5)" }}>No tips right now — check back after your next shop.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
            {chefVisible && (
              <div onClick={actions.openRecipesHub} style={{ background: "#f9fbfd", borderRadius: 16, padding: 16, cursor: "pointer", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800 }}>Chef</div>
                  <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 0.3, color: "#d99a2b", background: "#d99a2b1a", padding: "2px 7px", borderRadius: 6 }}>PICK</div>
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.5, color: "rgba(22,50,92,0.75)" }}>{chefMessage}</div>
              </div>
            )}
            {guardianVisible && guardianItem && (
              <div onClick={() => actions.selectItem(guardianItem.id)} style={{ background: "#f9fbfd", borderRadius: 16, padding: 16, cursor: "pointer", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800 }}>Guardian</div>
                  <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 0.3, color: "#c1452e", background: "#c1452e1a", padding: "2px 7px", borderRadius: 6 }}>ALERT</div>
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.5, color: "rgba(22,50,92,0.75)" }}>{guardianMessage}</div>
              </div>
            )}
            {lowStockVisible && lowStockItem && (
              <div onClick={actions.openShoppingHub} style={{ background: "#f9fbfd", borderRadius: 16, padding: 16, cursor: "pointer", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800 }}>Shopkeeper</div>
                  <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 0.3, color: "#3f8f5c", background: "#3f8f5c1a", padding: "2px 7px", borderRadius: 6 }}>LOW STOCK</div>
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.5, color: "rgba(22,50,92,0.75)" }}>
                  {lowStockItem.name} — {lowStockItem.note.toLowerCase()}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
