import type { Agent, FoodSubtab, FridgeStyleDef, IconData, Recipe, Section } from "./types";

export const FOOD_TAB_ORDER: FoodSubtab[] = ["recipes", "shopping", "guardian", "organizer"];

// Pixel icon patterns + sample fridge inventory data for ThatFridge.
// Each icon is drawn as rows of a legend string; '.' = transparent.
function makeIcon(rows: string[], legend: Record<string, string>): IconData {
  const cells: (string | null)[] = [];
  for (const row of rows) {
    for (const ch of row) cells.push(ch === "." ? null : legend[ch]);
  }
  return { cells, cols: rows[0].length, rows: rows.length };
}

export const ICONS: Record<string, IconData> = {
  milk: makeIcon(
    ["..aaaa..", ".abbbba.", ".accccc.", ".ccccccc", ".ccdcccc", ".ccccccc", ".ccccccc", "..ccccc."],
    { a: "#8fa8c9", b: "#3f5c85", c: "#f6f3ec", d: "#3f5c85" }
  ),
  eggs: makeIcon(
    ["........", ".ee..ee.", "eff.eff.", "efffefff", "efffefff", ".efff.e.", "..ee....", "........"],
    { e: "#c9a769", f: "#faf3e2" }
  ),
  spinach: makeIcon(
    ["..g..g..", ".ghg.ghg", "ghhgghhg", "ghhhhhhg", ".ghhhhg.", "..gigi..", "...ii...", "........"],
    { g: "#3f7d4a", h: "#5fa668", i: "#7a8f52" }
  ),
  cheese: makeIcon(
    ["........", "jjjjjjj.", "jkjkjkj.", "jjkjkjj.", "jkjkjkj.", "jjjjjjj.", "........", "........"],
    { j: "#f0b93d", k: "#e2a422" }
  ),
  apple: makeIcon(
    ["...l....", "..mmm...", ".nnnnn..", "nnnnnnn.", "nnnnnnn.", ".nnnnn..", "..nnn...", "........"],
    { l: "#5fa668", m: "#8a5a34", n: "#c94f3c" }
  ),
  leftovers: makeIcon(
    ["........", "oooooooo", "opppppo.", "opppppo.", "opppppo.", "oooooooo", "........", "........"],
    { o: "#b9c2c9", p: "#dfe6ea" }
  ),
  yogurt: makeIcon(
    [".qqqqqq.", ".rrrrrr.", ".rssssr.", ".rssssr.", ".rssssr.", "..rrrr..", "........", "........"],
    { q: "#3f5c85", r: "#e8ecef", s: "#f6f3ec" }
  ),
  meat: makeIcon(
    ["........", "..ttt...", ".ttuuutt", "ttuuuutt", ".ttuuutt", "..ttt...", "........", "........"],
    { t: "#b5502f", u: "#dd8a63" }
  ),
  berries: makeIcon(
    ["........", ".v.v.v..", "vwwvwwv.", "wwwwwww.", ".wwwww..", "..www...", "........", "........"],
    { v: "#4c6b3a", w: "#5a3a6b" }
  ),
  carrot: makeIcon(
    ["..x.x...", "..xxx...", "..yyy...", ".yyyy...", "yyyyy...", ".yyy....", "..y.....", "........"],
    { x: "#5fa668", y: "#dd7a2f" }
  ),
};

export const SECTIONS: Section[] = [
  {
    id: "dairy",
    name: "Dairy shelf",
    items: [
      { id: "d1", name: "Whole milk", icon: "milk", freshness: 78, days: 6, note: "Best before Tue" },
      { id: "d2", name: "Greek yogurt", icon: "yogurt", freshness: 54, days: 3, note: "2 tubs left" },
      { id: "d3", name: "Cheddar block", icon: "cheese", freshness: 88, days: 12, note: "Just opened" },
      { id: "d4", name: "Salted butter", icon: "cheese", freshness: 95, days: 20, note: "Barely touched" },
    ],
  },
  {
    id: "produce",
    name: "Produce drawer",
    items: [
      { id: "p1", name: "Spinach", icon: "spinach", freshness: 22, days: 1, note: "Wilting fast" },
      { id: "p2", name: "Apples", icon: "apple", freshness: 71, days: 9, note: "4 left" },
      { id: "p3", name: "Carrots", icon: "carrot", freshness: 65, days: 8, note: "Half bag" },
      { id: "p4", name: "Blueberries", icon: "berries", freshness: 34, days: 2, note: "Small punnet" },
      { id: "p5", name: "Eggs", icon: "eggs", freshness: 60, days: 10, note: "7 remaining" },
    ],
  },
  {
    id: "protein",
    name: "Protein bin",
    items: [
      { id: "r1", name: "Chicken thighs", icon: "meat", freshness: 41, days: 2, note: "Use or freeze" },
      { id: "r2", name: "Ground beef", icon: "meat", freshness: 18, days: 1, note: "Cook tonight" },
      { id: "r3", name: "Eggs (spare)", icon: "eggs", freshness: 82, days: 14, note: "Backup carton" },
    ],
  },
  {
    id: "leftovers",
    name: "Leftovers row",
    items: [
      { id: "l1", name: "Roast veggies", icon: "leftovers", freshness: 30, days: 2, note: "From Sunday" },
      { id: "l2", name: "Pasta bake", icon: "leftovers", freshness: 12, days: 1, note: "Last portion" },
      { id: "l3", name: "Soup", icon: "leftovers", freshness: 66, days: 4, note: "Quart jar" },
    ],
  },
];

export const RECIPES: Recipe[] = [
  {
    id: "rc1",
    name: "Veggie Stir-Fry",
    minutes: 20,
    ingredients: [
      { icon: "carrot", name: "Carrots" },
      { icon: "spinach", name: "Spinach" },
      { icon: "eggs", name: "Eggs" },
      { icon: "meat", name: "Chicken or beef" },
    ],
    steps: [
      "Heat oil in a wok over high heat.",
      "Add carrots and stir-fry 2 minutes.",
      "Add spinach and protein, cook until done.",
      "Season with soy sauce and serve over rice.",
    ],
  },
  {
    id: "rc2",
    name: "Creamy Veggie Soup",
    minutes: 30,
    ingredients: [
      { icon: "spinach", name: "Spinach" },
      { icon: "carrot", name: "Carrots" },
      { icon: "cheese", name: "Cheese" },
      { icon: "milk", name: "Milk" },
    ],
    steps: [
      "Sauté carrots until soft.",
      "Add spinach and cook until wilted.",
      "Pour in milk and simmer.",
      "Stir in cheese until melted and creamy.",
    ],
  },
  {
    id: "rc3",
    name: "Veggie Omelet",
    minutes: 12,
    ingredients: [
      { icon: "eggs", name: "Eggs" },
      { icon: "cheese", name: "Cheese" },
      { icon: "spinach", name: "Spinach" },
    ],
    steps: [
      "Whisk eggs in a bowl.",
      "Pour into a hot buttered pan.",
      "Add spinach and cheese, fold once set.",
      "Cook until golden and serve.",
    ],
  },
  {
    id: "rc4",
    name: "Berry Oat Bowl",
    minutes: 8,
    ingredients: [
      { icon: "berries", name: "Berries" },
      { icon: "yogurt", name: "Yogurt" },
      { icon: "milk", name: "Milk" },
    ],
    steps: ["Combine oats and milk, let sit 5 minutes.", "Top with yogurt.", "Finish with fresh berries."],
  },
  {
    id: "rc5",
    name: "Leftover Fried Rice",
    minutes: 15,
    ingredients: [
      { icon: "leftovers", name: "Leftovers" },
      { icon: "eggs", name: "Eggs" },
      { icon: "carrot", name: "Carrots" },
    ],
    steps: [
      "Scramble eggs in a hot pan, set aside.",
      "Stir-fry carrots for 2 minutes.",
      "Add chopped leftovers and rice, toss well.",
      "Fold in eggs and season to taste.",
    ],
  },
  {
    id: "rc6",
    name: "Apple Crumble",
    minutes: 35,
    ingredients: [
      { icon: "apple", name: "Apples" },
      { icon: "cheese", name: "Butter" },
      { icon: "milk", name: "Milk" },
    ],
    steps: [
      "Slice apples into a baking dish.",
      "Rub butter into a crumble topping.",
      "Scatter topping over apples.",
      "Bake until golden, serve with milk.",
    ],
  },
];

export const ICON_SECTION: Record<string, string> = {
  milk: "dairy",
  yogurt: "dairy",
  cheese: "dairy",
  eggs: "dairy",
  spinach: "produce",
  carrot: "produce",
  apple: "produce",
  berries: "produce",
  meat: "protein",
  leftovers: "leftovers",
};

// Alternate fridge look photos (the hero photo remains the default "Original photo" option).
export const FRIDGE_STYLES: FridgeStyleDef[] = [
  { key: "classic", label: "Classic Blue", photo: "/images/thatfridge/fridge-classic.png", bg: "#4a89c9" },
  { key: "french", label: "French Door", photo: "/images/thatfridge/fridge-french.png", bg: "#dbe6f2" },
  { key: "retro", label: "Retro Mint", photo: "/images/thatfridge/fridge-retro.png", bg: "#8fcda6" },
  { key: "mini", label: "Mini Bar", photo: "/images/thatfridge/fridge-mini.png", bg: "#eaf3fb" },
];

// Pixel-agent crew — chibi character with thick black outline, hat, apron and a held prop, recolored per role.
const AGENT_BODY = [
  "..kkkkkkkk..",
  ".kwwwwwwwwk.",
  ".kwwwwwwwwk.",
  ".kwwwwwwwwk.",
  "..kkkkkkkk..",
  "...kssssk...",
  "..ksseessk..",
  "..kssssssk..",
  "...kbbbbk...",
  ".kbaaaaabk..",
  "wpkaaaaaak..",
  ".wkaaaaaak..",
  "..kaaaaaak..",
  "...kddddk...",
  "...kd..dk...",
  "..kkk..kkk..",
];
ICONS.agentChef = makeIcon(AGENT_BODY, {
  k: "#1a1a1a", w: "#f7f5ef", s: "#e8b98a", e: "#1a1a1a", b: "#4a6fa5", a: "#e0c39a", p: "#9db3c9", d: "#2b3542",
});
ICONS.agentGuardian = makeIcon(AGENT_BODY, {
  k: "#1a1a1a", w: "#8fa8c9", s: "#e8b98a", e: "#1a1a1a", b: "#3f5c85", a: "#5f7c9e", p: "#f0b93d", d: "#2b3542",
});
ICONS.agentOrganizer = makeIcon(AGENT_BODY, {
  k: "#1a1a1a", w: "#f0b93d", s: "#e8b98a", e: "#1a1a1a", b: "#2f6f47", a: "#3f8f5c", p: "#eef2f6", d: "#2b3542",
});
ICONS.agentShopkeeper = makeIcon(AGENT_BODY, {
  k: "#1a1a1a", w: "#c9a769", s: "#e8b98a", e: "#1a1a1a", b: "#8a3320", a: "#c1452e", p: "#f6f3ec", d: "#2b3542",
});

export const AGENTS: Agent[] = [
  { id: "chef", name: "Chef", icon: "agentChef", summary: "Suggests meals from what you already have, prioritizing items closest to expiry." },
  { id: "guardian", name: "Guardian", icon: "agentGuardian", summary: "Watches food safety and flags risky or uncertain items before they go bad." },
  { id: "organizer", name: "Organizer", icon: "agentOrganizer", summary: "Tells you where to store each item and keeps fridge, freezer and pantry tidy." },
  { id: "shopkeeper", name: "Shopkeeper", icon: "agentShopkeeper", summary: "Builds your next grocery list and tells you what not to rebuy." },
];

export const RECIPE_BY_ICON: Record<string, string> = {
  spinach: "Creamy veggie soup",
  carrot: "Creamy veggie soup",
  meat: "Skillet stir-fry",
  eggs: "Veggie omelet",
  leftovers: "Leftover fried rice",
  milk: "Simple breakfast bowl",
  cheese: "Cheesy veggie bake",
  yogurt: "Yogurt parfait",
  berries: "Berry oat bowl",
  apple: "Apple crumble",
};

export const EMPTY_ICON: IconData = { cells: [], cols: 1, rows: 1 };
