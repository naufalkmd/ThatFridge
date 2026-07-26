"use client";

import Image from "next/image";
import { getAllItems, iconFor, type ItemWithSection } from "@/lib/thatfridge/selectors";
import { daysLabel, freshColor } from "@/lib/thatfridge/utils";
import { useThatFridgeCtx } from "../ThatFridgeContext";
import PixelIcon from "../PixelIcon";

function RingTimer({ freshness }: { freshness: number }) {
  const size = 44;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = freshColor(freshness);
  return (
    <svg width={size} height={size} style={{ flex: "none", transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(22,50,92,0.1)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={c - (freshness / 100) * c}
        strokeLinecap="round"
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        fontWeight={800}
        fill={color}
        transform={`rotate(90 ${size / 2} ${size / 2})`}
      >
        {freshness}
      </text>
    </svg>
  );
}

const BUCKETS: { key: string; label: string; test: (f: number) => boolean; hint: string }[] = [
  { key: "risk", label: "Act now", test: (f) => f < 30, hint: "Going bad soon — use or lose it" },
  { key: "watch", label: "Use soon", test: (f) => f >= 30 && f < 60, hint: "Plan to use within a few days" },
  { key: "fresh", label: "Fresh", test: (f) => f >= 60, hint: "Holding up well" },
];

export default function GuardianScreen() {
  const { state, actions } = useThatFridgeCtx();
  const items = getAllItems(state).slice().sort((a, b) => a.freshness - b.freshness);

  const groups = BUCKETS.map((b) => ({ ...b, items: items.filter((i) => b.test(i.freshness)) })).filter(
    (g) => g.items.length > 0
  );

  return (
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#eaf6ff,#cfe8fb 55%,#eaf6ff)", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: "none", padding: "28px 20px 14px", display: "flex", alignItems: "center", gap: 12 }}>
        <div
          onClick={actions.goHome}
          style={{ width: 32, height: 32, borderRadius: 16, background: "#fff", border: "1px solid rgba(22,50,92,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 15, color: "rgba(22,50,92,0.5)", flex: "none" }}
        >
          ✕
        </div>
        <div style={{ position: "relative", width: 34, height: 34, flex: "none" }}>
          <Image src="/images/thatfridge/guardian-mascot.png" alt="" width={34} height={34} style={{ objectFit: "contain" }} />
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>Guardian&apos;s watch</div>
          <div style={{ fontSize: 11.5, color: "rgba(22,50,92,0.5)" }}>Riskiest items are listed first</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "6px 20px 100px" }}>
        {items.length === 0 && (
          <div style={{ textAlign: "center", color: "rgba(22,50,92,0.45)", fontSize: 13, marginTop: 40 }}>
            Nothing in this fridge yet — add items to have Guardian watch over them.
          </div>
        )}
        {groups.map((g) => (
          <div key={g.key} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.3, color: "rgba(22,50,92,0.55)" }}>
                {g.label.toUpperCase()} ({g.items.length})
              </div>
              <div style={{ fontSize: 11, color: "rgba(22,50,92,0.4)" }}>{g.hint}</div>
            </div>
            <div style={{ background: "#fff", boxShadow: "0 6px 16px rgba(22,50,92,0.06)", borderRadius: 16, overflow: "hidden" }}>
              {g.items.map((item: ItemWithSection) => (
                <div
                  key={item.id}
                  onClick={() => actions.selectItem(item.id)}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderBottom: "1px solid rgba(22,50,92,0.06)", cursor: "pointer" }}
                >
                  <RingTimer freshness={item.freshness} />
                  <div style={{ position: "relative", width: 28, height: 28, flex: "none" }}>
                    <PixelIcon icon={iconFor(item.icon)} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{item.name}</div>
                    <div style={{ fontSize: 11.5, color: "rgba(22,50,92,0.45)" }}>
                      {item.sectionName} · {item.note}
                    </div>
                  </div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: freshColor(item.freshness) }}>{daysLabel(item.days)}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
