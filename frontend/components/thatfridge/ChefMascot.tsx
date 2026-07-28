"use client";

import Image from "next/image";

export default function ChefMascot({ size }: { size: number }) {
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <Image
        src="/images/thatfridge/chef.gif"
        alt="Chef"
        fill
        unoptimized
        sizes={`${size}px`}
        style={{ objectFit: "contain", imageRendering: "pixelated" }}
      />
    </div>
  );
}
