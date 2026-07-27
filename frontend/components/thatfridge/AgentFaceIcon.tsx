"use client";

import Image from "next/image";

const AGENT_FACE_CROP: Record<"guardian" | "chef", { src: string; alt: string; position: string; zoom: number }> = {
  guardian: { src: "/images/thatfridge/guardian-agent.png", alt: "Guardian", position: "50.5% 42%", zoom: 2.94 },
  chef: { src: "/images/thatfridge/chef-agent.png", alt: "Chef", position: "57% 44%", zoom: 2.7 },
};

export default function AgentFaceIcon({ agent }: { agent: "guardian" | "chef" }) {
  const crop = AGENT_FACE_CROP[agent];
  return (
    <Image
      src={crop.src}
      alt={crop.alt}
      fill
      style={{ objectFit: "cover", objectPosition: crop.position, transform: `scale(${crop.zoom})`, imageRendering: "pixelated" }}
    />
  );
}
