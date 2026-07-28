"use client";

import { useState } from "react";
import Image from "next/image";
import { Bell, ChevronDown, Package, Palette, Refrigerator, Sparkles, TriangleAlert } from "lucide-react";
import { RECIPE_BY_ICON } from "@/lib/thatfridge/data";
import { getFridgeHeroViews, getGuardianItem, getLowStockItem, getRecipesView, getScopeLabel, getScopedItems } from "@/lib/thatfridge/selectors";
import { useThatFridgeCtx } from "../ThatFridgeContext";
import CrewScene from "../CrewScene";

export default function HomeScreen() {
  const { state, actions } = useThatFridgeCtx();
  const [showScopeMenu, setShowScopeMenu] = useState(false);
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

  const dotCount = heroSlideCount;
  const pendingNotifications = state.notificationEvents.filter((n) => !n.done).length;

  const userInitials = (state.currentUser?.name || "Friend")
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div style={{ position: "absolute", inset: 0, overflowY: "auto", padding: "28px 20px 150px" }}>
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
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundImage: "url(/images/thatfridge/chat-wallpaper.png), linear-gradient(180deg,#eaf6ff,#cfe8fb 55%,#eaf6ff)",
                      backgroundRepeat: "repeat, no-repeat",
                      backgroundSize: "400px 400px, auto",
                      imageRendering: "pixelated",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      padding: "0 24px",
                    }}
                  >
                    <div style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(6px)", color: "#16325c", fontSize: 12.5, fontWeight: 700, padding: "9px 16px", borderRadius: 14 }}>
                      Drop your fridge photo
                    </div>
                  </div>
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
      {guardianItem && (
        <div
          onClick={() => actions.selectItem(guardianItem.id)}
          style={{ background: "#fff", boxShadow: "0 10px 24px rgba(22,50,92,0.1)", borderRadius: 18, padding: "14px 16px", marginBottom: 14, cursor: "pointer" }}
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
      )}

      {/* low stock */}
      {lowStockItem && (
        <div onClick={actions.openShoppingHub} style={{ background: "#fff", boxShadow: "0 10px 24px rgba(22,50,92,0.1)", borderRadius: 18, padding: "14px 16px", marginBottom: 18, cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.4, color: "#16325c" }}>LOW STOCK</div>
            <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 0.3, color: "#3f8f5c", background: "#3f8f5c1a", padding: "2px 7px", borderRadius: 6 }}>SHOPKEEPER</div>
          </div>
          <div style={{ fontSize: 13.5, color: "#16325c" }}>
            {lowStockItem.name} — {lowStockItem.note.toLowerCase()}
          </div>
        </div>
      )}

      {/* chef's pick */}
      <div
        onClick={actions.openRecipesHub}
        style={{ background: "#fff", boxShadow: "0 10px 24px rgba(22,50,92,0.1)", borderRadius: 18, padding: "14px 16px", marginBottom: 22, cursor: "pointer" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.4, color: "#16325c" }}>CHEF&apos;S PICK</div>
          <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 0.3, color: "#d99a2b", background: "#d99a2b1a", padding: "2px 7px", borderRadius: 6 }}>CHEF</div>
        </div>
        <div style={{ fontSize: 13.5, lineHeight: 1.4, color: "#16325c" }}>{chefMessage}</div>
      </div>
    </div>
  );
}
