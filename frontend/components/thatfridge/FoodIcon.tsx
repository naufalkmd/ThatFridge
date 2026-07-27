"use client";

import Image from "next/image";
import { iconFor } from "@/lib/thatfridge/selectors";
import PixelIcon from "./PixelIcon";

const FOOD_ICON_IMAGES: Record<string, string> = {
  eggs: "/images/thatfridge/food-icons/icon-026.png",
  cheese: "/images/thatfridge/food-icons/icon-017.png",
  apple: "/images/thatfridge/food-icons/icon-110.png",
  carrot: "/images/thatfridge/food-icons/icon-066.png",
  berries: "/images/thatfridge/food-icons/icon-132.png",
  spinach: "/images/thatfridge/food-icons/icon-139.png",
  meat: "/images/thatfridge/food-icons/icon-015.png",
  leftovers: "/images/thatfridge/food-icons/icon-007.png",
  milk: "/images/thatfridge/food-icons/icon-163.png",
  yogurt: "/images/thatfridge/food-icons/icon-164.png",
};

export default function FoodIcon({ icon }: { icon: string }) {
  const src = FOOD_ICON_IMAGES[icon];
  if (src) {
    return <Image src={src} alt={icon} fill sizes="64px" style={{ objectFit: "contain", imageRendering: "pixelated" }} />;
  }
  return <PixelIcon icon={iconFor(icon)} />;
}
