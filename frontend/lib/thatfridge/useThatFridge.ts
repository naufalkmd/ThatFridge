"use client";

import { useRef, useState } from "react";
import { ICON_SECTION, RECIPES, SECTIONS } from "./data";
import { findItem } from "./selectors";
import type {
  ChatMessage,
  DetectedItem,
  FoodSubtab,
  Fridge,
  FridgeStyleKey,
  Screen,
  ScanMethod,
  Section,
  ShoppingItem,
  StorageLocation,
  UsageHistoryEntry,
} from "./types";
import { chatBotReply } from "./chat";

const DEFAULT_ICON_BY_SECTION: Record<string, string> = {
  dairy: "milk",
  produce: "carrot",
  protein: "meat",
  leftovers: "leftovers",
};

export interface ThatFridgeState {
  screen: Screen;
  fridges: Fridge[];
  activeFridge: number;
  heroSlide: number;
  newFridgeName: string;
  showProfilePanel: boolean;
  selectedItemId: string | null;
  addStep: number;
  scanMethod: ScanMethod | null;
  detected: DetectedItem[];
  manualName: string;
  manualSectionId: string;
  manualDays: string;
  manualNote: string;
  usageHistory: UsageHistoryEntry[];
  searchQuery: string;
  foodSubtab: FoodSubtab;
  selectedRecipeId: string | null;
  newShoppingText: string;
  shoppingList: ShoppingItem[];
  shoppingSeeded: boolean;
  chatMessages: ChatMessage[];
  chatDraft: string;
  isTyping: boolean;
  stylingFridgeIndex: number;
  hoveredAgent: string | null;
}

function initialState(): ThatFridgeState {
  return {
    screen: "home",
    fridges: [
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
              { id: "g1", name: "Soda cans", icon: "milk", freshness: 92, days: 60, note: "Full case" },
              { id: "g2", name: "Craft beer", icon: "yogurt", freshness: 85, days: 90, note: "6 left" },
            ],
          },
          {
            id: "overflow",
            name: "Overflow",
            items: [{ id: "g3", name: "Frozen peas", icon: "spinach", freshness: 70, days: 120, note: "Backup bag" }],
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
              { id: "o1", name: "Turkey sandwich", icon: "leftovers", freshness: 38, days: 1, note: "Bring home tonight" },
              { id: "o2", name: "Yogurt cup", icon: "yogurt", freshness: 75, days: 5, note: "2 cups" },
            ],
          },
        ],
      },
    ],
    activeFridge: 0,
    heroSlide: 0,
    newFridgeName: "",
    showProfilePanel: false,
    selectedItemId: null,
    addStep: 0,
    scanMethod: null,
    detected: [],
    manualName: "",
    manualSectionId: "",
    manualDays: "7",
    manualNote: "",
    usageHistory: [],
    searchQuery: "",
    foodSubtab: "recipes",
    selectedRecipeId: null,
    newShoppingText: "",
    shoppingList: [],
    shoppingSeeded: false,
    chatMessages: [{ id: "m0", from: "bot", text: "Hi, I'm Guardian! Ask me anything about what's in your fridge." }],
    chatDraft: "",
    isTyping: false,
    stylingFridgeIndex: 0,
    hoveredAgent: null,
  };
}

type Patch = Partial<ThatFridgeState> | ((s: ThatFridgeState) => Partial<ThatFridgeState>);

export function useThatFridge() {
  const [state, setState] = useState<ThatFridgeState>(initialState);
  const heroTouchX = useRef(0);
  const foodSwipeX = useRef(0);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const patch = (updater: Patch) => {
    setState((prev) => ({ ...prev, ...(typeof updater === "function" ? updater(prev) : updater) }));
  };

  const setSections = (sections: Section[]) => {
    patch((s) => ({ fridges: s.fridges.map((f, i) => (i === s.activeFridge ? { ...f, sections } : f)) }));
  };

  const setItemLocation = (id: string, location: StorageLocation) => {
    patch((s) => ({
      fridges: s.fridges.map((f, i) =>
        i === s.activeFridge
          ? { ...f, sections: f.sections.map((sec) => ({ ...sec, items: sec.items.map((it) => (it.id === id ? { ...it, location } : it)) })) }
          : f
      ),
    }));
  };

  const selectHero = (i: number) =>
    patch((s) => ({ heroSlide: i, activeFridge: i < s.fridges.length ? i : s.activeFridge }));

  const onHeroSwipeStart = (e: React.TouchEvent) => {
    heroTouchX.current = e.touches[0].clientX;
  };
  const onHeroSwipeEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - heroTouchX.current;
    patch((s) => {
      const max = s.fridges.length;
      let next = s.heroSlide;
      if (dx < -40) next = Math.min(max, s.heroSlide + 1);
      else if (dx > 40) next = Math.max(0, s.heroSlide - 1);
      return { heroSlide: next, activeFridge: next < s.fridges.length ? next : s.activeFridge };
    });
  };

  const onNewFridgeNameChange = (value: string) => patch({ newFridgeName: value });
  const addFridge = () => {
    const name = state.newFridgeName.trim() || "New Fridge";
    patch((s) => {
      const fridges = [...s.fridges, { id: "f" + Date.now(), name, sections: [] }];
      return { fridges, newFridgeName: "", heroSlide: fridges.length - 1, activeFridge: fridges.length - 1 };
    });
  };
  const onNewFridgeNameKeyDown = (key: string) => {
    if (key === "Enter") addFridge();
  };

  const openProfile = () => patch({ showProfilePanel: true });
  const closeProfile = () => patch({ showProfilePanel: false });
  const selectFridgeFromProfile = (i: number) =>
    patch({ activeFridge: i, heroSlide: i, showProfilePanel: false, screen: "home" });

  const openStylePicker = (i: number) => patch({ stylingFridgeIndex: i, screen: "fridgeStyle" });
  const closeStylePicker = () => patch({ screen: "home" });
  const selectFridgeStyle = (key: FridgeStyleKey) =>
    patch((s) => ({
      fridges: s.fridges.map((f, i) => (i === s.stylingFridgeIndex ? { ...f, style: key } : f)),
      screen: "home",
    }));

  const hoverAgent = (id: string) => patch({ hoveredAgent: id });
  const clearHoverAgent = () => patch({ hoveredAgent: null });

  const openChat = () => patch({ screen: "chat" });
  const openSearch = () => patch({ screen: "search", searchQuery: "" });

  const ensureShoppingSeed = () => {
    patch((s) => {
      if (s.shoppingSeeded) return {};
      const lowStock = s.fridges[s.activeFridge].sections
        .flatMap((sec) => sec.items)
        .filter((i) => /left|remaining/i.test(i.note));
      const seeded: ShoppingItem[] = lowStock.map((i) => ({
        id: "ls-" + i.id,
        name: i.name,
        icon: i.icon,
        section: ICON_SECTION[i.icon] || "other",
        checked: false,
      }));
      return { shoppingList: seeded, shoppingSeeded: true };
    });
  };
  const openRecipesHub = () => {
    ensureShoppingSeed();
    patch({ screen: "foodHub", foodSubtab: "recipes" });
  };
  const openShoppingHub = () => {
    ensureShoppingSeed();
    patch({ screen: "foodHub", foodSubtab: "shopping" });
  };
  const openGuardianHub = () => patch({ screen: "guardian" });
  const openOrganizerHub = () => patch({ screen: "organizer" });
  const openShopkeeperHub = () => {
    ensureShoppingSeed();
    patch({ screen: "shopkeeper" });
  };
  const selectRecipesTab = () => patch({ foodSubtab: "recipes" });
  const selectShoppingTab = () => patch({ foodSubtab: "shopping" });

  const onSwipeStart = (e: React.TouchEvent) => {
    foodSwipeX.current = e.touches[0].clientX;
  };
  const onSwipeEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - foodSwipeX.current;
    if (dx < -40) patch({ foodSubtab: "shopping" });
    else if (dx > 40) patch({ foodSubtab: "recipes" });
  };

  const openRecipeDetail = (id: string) => patch({ screen: "recipeDetail", selectedRecipeId: id });
  const closeRecipeDetail = () => patch({ screen: "foodHub" });

  const onNewShoppingChange = (value: string) => patch({ newShoppingText: value });
  const addShoppingItem = () => {
    const name = state.newShoppingText.trim();
    if (!name) return;
    const entry: ShoppingItem = { id: "sh-" + Date.now(), name, icon: null, section: "other", checked: false };
    patch((s) => ({ shoppingList: [...s.shoppingList, entry], newShoppingText: "" }));
  };
  const onNewShoppingKeyDown = (key: string) => {
    if (key === "Enter") addShoppingItem();
  };
  const toggleShoppingItem = (id: string) =>
    patch((s) => ({ shoppingList: s.shoppingList.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)) }));
  const removeShoppingItem = (id: string) =>
    patch((s) => ({ shoppingList: s.shoppingList.filter((i) => i.id !== id) }));
  const clearBought = () => patch((s) => ({ shoppingList: s.shoppingList.filter((i) => !i.checked) }));

  const addMissingToShopping = () => {
    patch((s) => {
      const recipe = RECIPES.find((r) => r.id === s.selectedRecipeId);
      if (!recipe) return {};
      const allItems = s.fridges[s.activeFridge].sections.flatMap((sec) => sec.items);
      const missing = recipe.ingredients.filter((ing) => !allItems.some((i) => i.icon === ing.icon));
      const existingIcons = new Set(s.shoppingList.map((i) => i.icon));
      const additions: ShoppingItem[] = missing
        .filter((ing) => !existingIcons.has(ing.icon))
        .map((ing) => ({
          id: "rc-" + ing.icon + "-" + Date.now(),
          name: ing.name,
          icon: ing.icon,
          section: ICON_SECTION[ing.icon] || "other",
          checked: false,
        }));
      return { shoppingList: [...s.shoppingList, ...additions] };
    });
  };

  const addPredictedToShopping = (name: string, icon: string) => {
    patch((s) => {
      if (s.shoppingList.some((i) => !i.checked && i.name.toLowerCase() === name.toLowerCase())) return {};
      const entry: ShoppingItem = {
        id: "pr-" + icon + "-" + Date.now(),
        name,
        icon,
        section: ICON_SECTION[icon] || "other",
        checked: false,
      };
      return { shoppingList: [...s.shoppingList, entry] };
    });
  };

  const cookRecipe = () => {
    patch((s) => {
      const recipe = RECIPES.find((r) => r.id === s.selectedRecipeId);
      if (!recipe) return {};
      let sections = s.fridges[s.activeFridge].sections;
      recipe.ingredients.forEach((ing) => {
        for (const sec of sections) {
          const match = sec.items.find((i) => i.icon === ing.icon);
          if (match) {
            sections = sections.map((sc) =>
              sc.id === sec.id ? { ...sc, items: sc.items.filter((i) => i.id !== match.id) } : sc
            );
            break;
          }
        }
      });
      return {
        fridges: s.fridges.map((f, i) => (i === s.activeFridge ? { ...f, sections } : f)),
        screen: "foodHub",
      };
    });
  };

  const onSearchChange = (value: string) => patch({ searchQuery: value });

  const onDraftChange = (value: string) => patch({ chatDraft: value });
  const clearChat = () =>
    patch({
      chatMessages: [{ id: "m0", from: "bot", text: "Hi, I'm Guardian! Ask me anything about what's in your fridge." }],
      chatDraft: "",
      isTyping: false,
    });
  const sendChat = (text: string) => {
    const trimmed = (text || "").trim();
    if (!trimmed) return;
    const userMsg: ChatMessage = { id: "u" + Date.now(), from: "user", text: trimmed };
    patch((s) => ({ chatMessages: [...s.chatMessages, userMsg], chatDraft: "", isTyping: true }));
    setTimeout(() => {
      const reply: ChatMessage = { id: "b" + Date.now(), from: "bot", text: chatBotReply(trimmed) };
      patch((s) => ({ chatMessages: [...s.chatMessages, reply], isTyping: false }));
    }, 900);
  };
  const sendMessage = () => sendChat(state.chatDraft);
  const onChatKeyDown = (key: string) => {
    if (key === "Enter") sendMessage();
  };
  const askQuick = (label: string) => sendChat(label);

  const goHome = () =>
    patch({
      screen: "home",
      selectedItemId: null,
      addStep: 0,
      scanMethod: null,
      detected: [],
      manualName: "",
      manualSectionId: "",
      manualDays: "7",
      manualNote: "",
    });
  const goTab = (screen: Screen) => patch({ screen });
  const openAdd = () =>
    patch((s) => ({
      screen: "add",
      addStep: 0,
      scanMethod: null,
      detected: [],
      manualName: "",
      manualSectionId: s.fridges[s.activeFridge].sections[0]?.id || "",
      manualDays: "7",
      manualNote: "",
    }));
  const selectItem = (id: string) => patch({ screen: "itemDetail", selectedItemId: id });

  const recordUsage = (s: ThatFridgeState, name: string, icon: string): UsageHistoryEntry[] => {
    const key = name.trim().toLowerCase();
    if (!key) return s.usageHistory;
    const existing = s.usageHistory.find((h) => h.key === key);
    if (existing) {
      return s.usageHistory.map((h) => (h.key === key ? { ...h, count: h.count + 1, lastAt: Date.now() } : h));
    }
    return [...s.usageHistory, { key, name, icon, count: 1, lastAt: Date.now() }];
  };

  const removeItem = (id: string) => {
    patch((s) => ({
      fridges: s.fridges.map((f, i) =>
        i === s.activeFridge ? { ...f, sections: f.sections.map((sec) => ({ ...sec, items: sec.items.filter((it) => it.id !== id) })) } : f
      ),
      screen: "home",
      selectedItemId: null,
    }));
  };
  const markUsed = () => {
    if (!state.selectedItemId) return;
    const found = findItem(state, state.selectedItemId);
    if (found) patch((s) => ({ usageHistory: recordUsage(s, found.item.name, found.item.icon) }));
    removeItem(state.selectedItemId);
  };
  const discardItem = () => {
    if (state.selectedItemId) removeItem(state.selectedItemId);
  };

  const chooseMethod = (method: ScanMethod) => {
    if (method === "manual") {
      patch((s) => ({
        scanMethod: method,
        addStep: 3,
        manualName: "",
        manualSectionId: s.fridges[s.activeFridge].sections[0]?.id || "",
        manualDays: "7",
        manualNote: "",
      }));
      return;
    }
    const detected: DetectedItem[] = [
      { id: "nd1", name: method === "barcode" ? "Scanned item" : "Orange juice", icon: "milk", section: "dairy", checked: true },
      { id: "nd2", name: "Bell peppers", icon: "carrot", section: "produce", checked: true },
      { id: "nd3", name: "Sour cream", icon: "yogurt", section: "dairy", checked: true },
    ];
    patch({ scanMethod: method, addStep: 1 });
    setTimeout(() => patch({ addStep: 2, detected }), 1300);
  };
  const toggleDetected = (id: string) =>
    patch((s) => ({ detected: s.detected.map((d) => (d.id === id ? { ...d, checked: !d.checked } : d)) }));

  const onManualNameChange = (value: string) => patch({ manualName: value });
  const onManualSectionChange = (value: string) => patch({ manualSectionId: value });
  const onManualDaysChange = (value: string) => patch({ manualDays: value });
  const onManualNoteChange = (value: string) => patch({ manualNote: value });
  const confirmManualAdd = () => {
    const name = state.manualName.trim();
    if (!name) return;
    patch((s) => {
      const days = Math.max(0, parseInt(s.manualDays, 10) || 0);
      const fridge = s.fridges[s.activeFridge];
      const sectionId = s.manualSectionId || fridge.sections[0]?.id;
      const newItem = {
        id: "man-" + Date.now(),
        name,
        icon: (sectionId && DEFAULT_ICON_BY_SECTION[sectionId]) || "leftovers",
        freshness: 100,
        days,
        note: s.manualNote.trim() || "Added manually",
      };
      const sections = fridge.sections.some((sec) => sec.id === sectionId)
        ? fridge.sections.map((sec) => (sec.id === sectionId ? { ...sec, items: [...sec.items, newItem] } : sec))
        : [...fridge.sections, { id: "general", name: "General", items: [newItem] }];
      return {
        fridges: s.fridges.map((f, i) => (i === s.activeFridge ? { ...f, sections } : f)),
        screen: "home",
        addStep: 0,
        scanMethod: null,
        manualName: "",
        manualNote: "",
      };
    });
  };

  const confirmAdd = () => {
    patch((s) => {
      const toAdd = s.detected.filter((d) => d.checked);
      const sections = s.fridges[s.activeFridge].sections.map((sec) => {
        const added = toAdd
          .filter((d) => d.section === sec.id)
          .map((d) => ({ id: d.id + "-" + Date.now(), name: d.name, icon: d.icon, freshness: 100, days: 14, note: "Just added" }));
        return added.length ? { ...sec, items: [...sec.items, ...added] } : sec;
      });
      return {
        fridges: s.fridges.map((f, i) => (i === s.activeFridge ? { ...f, sections } : f)),
        screen: "home",
        addStep: 0,
        scanMethod: null,
        detected: [],
      };
    });
  };

  const actions = {
    selectHero,
    onHeroSwipeStart,
    onHeroSwipeEnd,
    onNewFridgeNameChange,
    onNewFridgeNameKeyDown,
    addFridge,
    openProfile,
    closeProfile,
    selectFridgeFromProfile,
    openStylePicker,
    closeStylePicker,
    selectFridgeStyle,
    hoverAgent,
    clearHoverAgent,
    openChat,
    openSearch,
    openRecipesHub,
    openShoppingHub,
    selectRecipesTab,
    selectShoppingTab,
    onSwipeStart,
    onSwipeEnd,
    openRecipeDetail,
    closeRecipeDetail,
    onNewShoppingChange,
    onNewShoppingKeyDown,
    addShoppingItem,
    toggleShoppingItem,
    removeShoppingItem,
    clearBought,
    addMissingToShopping,
    addPredictedToShopping,
    cookRecipe,
    onSearchChange,
    onDraftChange,
    onChatKeyDown,
    clearChat,
    sendMessage,
    askQuick,
    goHome,
    goTab,
    openAdd,
    selectItem,
    openGuardianHub,
    openOrganizerHub,
    openShopkeeperHub,
    markUsed,
    discardItem,
    chooseMethod,
    toggleDetected,
    onManualNameChange,
    onManualSectionChange,
    onManualDaysChange,
    onManualNoteChange,
    confirmManualAdd,
    confirmAdd,
    setSections,
    setItemLocation,
  };

  return { state, actions, chatScrollRef };
}

export type ThatFridgeActions = ReturnType<typeof useThatFridge>["actions"];
