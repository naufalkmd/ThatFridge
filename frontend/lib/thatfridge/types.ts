export interface IconData {
  cells: (string | null)[];
  cols: number;
  rows: number;
}

export interface Item {
  id: string;
  name: string;
  icon: string;
  freshness: number;
  days: number;
  note: string;
}

export interface Section {
  id: string;
  name: string;
  items: Item[];
}

export type FridgeStyleKey = "photo" | "custom" | "classic" | "french" | "retro" | "mini";

export interface Fridge {
  id: string;
  name: string;
  style?: FridgeStyleKey;
  sections: Section[];
}

export interface RecipeIngredient {
  icon: string;
  name: string;
}

export interface Recipe {
  id: string;
  name: string;
  minutes: number;
  ingredients: RecipeIngredient[];
  steps: string[];
}

export interface FridgeStyleDef {
  key: string;
  label: string;
  icon: string;
  bg: string;
}

export interface Agent {
  id: string;
  name: string;
  icon: string;
  summary: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  icon: string | null;
  section: string;
  checked: boolean;
}

export interface ChatMessage {
  id: string;
  from: "bot" | "user";
  text: string;
}

export type ScanMethod = "receipt" | "barcode" | "photo";

export interface DetectedItem {
  id: string;
  name: string;
  icon: string;
  section: string;
  checked: boolean;
}

export type Screen =
  | "home"
  | "foodHub"
  | "recipeDetail"
  | "fridgeStyle"
  | "itemDetail"
  | "add"
  | "search"
  | "chat";

export type FoodSubtab = "recipes" | "shopping";
