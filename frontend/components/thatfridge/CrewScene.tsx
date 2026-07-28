"use client";

import Image from "next/image";
import type { NotificationKind } from "@/lib/thatfridge/types";
import type { ThatFridgeActions } from "@/lib/thatfridge/useThatFridge";
import { useThatFridgeCtx } from "./ThatFridgeContext";

type CrewId = "chef" | "guardian" | "organizer" | "shopkeeper";

const ZONES: {
  id: CrewId;
  label: string;
  color: string;
  leftPct: number;
  topPct: number;
  roamPx: number;
  durationS: number;
  notifKind?: NotificationKind;
  onClick: (a: ThatFridgeActions) => void;
}[] = [
  { id: "chef", label: "Kitchen", color: "#b5702f", leftPct: 13, topPct: 25, roamPx: 95, durationS: 7, notifKind: "recipe", onClick: (a) => a.openRecipesHub() },
  { id: "organizer", label: "Organizer", color: "#2f6fb0", leftPct: 58, topPct: 25, roamPx: 95, durationS: 8, onClick: (a) => a.openOrganizerTab() },
  { id: "guardian", label: "Guardian", color: "#c1452e", leftPct: 5, topPct: 62, roamPx: 55, durationS: 6.5, notifKind: "expiring", onClick: (a) => a.openGuardianTab() },
  { id: "shopkeeper", label: "Shop", color: "#3f8f5c", leftPct: 41, topPct: 53, roamPx: 140, durationS: 9, notifKind: "lowStock", onClick: (a) => a.openShoppingHub() },
];

const SPRITE_SIZE = 48;

export default function CrewScene() {
  const { state, actions } = useThatFridgeCtx();

  const pendingByKind: Record<NotificationKind, number> = { expiring: 0, lowStock: 0, recipe: 0 };
  for (const event of state.notificationEvents) {
    if (!event.done) pendingByKind[event.kind] += 1;
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "1186 / 849",
      }}
    >
      <Image src="/images/thatfridge/pixel-art-source.png" alt="Your crew's spaces" fill sizes="480px" style={{ objectFit: "contain", imageRendering: "pixelated" }} />

      {ZONES.map((zone) => {
        const count = zone.notifKind ? pendingByKind[zone.notifKind] : 0;
        return (
          <div
            key={zone.id}
            style={{
              position: "absolute",
              left: `${zone.leftPct}%`,
              top: `${zone.topPct}%`,
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: 0.2,
                color: "#fff",
                background: zone.color,
                padding: "2px 6px",
                borderRadius: 6,
                whiteSpace: "nowrap",
                marginBottom: 2,
                textAlign: "center",
              }}
            >
              {zone.label}
            </div>
            <div
              onClick={() => zone.onClick(actions)}
              style={
                {
                  position: "relative",
                  width: SPRITE_SIZE,
                  height: SPRITE_SIZE,
                  cursor: "pointer",
                  animation: `crewWalk ${zone.durationS}s ease-in-out infinite`,
                  "--roam": `${zone.roamPx}px`,
                } as React.CSSProperties
              }
            >
              {count > 0 && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    actions.openNotificationHistory();
                  }}
                  style={{
                    position: "absolute",
                    top: -38,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#fff",
                    border: `1.5px solid ${zone.color}`,
                    borderRadius: 8,
                    padding: "1px 5px",
                    fontSize: 9,
                    fontWeight: 800,
                    color: zone.color,
                    whiteSpace: "nowrap",
                    zIndex: 2,
                    cursor: "pointer",
                  }}
                >
                  {count}
                  <div
                    style={{
                      position: "absolute",
                      bottom: -4,
                      left: "50%",
                      transform: "translateX(-50%) rotate(45deg)",
                      width: 6,
                      height: 6,
                      background: "#fff",
                      borderRight: `1.5px solid ${zone.color}`,
                      borderBottom: `1.5px solid ${zone.color}`,
                    }}
                  />
                </div>
              )}
              <Image src={`/images/thatfridge/${zone.id}.gif`} alt={zone.label} fill unoptimized style={{ objectFit: "contain", imageRendering: "pixelated" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
