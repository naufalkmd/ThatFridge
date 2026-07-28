"use client";

import { useEffect, useState } from "react";
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

const IDLE_LINES: Record<CrewId, string[]> = {
  chef: ["Hi, I'm your Chef!", "I cook delicious meals!", "Let's whip something up!", "Hungry for an idea?"],
  guardian: ["Hi, I'm your Guardian!", "I keep your food safe.", "All clear for now!", "On watch, always."],
  organizer: ["Hi, I'm your Organizer!", "Let's keep things tidy.", "Everything in its place.", "Need a hand sorting?"],
  shopkeeper: ["Hi, I'm your Shopkeeper!", "I track what you need.", "Never run out again!", "Ready to restock?"],
};

function alertMessage(id: CrewId, count: number): string | null {
  if (count <= 0) return null;
  if (id === "guardian") return `You have ${count} thing${count === 1 ? "" : "s"} to watch out for!`;
  if (id === "shopkeeper") return `${count} item${count === 1 ? "" : "s"} running low!`;
  if (id === "chef") return `${count} recipe idea${count === 1 ? "" : "s"} ready!`;
  return null;
}

function CrewCharacter({
  zone,
  count,
  onOpenNotifications,
}: {
  zone: (typeof ZONES)[number];
  count: number;
  onOpenNotifications: () => void;
}) {
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    const lines = IDLE_LINES[zone.id];
    const tick = () => {
      setLineIndex((i) => (i + 1) % lines.length);
    };
    const timer = setInterval(tick, 5500 + Math.random() * 3000);
    return () => clearInterval(timer);
  }, [zone.id]);

  const alert = alertMessage(zone.id, count);
  const message = alert || IDLE_LINES[zone.id][lineIndex];

  return (
    <div
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
      <div
        onClick={(e) => {
          if (alert) {
            e.stopPropagation();
            onOpenNotifications();
          }
        }}
        style={{
          position: "absolute",
          bottom: "100%",
          marginBottom: 8,
          left: "50%",
          transform: "translateX(-50%)",
          background: "#fff",
          border: `1.5px solid ${zone.color}`,
          borderRadius: 10,
          padding: "4px 8px",
          fontSize: 9,
          fontWeight: alert ? 800 : 600,
          color: alert ? zone.color : "#16325c",
          whiteSpace: "normal",
          textAlign: "center",
          width: 100,
          lineHeight: 1.25,
          zIndex: 2,
          cursor: alert ? "pointer" : "default",
          boxShadow: "0 4px 10px rgba(22,50,92,0.1)",
        }}
      >
        {message}
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
      <Image src={`/images/thatfridge/${zone.id}.gif`} alt={zone.label} fill unoptimized style={{ objectFit: "contain", imageRendering: "pixelated" }} />
    </div>
  );
}

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
            <div onClick={() => zone.onClick(actions)}>
              <CrewCharacter zone={zone} count={count} onOpenNotifications={actions.openNotificationHistory} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
