"use client";

import { useState } from "react";
import Image from "next/image";
import { Bell, ListFilter, Palette, Search, TriangleAlert } from "lucide-react";
import { RECIPE_BY_ICON } from "@/lib/thatfridge/data";
import {
  getActiveSections,
  getFridgeHeroViews,
  getGuardianItem,
  getLowStockItem,
} from "@/lib/thatfridge/selectors";
import { daysLabel, freshColor } from "@/lib/thatfridge/utils";
import { useThatFridgeCtx } from "../ThatFridgeContext";
import FoodIcon from "../FoodIcon";
import CrewScene from "../CrewScene";

const SORT_OPTIONS: { key: "category" | "expiry" | "name"; label: string }[] = [
  { key: "category", label: "Category" },
  { key: "expiry", label: "Expiry" },
  { key: "name", label: "Name" },
];

export default function HomeScreen() {
  const { state, actions } = useThatFridgeCtx();
  const [showSortMenu, setShowSortMenu] = useState(false);
  const fridgesView = getFridgeHeroViews(state);
  const heroSlide = state.heroSlide;
  const heroSlideCount = fridgesView.length + 1;
  const heroSlideWidthPct = 100 / heroSlideCount;
  const heroTrackWidth = `${heroSlideCount * 100}%`;
  const heroTranslate = `translateX(-${heroSlide * heroSlideWidthPct}%)`;

  const guardianItem = getGuardianItem(state);
  const lowStockItem = getLowStockItem(state);
  const sections = getActiveSections(state);

  const flatItems = sections.flatMap((sec) => sec.items.map((item) => ({ ...item, sectionName: sec.name })));
  const sortedFlatItems =
    state.homeSortMode === "expiry"
      ? flatItems.slice().sort((a, b) => a.freshness - b.freshness)
      : state.homeSortMode === "name"
        ? flatItems.slice().sort((a, b) => a.name.localeCompare(b.name))
        : flatItems;

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
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
          <div
            onClick={actions.openSearch}
            style={{
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
            <Search size={16} color="#16325c" strokeWidth={2} />
          </div>
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
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      padding: "0 24px",
                      color: "rgba(22,50,92,0.55)",
                      fontSize: 12.5,
                      fontWeight: 700,
                    }}
                  >
                    Drop your fridge photo
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
          <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 0.3, color: "#b5702f", background: "#b5702f1a", padding: "2px 7px", borderRadius: 6 }}>CHEF</div>
        </div>
        <div style={{ fontSize: 13.5, lineHeight: 1.4, color: "#16325c" }}>{chefMessage}</div>
      </div>

      {/* inventory */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>Inventory</div>
        <div style={{ position: "relative" }}>
          <div
            onClick={() => setShowSortMenu((v) => !v)}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 10, background: "#fff", boxShadow: "0 4px 10px rgba(22,50,92,0.08)", cursor: "pointer", fontSize: 11.5, fontWeight: 700, color: "#16325c" }}
          >
            <ListFilter size={13} color="#16325c" strokeWidth={2.2} />
            {SORT_OPTIONS.find((o) => o.key === state.homeSortMode)?.label}
          </div>
          {showSortMenu && (
            <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", background: "#fff", borderRadius: 12, boxShadow: "0 10px 24px rgba(22,50,92,0.14)", padding: 6, zIndex: 5, minWidth: 120 }}>
              {SORT_OPTIONS.map((opt) => (
                <div
                  key={opt.key}
                  onClick={() => {
                    actions.setHomeSortMode(opt.key);
                    setShowSortMenu(false);
                  }}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    color: state.homeSortMode === opt.key ? "#2f6fb0" : "#16325c",
                    background: state.homeSortMode === opt.key ? "#eaf6ff" : "transparent",
                  }}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {state.homeSortMode === "category" ? (
        sections.map((sec) => (
          <div key={sec.id} style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{sec.name}</div>
              <div style={{ fontSize: 12, color: "rgba(22,50,92,0.45)" }}>{sec.items.length} items</div>
            </div>
            <div style={{ background: "#fff", boxShadow: "0 6px 16px rgba(22,50,92,0.06)", borderRadius: 16, overflow: "hidden" }}>
              {sec.items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => actions.selectItem(item.id)}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderBottom: "1px solid rgba(22,50,92,0.06)", cursor: "pointer" }}
                >
                  <div style={{ position: "relative", width: 38, height: 38, flex: "none", borderRadius: 11, background: "#f6f1e4", padding: 6, boxSizing: "border-box" }}>
                    <FoodIcon icon={item.icon} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{item.name}</div>
                    <div style={{ height: 4, borderRadius: 2, background: "rgba(22,50,92,0.08)", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 2, width: `${item.freshness}%`, background: freshColor(item.freshness) }} />
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flex: "none" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: freshColor(item.freshness) }}>{daysLabel(item.days)}</div>
                    <div style={{ fontSize: 10.5, color: "rgba(22,50,92,0.4)", marginTop: 2 }}>{item.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div style={{ background: "#fff", boxShadow: "0 6px 16px rgba(22,50,92,0.06)", borderRadius: 16, overflow: "hidden", marginBottom: 22 }}>
          {sortedFlatItems.map((item) => (
            <div
              key={item.id}
              onClick={() => actions.selectItem(item.id)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderBottom: "1px solid rgba(22,50,92,0.06)", cursor: "pointer" }}
            >
              <div style={{ position: "relative", width: 38, height: 38, flex: "none", borderRadius: 11, background: "#f6f1e4", padding: 6, boxSizing: "border-box" }}>
                <FoodIcon icon={item.icon} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{item.name}</div>
                <div style={{ fontSize: 10.5, color: "rgba(22,50,92,0.4)" }}>{item.sectionName}</div>
              </div>
              <div style={{ textAlign: "right", flex: "none" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: freshColor(item.freshness) }}>{daysLabel(item.days)}</div>
                <div style={{ fontSize: 10.5, color: "rgba(22,50,92,0.4)", marginTop: 2 }}>{item.note}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
