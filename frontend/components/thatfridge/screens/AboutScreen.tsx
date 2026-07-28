"use client";

import Image from "next/image";
import { Refrigerator, X } from "lucide-react";
import { AGENTS } from "@/lib/thatfridge/data";
import { useThatFridgeCtx } from "../ThatFridgeContext";

const AGENT_ACCENT: Record<string, string> = {
  chef: "#b5702f",
  guardian: "#3f5c85",
  organizer: "#2f6f47",
  shopkeeper: "#8a3320",
};

const APP_VERSION = "0.1.0";

export default function AboutScreen() {
  const { actions } = useThatFridgeCtx();

  return (
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#eaf6ff,#cfe8fb 55%,#eaf6ff)", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: "none", padding: "28px 20px 14px", display: "flex", alignItems: "center", gap: 12 }}>
        <div
          onClick={actions.goHome}
          style={{ width: 32, height: 32, borderRadius: 16, background: "#fff", border: "1px solid rgba(22,50,92,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flex: "none" }}
        >
          <X size={15} color="rgba(22,50,92,0.5)" strokeWidth={2} />
        </div>
        <div style={{ fontSize: 18, fontWeight: 800 }}>About ThatFridge</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "6px 20px 100px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "20px 12px 26px" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background: "#16325c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14,
              boxShadow: "0 10px 24px rgba(22,50,92,0.18)",
            }}
          >
            <Refrigerator size={30} color="#fff" strokeWidth={1.8} />
          </div>
          <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>ThatFridge</div>
          <div style={{ fontSize: 12, color: "rgba(22,50,92,0.45)", fontWeight: 600, marginBottom: 10 }}>Version {APP_VERSION}</div>
          <div style={{ fontSize: 13, color: "rgba(22,50,92,0.6)", lineHeight: 1.5, maxWidth: 300 }}>
            A calmer way to track what&apos;s in your fridge — four little agents keep watch on freshness, storage,
            meals and shopping so you don&apos;t have to.
          </div>
        </div>

        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.3, color: "rgba(22,50,92,0.45)", marginBottom: 8 }}>
          MEET YOUR CREW
        </div>
        <div style={{ background: "#fff", boxShadow: "0 6px 16px rgba(22,50,92,0.06)", borderRadius: 16, overflow: "hidden", marginBottom: 20 }}>
          {AGENTS.map((agent, i) => (
            <div
              key={agent.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "13px 14px",
                borderBottom: i < AGENTS.length - 1 ? "1px solid rgba(22,50,92,0.06)" : undefined,
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: 34,
                  height: 34,
                  flex: "none",
                  borderRadius: 10,
                  background: `${AGENT_ACCENT[agent.id]}1a`,
                }}
              >
                <Image src={`/images/thatfridge/${agent.id}-agent.png`} alt="" width={34} height={34} style={{ objectFit: "contain" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 2, color: AGENT_ACCENT[agent.id] }}>{agent.name}</div>
                <div style={{ fontSize: 11.5, color: "rgba(22,50,92,0.5)", lineHeight: 1.35 }}>{agent.summary}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.3, color: "rgba(22,50,92,0.45)", marginBottom: 8 }}>BUILD INFO</div>
        <div style={{ background: "#fff", boxShadow: "0 6px 16px rgba(22,50,92,0.06)", borderRadius: 16, overflow: "hidden", marginBottom: 20 }}>
          {[
            { label: "Version", value: APP_VERSION },
            { label: "Platform", value: "Web" },
          ].map((row, i, arr) => (
            <div
              key={row.label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                borderBottom: i < arr.length - 1 ? "1px solid rgba(22,50,92,0.06)" : undefined,
              }}
            >
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{row.label}</div>
              <div style={{ fontSize: 13, color: "rgba(22,50,92,0.5)" }}>{row.value}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 11.5, color: "rgba(22,50,92,0.4)", textAlign: "center", padding: "8px 12px" }}>
          Made with care for people who forget what&apos;s in the back of the fridge.
        </div>
      </div>
    </div>
  );
}
