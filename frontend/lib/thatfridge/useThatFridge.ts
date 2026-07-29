"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FOOD_TAB_ORDER, ICON_SECTION, guessIcon, guessLocation, suggestShelfLifeDays } from "./data";
import { fetchFridges, fetchRecipes } from "./api";
import { buildNotificationSeed, findItem, findSectionIdForGroup } from "./selectors";
import type {
  AuthMode,
  ChatMessage,
  ChatThread,
  CurrentUser,
  DetectedItem,
  FoodSubtab,
  Fridge,
  FridgeStyleKey,
  Item,
  NotificationEvent,
  NotificationPrefs,
  Recipe,
  Screen,
  ScanMethod,
  ShoppingItem,
  StorageLocation,
  UsageHistoryEntry,
} from "./types";
import { chatBotReply } from "./chat";

const DEFAULT_CHAT_MESSAGES: ChatMessage[] = [{ id: "m0", from: "bot", text: "Hi! Ask me anything about what's in your fridge." }];

function deriveThreadTitle(messages: ChatMessage[]): string {
  const firstUserMsg = messages.find((m) => m.from === "user")?.text.trim();
  if (!firstUserMsg) return "Conversation";
  return firstUserMsg.length > 40 ? firstUserMsg.slice(0, 40) + "…" : firstUserMsg;
}

function archiveCurrentThread(s: ThatFridgeState): ChatThread[] {
  if (s.chatMessages.length <= 1) return s.chatThreads;
  const archived: ChatThread = {
    id: "t" + Date.now(),
    title: deriveThreadTitle(s.chatMessages),
    messages: s.chatMessages,
    updatedAt: Date.now(),
  };
  return [archived, ...s.chatThreads];
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function defaultExpiryDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return toISODate(d);
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((target.getTime() - today.getTime()) / 86400000));
}

const DEFAULT_ICON_BY_SECTION: Record<string, string> = {
  dairy: "milk",
  produce: "carrot",
  protein: "meat",
  leftovers: "leftovers",
};

export interface ThatFridgeState {
  screen: Screen;
  lastMainScreen: "home" | "inventory";
  isLoading: boolean;
  isAuthenticated: boolean;
  currentUser: CurrentUser | null;
  authMode: AuthMode;
  authName: string;
  authEmail: string;
  authPassword: string;
  authConfirmPassword: string;
  authError: string | null;
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
  addFridgeIndex: number;
  scanMethod: ScanMethod | null;
  detected: DetectedItem[];
  manualName: string;
  manualSectionId: string;
  manualSectionAuto: boolean;
  manualIcon: string;
  manualIconAuto: boolean;
  manualLocation: StorageLocation;
  manualExpiryDate: string;
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
  chatThreads: ChatThread[];
  stylingFridgeIndex: number;
  undoMessage: string | null;
  notificationPrefs: NotificationPrefs;
  notificationEvents: NotificationEvent[];
  kitchenScope: "active" | "all";
  inventorySortMode: "category" | "expiry" | "name";
}

function initialState(): ThatFridgeState {
  return {
    screen: "home",
    lastMainScreen: "home",
    isLoading: false,
    isAuthenticated: false,
    currentUser: null,
    authMode: "login",
    authName: "",
    authEmail: "",
    authPassword: "",
    authConfirmPassword: "",
    authError: null,
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
    addFridgeIndex: 0,
    scanMethod: null,
    detected: [],
    manualName: "",
    manualSectionId: "",
    manualSectionAuto: true,
    manualIcon: "leftovers",
    manualIconAuto: true,
    manualLocation: "fridge",
    manualExpiryDate: defaultExpiryDate(),
    manualNote: "",
    usageHistory: [],
    searchQuery: "",
    foodSubtab: "recipes",
    selectedRecipeId: null,
    newShoppingText: "",
    shoppingList: [],
    shoppingSeeded: false,
    chatMessages: DEFAULT_CHAT_MESSAGES,
    chatDraft: "",
    isTyping: false,
    chatThreads: [],
    stylingFridgeIndex: 0,
    undoMessage: null,
    notificationPrefs: { expiryAlerts: true, lowStock: true, recipeTips: true, weeklyDigest: false },
    notificationEvents: [],
    kitchenScope: "all",
    inventorySortMode: "category",
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

  const setAuthMode = (mode: AuthMode) => patch({ authMode: mode, authError: null });
  const onAuthNameChange = (value: string) => patch({ authName: value });
  const onAuthEmailChange = (value: string) => patch({ authEmail: value });
  const onAuthPasswordChange = (value: string) => patch({ authPassword: value });
  const onAuthConfirmPasswordChange = (value: string) => patch({ authConfirmPassword: value });
  const submitAuth = () => {
    patch((s) => {
      const email = s.authEmail.trim();
      const password = s.authPassword;
      if (!email || !password) return { authError: "Enter your email and password." };
      if (s.authMode === "signup") {
        const name = s.authName.trim();
        if (!name) return { authError: "Enter your name." };
        if (password !== s.authConfirmPassword) return { authError: "Passwords don't match." };
        return {
          isAuthenticated: true,
          isLoading: true,
          currentUser: { name, email },
          authError: null,
          authPassword: "",
          authConfirmPassword: "",
        };
      }
      const derivedName = email
        .split("@")[0]
        .replace(/[._-]+/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim();
      return {
        isAuthenticated: true,
        isLoading: true,
        currentUser: { name: derivedName || "Friend", email },
        authError: null,
        authPassword: "",
      };
    });
  };
  const signOut = () =>
    patch({
      isAuthenticated: false,
      currentUser: null,
      showProfilePanel: false,
      screen: "home",
      lastMainScreen: "home",
      authMode: "login",
      authName: "",
      authEmail: "",
      authPassword: "",
      authConfirmPassword: "",
      authError: null,
      fridges: [],
      recipes: [],
    });

  useEffect(() => {
    if (!state.isAuthenticated) return;
    let cancelled = false;
    Promise.all([fetchFridges(), fetchRecipes()]).then(([fridges, recipes]) => {
      if (cancelled) return;
      patch({ fridges, recipes, isLoading: false, notificationEvents: buildNotificationSeed(fridges) });
    });
    return () => {
      cancelled = true;
    };
  }, [state.isAuthenticated, patch]);

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

  const setItemLocation = (id: string, location: StorageLocation) => {
    patch((s) => ({
      fridges: s.fridges.map((f) => ({
        ...f,
        sections: f.sections.map((sec) => ({ ...sec, items: sec.items.map((it) => (it.id === id ? { ...it, location } : it)) })),
      })),
    }));
  };

  const selectFridgeScope = (choice: number | "all") =>
    patch(choice === "all" ? { kitchenScope: "all" } : { kitchenScope: "active", activeFridge: choice, heroSlide: choice });
  const setInventorySortMode = (mode: "category" | "expiry" | "name") => patch({ inventorySortMode: mode });

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
    patch({ kitchenScope: "active", activeFridge: i, heroSlide: i, showProfilePanel: false, screen: "home" });

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

  const openAIDataSettings = () => patch({ screen: "aiData", showProfilePanel: false });
  const deleteChatThread = (id: string) => patch((s) => ({ chatThreads: s.chatThreads.filter((t) => t.id !== id) }));
  const clearAllChatData = () =>
    patch({
      chatThreads: [],
      chatMessages: DEFAULT_CHAT_MESSAGES,
      chatDraft: "",
      isTyping: false,
    });
  const deleteUsageHistoryEntry = (key: string) => patch((s) => ({ usageHistory: s.usageHistory.filter((h) => h.key !== key) }));
  const clearUsageHistory = () => patch({ usageHistory: [] });

  const openStylePicker = (i: number) => patch({ stylingFridgeIndex: i, screen: "fridgeStyle" });
  const closeStylePicker = () => patch({ screen: "home" });
  const selectFridgeStyle = (key: FridgeStyleKey) =>
    patch((s) => ({
      fridges: s.fridges.map((f, i) => (i === s.stylingFridgeIndex ? { ...f, style: key } : f)),
      screen: "home",
    }));

  const renameFridge = (name: string) =>
    patch((s) => ({ fridges: s.fridges.map((f, i) => (i === s.stylingFridgeIndex ? { ...f, name } : f)) }));
  const renameFridgeBlur = () =>
    patch((s) => ({
      fridges: s.fridges.map((f, i) => (i === s.stylingFridgeIndex && !f.name.trim() ? { ...f, name: "My Fridge" } : f)),
    }));
  const deleteFridge = (index: number) =>
    patch((s) => {
      if (s.fridges.length <= 1) return {};
      const fridges = s.fridges.filter((_, i) => i !== index);
      let activeFridge = s.activeFridge;
      if (index < s.activeFridge) activeFridge -= 1;
      else if (index === s.activeFridge) activeFridge = Math.max(0, index - 1);
      activeFridge = Math.min(activeFridge, fridges.length - 1);
      return { fridges, activeFridge, heroSlide: activeFridge, screen: "home" };
    });

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
  const openFoodHubTab = (tab: FoodSubtab) => {
    ensureShoppingSeed();
    patch({ screen: "foodHub", foodSubtab: tab });
  };
  const openRecipesHub = () => openFoodHubTab("recipes");
  const openShoppingHub = () => openFoodHubTab("shopping");
  const openGuardianTab = () => openFoodHubTab("guardian");
  const openOrganizerTab = () => openFoodHubTab("organizer");
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
  const startNewChat = () =>
    patch((s) => ({
      chatThreads: archiveCurrentThread(s),
      chatMessages: DEFAULT_CHAT_MESSAGES,
      chatDraft: "",
      isTyping: false,
    }));
  const openChatHistory = () => patch({ screen: "chatHistory" });
  const closeChatHistory = () => patch({ screen: "chat" });
  const restoreChatThread = (id: string) =>
    patch((s) => {
      const thread = s.chatThreads.find((t) => t.id === id);
      if (!thread) return { screen: "chat" };
      const remaining = s.chatThreads.filter((t) => t.id !== id);
      return {
        chatThreads: archiveCurrentThread({ ...s, chatThreads: remaining }),
        chatMessages: thread.messages,
        chatDraft: "",
        isTyping: false,
        screen: "chat",
      };
    });
  const sendChat = (text: string, attachmentName?: string) => {
    const trimmed = (text || "").trim();
    if (!trimmed && !attachmentName) return;
    const userMsg: ChatMessage = { id: "u" + Date.now(), from: "user", text: trimmed, attachmentName };
    patch((s) => ({ chatMessages: [...s.chatMessages, userMsg], chatDraft: "", isTyping: true }));
    setTimeout(() => {
      const replyText = trimmed ? chatBotReply(trimmed) : `Thanks for sharing "${attachmentName}" — I'll take a look!`;
      const reply: ChatMessage = { id: "b" + Date.now(), from: "bot", text: replyText };
      patch((s) => ({ chatMessages: [...s.chatMessages, reply], isTyping: false }));
    }, 900);
  };
  const sendMessage = (attachmentName?: string) => sendChat(state.chatDraft, attachmentName);
  const onChatKeyDown = (key: string) => {
    if (key === "Enter") sendMessage();
  };
  const askQuick = (label: string) => sendChat(label);

  const goHome = () =>
    patch((s) => ({
      screen: s.lastMainScreen,
      selectedItemId: null,
      isEditingItem: false,
      addStep: 0,
      scanMethod: null,
      detected: [],
      manualName: "",
      manualSectionId: "",
      manualExpiryDate: defaultExpiryDate(),
      manualNote: "",
    }));
  const goTab = (screen: Screen) =>
    patch((s) => ({
      screen,
      lastMainScreen: screen === "home" || screen === "inventory" ? screen : s.lastMainScreen,
    }));
  const openAdd = () =>
    patch((s) => ({
      screen: "add",
      addStep: s.fridges.length > 1 ? -1 : 0,
      addFridgeIndex: s.activeFridge,
      scanMethod: null,
      detected: [],
      manualName: "",
      manualSectionId: s.fridges[s.activeFridge].sections[0]?.id || "",
      manualSectionAuto: true,
      manualIcon: "leftovers",
      manualIconAuto: true,
      manualLocation: "fridge",
      manualExpiryDate: defaultExpiryDate(),
      manualNote: "",
    }));
  const selectAddFridge = (index: number) =>
    patch((s) => ({
      addFridgeIndex: index,
      addStep: 0,
      manualSectionId: s.fridges[index].sections[0]?.id || "",
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

  const adjustItemQty = (id: string, delta: number) => {
    patch((s) => {
      const found = findItem(s, id);
      if (!found) return {};
      const { section, fridgeIndex } = found;
      return {
        fridges: s.fridges.map((f, i) =>
          i === fridgeIndex
            ? {
                ...f,
                sections: f.sections.map((sec) =>
                  sec.id === section.id ? { ...sec, items: sec.items.map((it) => (it.id === id ? { ...it, qty: Math.max(0, it.qty + delta) } : it)) } : sec
                ),
              }
            : f
        ),
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
      screen: s.lastMainScreen,
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
    const id = state.selectedItemId;
    if (!id) return;
    patch((s) => {
      const found = findItem(s, id);
      if (!found || found.item.opened) return {};
      const { item, section, fridgeIndex } = found;
      const newDays = Math.min(item.days, 3);
      const newFreshness = item.days > 0 ? Math.max(10, Math.round(item.freshness * (newDays / item.days))) : item.freshness;
      const updated: Item = { ...item, opened: true, days: newDays, freshness: newFreshness };
      return {
        fridges: s.fridges.map((f, i) =>
          i === fridgeIndex
            ? { ...f, sections: f.sections.map((sec) => (sec.id === section.id ? { ...sec, items: sec.items.map((it) => (it.id === id ? updated : it)) } : sec)) }
            : f
        ),
      };
    });
  };
  const discardItem = () => {
    if (!state.selectedItemId) return;
    const found = findItem(state, state.selectedItemId);
    if (!found) return;
    const { item } = found;
    removeItemWithUndo(state.selectedItemId, `Removed "${item.name}"`, () => {
      patch((s) => ({ usageHistory: recordUsage(s, item.name, item.icon) }));
    });
  };

  const chooseMethod = (method: ScanMethod) => {
    if (method === "manual") {
      patch((s) => ({
        scanMethod: method,
        addStep: 3,
        manualName: "",
        manualSectionId: s.fridges[s.addFridgeIndex].sections[0]?.id || "",
        manualSectionAuto: true,
        manualIcon: "leftovers",
        manualIconAuto: true,
        manualLocation: "fridge",
        manualExpiryDate: defaultExpiryDate(),
        manualNote: "",
      }));
      return;
    }
    const detectedTemplates: { name: string; icon: string; group: string }[] = [
      { name: method === "barcode" ? "Scanned item" : "Orange juice", icon: "milk", group: "dairy" },
      { name: "Bell peppers", icon: "carrot", group: "produce" },
      { name: "Sour cream", icon: "yogurt", group: "dairy" },
    ];
    patch({ scanMethod: method, addStep: 1 });
    setTimeout(() => {
      patch((s) => {
        const fridge = s.fridges[s.addFridgeIndex];
        const detected: DetectedItem[] = detectedTemplates.map((t, i) => ({
          id: "nd" + (i + 1),
          name: t.name,
          icon: t.icon,
          section: findSectionIdForGroup(fridge.sections, t.group) || fridge.sections[0]?.id || "",
          checked: true,
          qty: 1,
          expiryDate: "",
          location: "fridge" as StorageLocation,
        }));
        return { addStep: 2, detected };
      });
    }, 1300);
  };
  const toggleDetected = (id: string) =>
    patch((s) => ({ detected: s.detected.map((d) => (d.id === id ? { ...d, checked: !d.checked } : d)) }));
  const onDetectedSectionChange = (id: string, sectionId: string) =>
    patch((s) => ({ detected: s.detected.map((d) => (d.id === id ? { ...d, section: sectionId } : d)) }));
  const adjustDetectedQty = (id: string, delta: number) =>
    patch((s) => ({ detected: s.detected.map((d) => (d.id === id ? { ...d, qty: Math.max(1, d.qty + delta) } : d)) }));
  const onDetectedExpiryChange = (id: string, value: string) =>
    patch((s) => ({ detected: s.detected.map((d) => (d.id === id ? { ...d, expiryDate: value } : d)) }));
  const onDetectedLocationChange = (id: string, location: StorageLocation) =>
    patch((s) => ({ detected: s.detected.map((d) => (d.id === id ? { ...d, location } : d)) }));
  const suggestDetectedDetails = (id: string) =>
    patch((s) => {
      const item = s.detected.find((d) => d.id === id);
      if (!item) return {};
      const target = new Date();
      target.setDate(target.getDate() + suggestShelfLifeDays(item.icon));
      const expiryDate = toISODate(target);
      const location = guessLocation(item.name);
      return { detected: s.detected.map((d) => (d.id === id ? { ...d, expiryDate, location } : d)) };
    });

  const onManualNameChange = (value: string) =>
    patch((s) => {
      const icon = guessIcon(value);
      const fridge = s.fridges[s.addFridgeIndex];
      const group = icon ? ICON_SECTION[icon] : null;
      const guessedSectionId = group && fridge ? findSectionIdForGroup(fridge.sections, group) : null;
      return {
        manualName: value,
        ...(s.manualIconAuto && icon ? { manualIcon: icon } : {}),
        ...(s.manualSectionAuto && guessedSectionId ? { manualSectionId: guessedSectionId } : {}),
      };
    });
  const onManualSectionChange = (value: string) => patch({ manualSectionId: value, manualSectionAuto: false });
  const onManualIconChange = (value: string) => patch({ manualIcon: value, manualIconAuto: false });
  const onManualExpiryDateChange = (value: string) => patch({ manualExpiryDate: value });
  const onManualLocationChange = (location: StorageLocation) => patch({ manualLocation: location });
  const suggestManualDetails = () =>
    patch((s) => {
      const target = new Date();
      target.setDate(target.getDate() + suggestShelfLifeDays(s.manualIcon));
      return { manualExpiryDate: toISODate(target), manualLocation: guessLocation(s.manualName) };
    });
  const onManualNoteChange = (value: string) => patch({ manualNote: value });
  const confirmManualAdd = () => {
    const name = state.manualName.trim();
    if (!name) return;
    patch((s) => {
      const days = daysUntil(s.manualExpiryDate);
      const fridge = s.fridges[s.addFridgeIndex];
      const sectionId = s.manualSectionId || fridge.sections[0]?.id;
      const newItem = {
        id: "man-" + Date.now(),
        name,
        icon: s.manualIcon || (sectionId && DEFAULT_ICON_BY_SECTION[sectionId]) || "leftovers",
        freshness: 100,
        days,
        note: s.manualNote.trim() || "Added manually",
        qty: 1,
        location: s.manualLocation,
      };
      const sections = fridge.sections.some((sec) => sec.id === sectionId)
        ? fridge.sections.map((sec) => (sec.id === sectionId ? { ...sec, items: [...sec.items, newItem] } : sec))
        : [...fridge.sections, { id: "general", name: "General", items: [newItem] }];
      return {
        fridges: s.fridges.map((f, i) => (i === s.addFridgeIndex ? { ...f, sections } : f)),
        screen: s.lastMainScreen,
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
      const sections = s.fridges[s.addFridgeIndex].sections.map((sec) => {
        const added = toAdd
          .filter((d) => d.section === sec.id)
          .map((d) => {
            const days = d.expiryDate ? daysUntil(d.expiryDate) : suggestShelfLifeDays(d.icon);
            return { id: d.id + "-" + Date.now(), name: d.name, icon: d.icon, freshness: 100, days, note: "Just added", qty: d.qty, location: d.location };
          });
        return added.length ? { ...sec, items: [...sec.items, ...added] } : sec;
      });
      return {
        fridges: s.fridges.map((f, i) => (i === s.addFridgeIndex ? { ...f, sections } : f)),
        screen: s.lastMainScreen,
        addStep: 0,
        scanMethod: null,
        detected: [],
      };
    });
  };

  const actions = {
    setAuthMode,
    onAuthNameChange,
    onAuthEmailChange,
    onAuthPasswordChange,
    onAuthConfirmPasswordChange,
    submitAuth,
    signOut,
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
    openAIDataSettings,
    deleteChatThread,
    clearAllChatData,
    deleteUsageHistoryEntry,
    clearUsageHistory,
    openStylePicker,
    closeStylePicker,
    selectFridgeStyle,
    renameFridge,
    renameFridgeBlur,
    deleteFridge,
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
    startNewChat,
    openChatHistory,
    closeChatHistory,
    restoreChatThread,
    sendMessage,
    askQuick,
    goHome,
    goTab,
    openAdd,
    selectAddFridge,
    selectItem,
    adjustItemQty,
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
    onDetectedSectionChange,
    adjustDetectedQty,
    onDetectedExpiryChange,
    onDetectedLocationChange,
    suggestDetectedDetails,
    onManualNameChange,
    onManualSectionChange,
    onManualIconChange,
    onManualExpiryDateChange,
    onManualLocationChange,
    suggestManualDetails,
    onManualNoteChange,
    confirmManualAdd,
    confirmAdd,
    setItemLocation,
    selectFridgeScope,
    setInventorySortMode,
  };

  return { state, actions, chatScrollRef };
}

export type ThatFridgeActions = ReturnType<typeof useThatFridge>["actions"];
