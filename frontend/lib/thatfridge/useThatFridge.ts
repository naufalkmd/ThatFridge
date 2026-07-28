"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FOOD_TAB_ORDER, ICON_SECTION } from "./data";
import { fetchFridges, fetchRecipes } from "./api";
import { buildNotificationSeed, findItem } from "./selectors";
import type {
  ChatMessage,
  DetectedItem,
  FoodSubtab,
  Fridge,
  FridgeStyleKey,
  NotificationEvent,
  NotificationPrefs,
  Recipe,
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
  isLoading: boolean;
  fridges: Fridge[];
  recipes: Recipe[];
  activeFridge: number;
  heroSlide: number;
  newFridgeName: string;
  showProfilePanel: boolean;
  selectedItemId: string | null;
  isEditingItem: boolean;
  editName: string;
  editSectionId: string;
  editIcon: string;
  editFridgeIndex: number;
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
  undoMessage: string | null;
  notificationPrefs: NotificationPrefs;
  notificationEvents: NotificationEvent[];
  kitchenScope: "active" | "all";
  homeSortMode: "category" | "expiry" | "name";
}

function initialState(): ThatFridgeState {
  return {
    screen: "home",
    isLoading: true,
    fridges: [],
    recipes: [],
    activeFridge: 0,
    heroSlide: 0,
    newFridgeName: "",
    showProfilePanel: false,
    selectedItemId: null,
    isEditingItem: false,
    editName: "",
    editSectionId: "",
    editIcon: "",
    editFridgeIndex: 0,
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
    chatMessages: [{ id: "m0", from: "bot", text: "Hi! Ask me anything about what's in your fridge." }],
    chatDraft: "",
    isTyping: false,
    stylingFridgeIndex: 0,
    hoveredAgent: null,
    undoMessage: null,
    notificationPrefs: { expiryAlerts: true, lowStock: true, recipeTips: true, weeklyDigest: false },
    notificationEvents: [],
    kitchenScope: "all",
    homeSortMode: "category",
  };
}

const UNDO_WINDOW_MS = 5000;

type Patch = Partial<ThatFridgeState> | ((s: ThatFridgeState) => Partial<ThatFridgeState>);

export function useThatFridge() {
  const [state, setState] = useState<ThatFridgeState>(initialState);
  const heroTouchX = useRef(0);
  const foodSwipeX = useRef(0);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const patch = useCallback((updater: Patch) => {
    setState((prev) => ({ ...prev, ...(typeof updater === "function" ? updater(prev) : updater) }));
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchFridges(), fetchRecipes()]).then(([fridges, recipes]) => {
      if (cancelled) return;
      patch({ fridges, recipes, isLoading: false, notificationEvents: buildNotificationSeed(fridges) });
    });
    return () => {
      cancelled = true;
    };
  }, [patch]);

  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoActions = useRef<{ onCommit: () => void; onRestore: () => void } | null>(null);

  useEffect(() => {
    return () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    };
  }, []);

  const scheduleUndo = (message: string, onRestore: () => void, onCommit: () => void = () => {}) => {
    if (undoTimer.current) {
      clearTimeout(undoTimer.current);
      undoActions.current?.onCommit();
    }
    undoActions.current = { onCommit, onRestore };
    patch({ undoMessage: message });
    undoTimer.current = setTimeout(() => {
      undoActions.current?.onCommit();
      undoActions.current = null;
      undoTimer.current = null;
      patch({ undoMessage: null });
    }, UNDO_WINDOW_MS);
  };

  const undoLastRemoval = () => {
    if (!undoActions.current || !undoTimer.current) return;
    clearTimeout(undoTimer.current);
    undoActions.current.onRestore();
    undoActions.current = null;
    undoTimer.current = null;
    patch({ undoMessage: null });
  };

  const setSections = (sections: Section[]) => {
    patch((s) => ({ fridges: s.fridges.map((f, i) => (i === s.activeFridge ? { ...f, sections } : f)) }));
  };

  const setItemLocation = (id: string, location: StorageLocation) => {
    patch((s) => ({
      fridges: s.fridges.map((f) => ({
        ...f,
        sections: f.sections.map((sec) => ({ ...sec, items: sec.items.map((it) => (it.id === id ? { ...it, location } : it)) })),
      })),
    }));
  };

  const setKitchenScope = (scope: "active" | "all") => patch({ kitchenScope: scope });
  const setHomeSortMode = (mode: "category" | "expiry" | "name") => patch({ homeSortMode: mode });

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

  const openNotifications = () => patch({ screen: "notifications", showProfilePanel: false });
  const openNotificationHistory = () => patch({ screen: "notificationHistory" });
  const dismissNotificationWithUndo = (id: string) => {
    const event = state.notificationEvents.find((n) => n.id === id);
    if (!event || event.done) return;
    patch((s) => ({ notificationEvents: s.notificationEvents.map((n) => (n.id === id ? { ...n, done: true } : n)) }));
    scheduleUndo(`Cleared "${event.message}"`, () => {
      patch((s) => ({ notificationEvents: s.notificationEvents.map((n) => (n.id === id ? { ...n, done: false } : n)) }));
    });
  };
  const openAbout = () => patch({ screen: "about", showProfilePanel: false });
  const toggleNotificationPref = (key: keyof NotificationPrefs) =>
    patch((s) => ({ notificationPrefs: { ...s.notificationPrefs, [key]: !s.notificationPrefs[key] } }));

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
  const openKitchenTab = (tab: FoodSubtab) => {
    ensureShoppingSeed();
    patch({ screen: "foodHub", foodSubtab: tab });
  };
  const openRecipesHub = () => openKitchenTab("recipes");
  const openShoppingHub = () => openKitchenTab("shopping");
  const openGuardianTab = () => openKitchenTab("guardian");
  const openOrganizerTab = () => openKitchenTab("organizer");
  const selectFoodTab = (tab: FoodSubtab) => patch({ foodSubtab: tab });

  const onSwipeStart = (e: React.TouchEvent) => {
    foodSwipeX.current = e.touches[0].clientX;
  };
  const onSwipeEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - foodSwipeX.current;
    if (Math.abs(dx) <= 40) return;
    patch((s) => {
      const idx = FOOD_TAB_ORDER.indexOf(s.foodSubtab);
      const nextIdx = dx < 0 ? Math.min(FOOD_TAB_ORDER.length - 1, idx + 1) : Math.max(0, idx - 1);
      return { foodSubtab: FOOD_TAB_ORDER[nextIdx] };
    });
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

  const onSearchChange = (value: string) => patch({ searchQuery: value });

  const onDraftChange = (value: string) => patch({ chatDraft: value });
  const clearChat = () =>
    patch({
      chatMessages: [{ id: "m0", from: "bot", text: "Hi! Ask me anything about what's in your fridge." }],
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
      isEditingItem: false,
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
  const selectItem = (id: string) => patch({ screen: "itemDetail", selectedItemId: id, isEditingItem: false });

  const startEditItem = () => {
    if (!state.selectedItemId) return;
    const found = findItem(state, state.selectedItemId);
    if (!found) return;
    patch({
      isEditingItem: true,
      editName: found.item.name,
      editSectionId: found.section.id,
      editIcon: found.item.icon,
      editFridgeIndex: found.fridgeIndex,
    });
  };
  const cancelEditItem = () => patch({ isEditingItem: false });
  const onEditNameChange = (value: string) => patch({ editName: value });
  const onEditSectionChange = (value: string) => patch({ editSectionId: value });
  const onEditIconChange = (value: string) => patch({ editIcon: value });
  const confirmEditItem = () => {
    const id = state.selectedItemId;
    if (!id) return;
    const name = state.editName.trim();
    if (!name) return;
    patch((s) => {
      const found = findItem(s, id);
      if (!found) return {};
      const { item, section: fromSection, fridgeIndex } = found;
      const fridge = s.fridges[fridgeIndex];
      const toSectionId = s.editSectionId || fromSection.id;
      const updatedItem = { ...item, name, icon: s.editIcon || item.icon };

      const sections =
        toSectionId === fromSection.id
          ? fridge.sections.map((sec) =>
              sec.id === fromSection.id ? { ...sec, items: sec.items.map((it) => (it.id === id ? updatedItem : it)) } : sec
            )
          : fridge.sections.map((sec) => {
              if (sec.id === fromSection.id) return { ...sec, items: sec.items.filter((it) => it.id !== id) };
              if (sec.id === toSectionId) return { ...sec, items: [...sec.items, updatedItem] };
              return sec;
            });

      return {
        fridges: s.fridges.map((f, i) => (i === fridgeIndex ? { ...f, sections } : f)),
        isEditingItem: false,
      };
    });
  };

  const recordUsage = (s: ThatFridgeState, name: string, icon: string): UsageHistoryEntry[] => {
    const key = name.trim().toLowerCase();
    if (!key) return s.usageHistory;
    const existing = s.usageHistory.find((h) => h.key === key);
    if (existing) {
      return s.usageHistory.map((h) => (h.key === key ? { ...h, count: h.count + 1, lastAt: Date.now() } : h));
    }
    return [...s.usageHistory, { key, name, icon, count: 1, lastAt: Date.now() }];
  };

  const removeItemWithUndo = (id: string, message: string, onCommit?: () => void) => {
    const found = findItem(state, id);
    if (!found) return;
    const { item, section, fridgeIndex } = found;
    const itemIndex = section.items.findIndex((it) => it.id === id);

    patch((s) => ({
      fridges: s.fridges.map((f, i) =>
        i === fridgeIndex
          ? { ...f, sections: f.sections.map((sec) => (sec.id === section.id ? { ...sec, items: sec.items.filter((it) => it.id !== id) } : sec)) }
          : f
      ),
      screen: "home",
      selectedItemId: null,
      isEditingItem: false,
    }));

    scheduleUndo(message, () => {
      patch((s) => ({
        fridges: s.fridges.map((f, i) =>
          i === fridgeIndex
            ? {
                ...f,
                sections: f.sections.map((sec) =>
                  sec.id === section.id ? { ...sec, items: [...sec.items.slice(0, itemIndex), item, ...sec.items.slice(itemIndex)] } : sec
                ),
              }
            : f
        ),
      }));
    }, onCommit);
  };
  const markUsed = () => {
    if (!state.selectedItemId) return;
    const found = findItem(state, state.selectedItemId);
    if (!found) return;
    const { item } = found;
    removeItemWithUndo(state.selectedItemId, `Marked "${item.name}" as used`, () => {
      patch((s) => ({ usageHistory: recordUsage(s, item.name, item.icon) }));
    });
  };
  const discardItem = () => {
    if (!state.selectedItemId) return;
    const found = findItem(state, state.selectedItemId);
    if (!found) return;
    removeItemWithUndo(state.selectedItemId, `Removed "${found.item.name}"`);
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
    openNotifications,
    openNotificationHistory,
    dismissNotificationWithUndo,
    openAbout,
    toggleNotificationPref,
    openStylePicker,
    closeStylePicker,
    selectFridgeStyle,
    hoverAgent,
    clearHoverAgent,
    openChat,
    openSearch,
    openRecipesHub,
    openShoppingHub,
    openGuardianTab,
    openOrganizerTab,
    selectFoodTab,
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
    addPredictedToShopping,
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
    markUsed,
    discardItem,
    startEditItem,
    cancelEditItem,
    onEditNameChange,
    onEditSectionChange,
    onEditIconChange,
    confirmEditItem,
    undoLastRemoval,
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
    setKitchenScope,
    setHomeSortMode,
  };

  return { state, actions, chatScrollRef };
}

export type ThatFridgeActions = ReturnType<typeof useThatFridge>["actions"];
