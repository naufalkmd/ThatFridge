"use client";

import Image from "next/image";
import { FOOD_ICON_IMAGES } from "@/lib/thatfridge/data";
import { iconFor } from "@/lib/thatfridge/selectors";
import PixelIcon from "./PixelIcon";

export default function FoodIcon({ icon }: { icon: string }) {
  const src = FOOD_ICON_IMAGES[icon];
  if (src) {
    return <Image src={src} alt={icon} fill sizes="64px" style={{ objectFit: "contain", imageRendering: "pixelated" }} />;
  }
  return <PixelIcon icon={iconFor(icon)} />;
}
