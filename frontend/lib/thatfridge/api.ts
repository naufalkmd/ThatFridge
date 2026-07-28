import type { Fridge, Recipe } from "./types";
import { RECIPES, SECTIONS } from "./data";

// Async-shaped stand-ins for real network calls. Swap the bodies for fetch()
// once a backend exists — every caller already awaits these as if they hit a server.
const SIMULATED_LATENCY_MS = 250;

function resolveAfter<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), SIMULATED_LATENCY_MS));
}

function seedFridges(): Fridge[] {
  return [
    { id: "f0", name: "Kitchen", style: "photo", sections: structuredClone(SECTIONS) },
    {
      id: "f1",
      name: "Garage",
      style: "classic",
      sections: [
        {
          id: "drinks",
          name: "Drinks shelf",
          items: [
            { id: "g1", name: "Soda cans", icon: "milk", freshness: 92, days: 60, note: "Full case", qty: 12 },
            { id: "g2", name: "Craft beer", icon: "yogurt", freshness: 85, days: 90, note: "6 left", qty: 6 },
          ],
        },
        {
          id: "overflow",
          name: "Overflow",
          items: [{ id: "g3", name: "Frozen peas", icon: "spinach", freshness: 70, days: 120, note: "Backup bag", qty: 1 }],
        },
      ],
    },
    {
      id: "f2",
      name: "Office",
      style: "mini",
      sections: [
        {
          id: "lunches",
          name: "Lunches",
          items: [
            { id: "o1", name: "Turkey sandwich", icon: "leftovers", freshness: 38, days: 1, note: "Bring home tonight", qty: 1 },
            { id: "o2", name: "Yogurt cup", icon: "yogurt", freshness: 75, days: 5, note: "2 cups", qty: 2 },
          ],
        },
      ],
    },
  ];
}

export function fetchFridges(): Promise<Fridge[]> {
  return resolveAfter(seedFridges());
}

export function fetchRecipes(): Promise<Recipe[]> {
  return resolveAfter(RECIPES);
}
