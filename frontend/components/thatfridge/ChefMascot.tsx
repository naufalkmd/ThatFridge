"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const BOB_DURATION_S = 2.6;
const FLOURISH_MS = 750;
const FLOURISH_MIN_DELAY_MS = 5000;
const FLOURISH_MAX_DELAY_MS = 9000;

export default function ChefMascot({ size }: { size: number }) {
  const [flourish, setFlourish] = useState(false);

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout>;
    let nextTimer: ReturnType<typeof setTimeout>;
    const scheduleNext = () => {
      const delay = FLOURISH_MIN_DELAY_MS + Math.random() * (FLOURISH_MAX_DELAY_MS - FLOURISH_MIN_DELAY_MS);
      nextTimer = setTimeout(() => {
        setFlourish(true);
        hideTimer = setTimeout(() => setFlourish(false), FLOURISH_MS);
        scheduleNext();
      }, delay);
    };
    scheduleNext();
    return () => {
      clearTimeout(nextTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        animation: `idleBob ${BOB_DURATION_S}s ease-in-out infinite`,
      }}
    >
      <Image
        src={flourish ? "/images/thatfridge/chef-agent-flourish.png" : "/images/thatfridge/chef-agent.png"}
        alt="Chef"
        fill
        sizes={`${size}px`}
        style={{ objectFit: "contain", imageRendering: "pixelated" }}
      />
    </div>
  );
}
