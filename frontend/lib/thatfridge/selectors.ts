import { EMPTY_ICON, FRIDGE_STYLES, ICONS, RECIPES } from "./data";
import { freshColor } from "./utils";
import type { Item, Section } from "./types";
import type { ThatFridgeState } from "./useThatFridge";

export function getActiveSections(state: ThatFridgeState): Section[] {
  return state.fridges[state.activeFridge].sections;
}

export interface ItemWithSection extends Item {
  sectionName: string;
  sectionId: string;
}

export function getAllItems(state: ThatFridgeState): ItemWithSection[] {
  return getActiveSections(state).flatMap((sec) =>
    sec.items.map((item) => ({ ...item, sectionName: sec.name, sectionId: sec.id }))
  );
}

export function findItem(state: ThatFridgeState, id: string): { item: Item; section: Section } | null {
  for (const sec of getActiveSections(state)) {
    const item = sec.items.find((i) => i.id === id);
    if (item) return { item, section: sec };
  }
  return null;
}

export function getOverallFreshness(state: ThatFridgeState): number {
  const items = getAllItems(state);
  return items.length ? Math.round(items.reduce((a, i) => a + i.freshness, 0) / items.length) : 0;
}

export function getGuardianItem(state: ThatFridgeState): ItemWithSection | null {
  const items = getAllItems(state);
  return items.length ? items.reduce((a, b) => (a.freshness < b.freshness ? a : b)) : null;
}

export function getLowStockItem(state: ThatFridgeState): ItemWithSection | null {
  const guardian = getGuardianItem(state);
  return getAllItems(state).find((i) => /left|remaining/i.test(i.note) && i.id !== guardian?.id) || null;
}

export interface FridgeSummary {
  id: string;
  name: string;
  itemCount: number;
  freshness: number;
  color: string;
  style: string;
}

export function getFridgeSummaries(state: ThatFridgeState): FridgeSummary[] {
  return state.fridges.map((f) => {
    const items = f.sections.flatMap((s) => s.items);
    const freshness = items.length ? Math.round(items.reduce((a, i) => a + i.freshness, 0) / items.length) : 0;
    return { id: f.id, name: f.name, itemCount: items.length, freshness, color: freshColor(freshness), style: f.style || "photo" };
  });
}

export function iconFor(icon: string) {
  return ICONS[icon] || EMPTY_ICON;
}

export interface RecipeView {
  id: string;
  name: string;
  minutes: number;
  iconData: typeof EMPTY_ICON;
  haveCount: number;
  total: number;
  ratioLabel: string;
  ratioColor: string;
  ratioBg: string;
  ingredientsView: { icon: string; name: string; have: boolean; badgeBg: string; badgeMark: string; statusLabel: string }[];
  stepsView: { n: number; text: string }[];
}

export function getRecipesView(state: ThatFridgeState): RecipeView[] {
  const allItems = getAllItems(state);
  return RECIPES.map((r) => {
    const ingredientsView = r.ingredients.map((ing) => {
      const have = allItems.some((i) => i.icon === ing.icon);
      return {
        ...ing,
        have,
        badgeBg: have ? "#3f8f5c" : "rgba(22,50,92,0.35)",
        badgeMark: have ? "✓" : "+",
        statusLabel: have ? "Have it" : "Need it",
      };
    });
    const haveCount = ingredientsView.filter((i) => i.have).length;
    const total = ingredientsView.length;
    return {
      id: r.id,
      name: r.name,
      minutes: r.minutes,
      iconData: iconFor(r.ingredients[0].icon),
      ingredientsView,
      stepsView: r.steps.map((text, i) => ({ text, n: i + 1 })),
      haveCount,
      total,
      ratioLabel: `${haveCount}/${total} ready`,
      ratioColor: haveCount === total ? "#3f8f5c" : "rgba(22,50,92,0.55)",
      ratioBg: haveCount === total ? "rgba(63,143,92,0.12)" : "rgba(22,50,92,0.06)",
    };
  });
}

export function getTonightPick(recipesView: RecipeView[]): RecipeView | null {
  return recipesView.length
    ? recipesView.reduce((best, r) => (r.haveCount / r.total > best.haveCount / best.total ? r : best))
    : null;
}

export function styleDef(key: string) {
  return FRIDGE_STYLES.find((s) => s.key === key);
}

export interface FridgeHeroView {
  id: string;
  name: string;
  itemCount: number;
  freshness: number;
  color: string;
  isPhoto: boolean;
  isPixel: boolean;
  isCustom: boolean;
  pixelIconData: typeof EMPTY_ICON;
  pixelBg: string;
}

export function getFridgeHeroViews(state: ThatFridgeState): FridgeHeroView[] {
  return state.fridges.map((f) => {
    const items = f.sections.flatMap((s) => s.items);
    const freshness = items.length ? Math.round(items.reduce((a, i) => a + i.freshness, 0) / items.length) : 0;
    const style = f.style || "photo";
    const isPhoto = style === "photo";
    const isCustom = style === "custom";
    const isPixel = !isPhoto && !isCustom;
    const def = isPixel ? styleDef(style) : undefined;
    return {
      id: f.id,
      name: f.name,
      itemCount: items.length,
      freshness,
      color: freshColor(freshness),
      isPhoto,
      isPixel,
      isCustom,
      pixelIconData: def ? iconFor(def.icon) : EMPTY_ICON,
      pixelBg: def ? def.bg : "#4a89c9",
    };
  });
}
