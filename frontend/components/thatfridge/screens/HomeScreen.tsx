"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { RECIPE_BY_ICON } from "@/lib/thatfridge/data";
import {
  getActiveSections,
  getFridgeHeroViews,
  getGuardianItem,
  getLowStockItem,
  iconFor,
} from "@/lib/thatfridge/selectors";
import { daysLabel, freshColor } from "@/lib/thatfridge/utils";
import { useThatFridgeCtx } from "../ThatFridgeContext";
import PixelIcon from "../PixelIcon";

const HERO_CARD_WIDTH = 362;

const cardStyle: React.CSSProperties = {
  background: "#fff",
  boxShadow: "0 10px 24px rgba(22,50,92,0.1)",
  borderRadius: 18,
  padding: "14px 78px 14px 16px",
  cursor: "pointer",
};

function CrewRow({
  reverse,
  borderBottom,
  bg,
  onEnter,
  onLeave,
  onClick,
  image,
  tailSide,
  color,
  name,
  desc,
}: {
  reverse: boolean;
  borderBottom: boolean;
  bg: string;
  onEnter: () => void;
  onLeave: () => void;
  onClick: () => void;
  image: ReactNode;
  tailSide: "left" | "right";
  color: string;
  name: string;
  desc: string;
}) {
  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onClick}
      style={{
        position: "relative",
        width: "100%",
        padding: "11px 13px",
        borderBottom: borderBottom ? "1px solid rgba(22,50,92,0.07)" : undefined,
        background: bg,
        transition: "background .18s ease",
        display: "flex",
        flexDirection: reverse ? "row-reverse" : "row",
        alignItems: "center",
        gap: 11,
        cursor: "pointer",
        boxSizing: "border-box",
      }}
    >
      <div style={{ position: "relative", width: 85, height: 106, flex: "none", overflow: "visible" }}>{image}</div>
      <div
        style={{
          position: "relative",
          flex: 1,
          background: "#f7f5ef",
          color: "#16325c",
          border: "3px solid #1a1a1a",
          boxShadow: "4px 4px 0 #1a1a1a",
          padding: "10px 13px",
          fontSize: 12,
          lineHeight: 1.35,
        }}
      >
        <div
          style={{
            position: "absolute",
            [tailSide]: -6,
            bottom: 16,
            width: 6,
            height: 6,
            background: "#f7f5ef",
            border: "3px solid #1a1a1a",
            [tailSide === "left" ? "borderRight" : "borderLeft"]: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            [tailSide]: -12,
            bottom: 10,
            width: 6,
            height: 6,
            background: "#f7f5ef",
            border: "3px solid #1a1a1a",
            [tailSide === "left" ? "borderRight" : "borderLeft"]: "none",
          }}
        />
        <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 2, color }}>{name}</div>
        <div style={{ fontWeight: 500, opacity: 0.85 }}>{desc}</div>
      </div>
    </div>
  );
}

export default function HomeScreen() {
  const { state, actions } = useThatFridgeCtx();
  const fridgesView = getFridgeHeroViews(state);
  const heroSlide = state.heroSlide;
  const heroTrackWidth = (fridgesView.length + 1) * HERO_CARD_WIDTH;
  const heroTranslate = `translateX(-${heroSlide * HERO_CARD_WIDTH}px)`;

  const guardianItem = getGuardianItem(state);
  const lowStockItem = getLowStockItem(state);
  const sections = getActiveSections(state);

  const chefMessage = guardianItem
    ? `Try "${RECIPE_BY_ICON[guardianItem.icon] || "a quick stir-fry"}" tonight using your ${guardianItem.name.toLowerCase()}.`
    : "Your kitchen looks well stocked tonight.";

  const guardianMessage = guardianItem
    ? guardianItem.freshness < 30
      ? `${guardianItem.name} needs attention today — down to ${guardianItem.freshness}% freshness.`
      : `Use ${guardianItem.name.toLowerCase()} within ${guardianItem.days} day${guardianItem.days === 1 ? "" : "s"} for best quality.`
    : "";

  const dotCount = fridgesView.length + 1;

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
          JD
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.3 }}>ThatFridge</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
            <div style={{ width: 13, height: 13, border: "1.6px solid #16325c", borderRadius: "50%", position: "relative" }}>
              <div style={{ position: "absolute", width: 1.6, height: 7, background: "#16325c", bottom: -6, right: -1, transform: "rotate(45deg)" }} />
            </div>
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
            <div key={fr.id} style={{ width: HERO_CARD_WIDTH, flex: "none" }}>
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
                    sizes="362px"
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
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2,5px)", gridTemplateRows: "repeat(2,5px)", gap: 2 }}>
                    <div style={{ background: "#16325c", borderRadius: 1 }} />
                    <div style={{ background: "#16325c", borderRadius: 1 }} />
                    <div style={{ background: "#16325c", borderRadius: 1 }} />
                    <div style={{ background: "#16325c", borderRadius: 1 }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div style={{ width: HERO_CARD_WIDTH, flex: "none" }}>
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

      {/* guardian tip */}
      {guardianItem && (
        <div style={{ position: "relative", marginBottom: 14 }}>
          <div onClick={() => actions.selectItem(guardianItem.id)} style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <div style={{ width: 15, height: 14, background: "#d99a2b", clipPath: "polygon(50% 0,100% 100%,0 100%)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                <span style={{ color: "#fff", fontSize: 9, fontWeight: 800, lineHeight: 1 }}>!</span>
              </div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.4, color: "#16325c" }}>EXPIRING SOON</div>
            </div>
            <div style={{ fontSize: 13.5, lineHeight: 1.4, color: "#16325c" }}>{guardianMessage}</div>
          </div>
          <Image src="/images/thatfridge/guardian-mascot.png" alt="Guardian mascot" width={64} height={64} style={{ position: "absolute", right: 2, bottom: -6, objectFit: "contain" }} />
        </div>
      )}

      {/* low stock */}
      {lowStockItem && (
        <div onClick={actions.openShoppingHub} style={{ background: "#fff", boxShadow: "0 10px 24px rgba(22,50,92,0.1)", borderRadius: 18, padding: "14px 16px", marginBottom: 18, cursor: "pointer" }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.4, color: "#16325c", marginBottom: 6 }}>LOW STOCK</div>
          <div style={{ fontSize: 13.5, color: "#16325c" }}>
            {lowStockItem.name} — {lowStockItem.note.toLowerCase()}
          </div>
        </div>
      )}

      {/* chef's pick */}
      <div style={{ position: "relative", marginBottom: 22 }}>
        <div onClick={actions.openRecipesHub} style={cardStyle}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.4, color: "#16325c", marginBottom: 6 }}>CHEF&apos;S PICK</div>
          <div style={{ fontSize: 13.5, lineHeight: 1.4, color: "#16325c" }}>{chefMessage}</div>
        </div>
        <Image src="/images/thatfridge/chef-mascot.png" alt="Chef mascot" width={66} height={66} style={{ position: "absolute", right: 2, bottom: -8, objectFit: "contain" }} />
      </div>

      {/* meet your crew */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Meet your crew</div>
        <div style={{ display: "flex", flexDirection: "column", background: "#fff", boxShadow: "0 6px 16px rgba(22,50,92,0.06)", borderRadius: 16, overflow: "hidden" }}>
          <CrewRow
            reverse={false}
            borderBottom
            bg={state.hoveredAgent === "chef" ? "rgba(181,112,47,0.14)" : "transparent"}
            onEnter={() => actions.hoverAgent("chef")}
            onLeave={actions.clearHoverAgent}
            onClick={actions.openRecipesHub}
            tailSide="left"
            color="#b5702f"
            name="Chef"
            desc="Suggests meals from what's on hand"
            image={
              <Image
                src="/images/thatfridge/chef-agent.png"
                alt="Chef"
                fill
                sizes="85px"
                style={{ objectFit: "contain", imageRendering: "pixelated", transform: "scaleX(-1)" }}
              />
            }
          />
          <CrewRow
            reverse
            borderBottom
            bg={state.hoveredAgent === "guardian" ? "rgba(63,92,133,0.14)" : "transparent"}
            onEnter={() => actions.hoverAgent("guardian")}
            onLeave={actions.clearHoverAgent}
            onClick={actions.openGuardianHub}
            tailSide="right"
            color="#3f5c85"
            name="Guardian"
            desc="Flags risky items and food-safety calls"
            image={
              <Image
                src="/images/thatfridge/guardian-agent.png"
                alt="Guardian"
                width={120}
                height={120}
                style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", objectFit: "contain", maxWidth: "none", maxHeight: "none" }}
              />
            }
          />
          <CrewRow
            reverse={false}
            borderBottom
            bg={state.hoveredAgent === "organizer" ? "rgba(47,111,71,0.14)" : "transparent"}
            onEnter={() => actions.hoverAgent("organizer")}
            onLeave={actions.clearHoverAgent}
            onClick={actions.openOrganizerHub}
            tailSide="left"
            color="#2f6f47"
            name="Organizer"
            desc="Sorts groceries into fridge, freezer, pantry"
            image={
              <Image
                src="/images/thatfridge/organizer-agent.png"
                alt="Organizer"
                width={112}
                height={112}
                style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%) scaleX(-1)", objectFit: "contain", maxWidth: "none", maxHeight: "none" }}
              />
            }
          />
          <CrewRow
            reverse
            borderBottom={false}
            bg={state.hoveredAgent === "shopkeeper" ? "rgba(138,51,32,0.14)" : "transparent"}
            onEnter={() => actions.hoverAgent("shopkeeper")}
            onLeave={actions.clearHoverAgent}
            onClick={actions.openShopkeeperHub}
            tailSide="right"
            color="#8a3320"
            name="Shopkeeper"
            desc="Builds your list, flags what not to rebuy"
            image={
              <Image
                src="/images/thatfridge/shopkeeper-agent.png"
                alt="Shopkeeper"
                width={116}
                height={116}
                style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", objectFit: "contain", maxWidth: "none", maxHeight: "none" }}
              />
            }
          />
        </div>
      </div>

      {/* inventory sections */}
      {sections.map((sec) => (
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
                  <PixelIcon icon={iconFor(item.icon)} />
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
      ))}
    </div>
  );
}
