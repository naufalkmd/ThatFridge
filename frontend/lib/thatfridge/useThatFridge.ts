"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FOOD_ICON_KEYS, FOOD_TAB_ORDER, ICON_SECTION, guessIcon, guessLocation, suggestShelfLifeDays } from "./data";
import {
  createFridge,
  createItem,
  createSection,
  createShoppingItem,
  deleteFridge as apiDeleteFridge,
  deleteItem,
  deleteShoppingItem,
  fetchChatHistory,
  fetchFridges,
  fetchMe,
  fetchNotificationPrefs,
  fetchRecipes,
  fetchShoppingItems,
  login,
  logout,
  register,
  scanBarcode,
  scanExpiryPhoto,
  sendChatMessage,
  type ChatAgentName,
  updateFridge,
  updateItem,
  updateNotificationPrefs,
  updateShoppingItem,
} from "./api";
import { ApiError, clearToken, getToken } from "./apiClient";
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
const DEFAULT_CHAT_MESSAGES: ChatMessage[] = [{ id: "m0", from: "bot", text: "Hi! Ask me anything about what's in your fridge." }];

function buildInventorySummary(fridge: Fridge | undefined): string | undefined {
  if (!fridge) return undefined;
  const lines = fridge.sections.flatMap((section) =>
    section.items.map((item) => `${item.name} — qty ${item.qty}, ${item.location ?? "fridge"}, use within ${item.days} day${item.days === 1 ? "" : "s"}`)
  );
  return lines.length ? lines.join("\n") : "Fridge is currently empty.";
}

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
  // Use local calendar date components, not toISOString() (which converts to UTC first and
  // shifts the date backward by a day for timezones ahead of UTC during early local hours).
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

function describeError(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
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
  barcodeInput: string;
  barcodeLoading: boolean;
  barcodeError: string | null;
  expiryPhotoLoading: boolean;
  expiryPhotoError: string | null;
  expiryScanNote: string | null;
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
  syncError: string | null;
  notificationPrefs: NotificationPrefs;
  notificationEvents: NotificationEvent[];
  kitchenScope: "active" | "all";
  inventorySortMode: "category" | "expiry" | "name";
  agentInsights: Partial<Record<ChatAgentName, string>>;
  agentInsightLoading: ChatAgentName | null;
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
    barcodeInput: "",
    barcodeLoading: false,
    barcodeError: null,
    expiryPhotoLoading: false,
    expiryPhotoError: null,
    expiryScanNote: null,
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
    syncError: null,
    notificationPrefs: { expiryAlerts: true, lowStock: true, recipeTips: true, weeklyDigest: false },
    notificationEvents: [],
    kitchenScope: "all",
    inventorySortMode: "category",
    agentInsights: {},
    agentInsightLoading: null,
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
  const submitAuth = async () => {
    const email = state.authEmail.trim();
    const password = state.authPassword;
    if (!email || !password) return patch({ authError: "Enter your email and password." });

    if (state.authMode === "signup") {
      const name = state.authName.trim();
      if (!name) return patch({ authError: "Enter your name." });
      if (password !== state.authConfirmPassword) return patch({ authError: "Passwords don't match." });
      try {
        const { user } = await register(name, email, password);
        patch({
          isAuthenticated: true,
          isLoading: true,
          currentUser: user,
          authError: null,
          authPassword: "",
          authConfirmPassword: "",
        });
      } catch (err) {
        patch({ authError: describeError(err, "Couldn't create your account.") });
      }
      return;
    }

    try {
      const { user } = await login(email, password);
      patch({ isAuthenticated: true, isLoading: true, currentUser: user, authError: null, authPassword: "" });
    } catch (err) {
      patch({ authError: describeError(err, "Couldn't log you in.") });
    }
  };
  const signOut = async () => {
    try {
      await logout();
    } catch {
      // best-effort — the session is over locally regardless of whether the server call succeeds
    }
    clearToken();
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
      shoppingList: [],
      shoppingSeeded: false,
    });
  };

  // Restore a session from a stored token so a page refresh doesn't bounce to the login screen.
  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    patch({ isLoading: true });
    fetchMe()
      .then((user) => {
        if (cancelled) return;
        patch({ isAuthenticated: true, currentUser: user });
      })
      .catch(() => {
        if (cancelled) return;
        clearToken();
        patch({ isLoading: false });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!state.isAuthenticated) return;
    let cancelled = false;
    Promise.all([fetchFridges(), fetchRecipes(), fetchShoppingItems(), fetchNotificationPrefs(), fetchChatHistory()]).then(
      ([fridges, recipes, shoppingList, notificationPrefs, chatHistory]) => {
        if (cancelled) return;
        const restoredChatMessages: ChatMessage[] = chatHistory.flatMap((row) => [
          { id: `u${row.id}`, from: "user" as const, text: row.user_message },
          ...(row.agent_response ? [{ id: `b${row.id}`, from: "bot" as const, text: row.agent_response }] : []),
        ]);
        patch({
          fridges,
          recipes,
          shoppingList,
          shoppingSeeded: true,
          notificationPrefs,
          isLoading: false,
          notificationEvents: buildNotificationSeed(fridges),
          ...(restoredChatMessages.length ? { chatMessages: restoredChatMessages } : {}),
        });
      }
    ).catch((err) => {
      if (cancelled) return;
      patch({ isLoading: false, syncError: describeError(err, "Couldn't load your fridge data.") });
    });
    return () => {
      cancelled = true;
    };
  }, [state.isAuthenticated, patch]);

  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoActions = useRef<{ onCommit: () => void; onRestore: () => void } | null>(null);
  const qtyDebounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    return () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
      Object.values(qtyDebounceTimers.current).forEach(clearTimeout);
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

  const dismissSyncError = () => patch({ syncError: null });

  const setItemLocation = (id: string, location: StorageLocation) => {
    const prevLocation = findItem(state, id)?.item.location;
    patch((s) => ({
      fridges: s.fridges.map((f) => ({
        ...f,
        sections: f.sections.map((sec) => ({ ...sec, items: sec.items.map((it) => (it.id === id ? { ...it, location } : it)) })),
      })),
    }));
    updateItem(id, { location }).catch((err) => {
      patch((s) => ({
        fridges: s.fridges.map((f) => ({
          ...f,
          sections: f.sections.map((sec) => ({ ...sec, items: sec.items.map((it) => (it.id === id ? { ...it, location: prevLocation } : it)) })),
        })),
      }));
      patch({ syncError: describeError(err, "Couldn't update the item's location.") });
    });
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
  const addFridge = async () => {
    const name = state.newFridgeName.trim() || "New Fridge";
    patch({ newFridgeName: "" });
    try {
      const fridge = await createFridge(name);
      patch((s) => {
        const fridges = [...s.fridges, fridge];
        return { fridges, heroSlide: fridges.length - 1, activeFridge: fridges.length - 1 };
      });
    } catch (err) {
      patch({ syncError: describeError(err, "Couldn't create the fridge.") });
    }
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
  const toggleNotificationPref = (key: keyof NotificationPrefs) => {
    const prevValue = state.notificationPrefs[key];
    patch((s) => ({ notificationPrefs: { ...s.notificationPrefs, [key]: !s.notificationPrefs[key] } }));
    updateNotificationPrefs({ [key]: !prevValue }).catch((err) => {
      patch((s) => ({ notificationPrefs: { ...s.notificationPrefs, [key]: prevValue } }));
      patch({ syncError: describeError(err, "Couldn't save your notification settings.") });
    });
  };

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
  const selectFridgeStyle = (key: FridgeStyleKey) => {
    const index = state.stylingFridgeIndex;
    const fridge = state.fridges[index];
    const prevStyle = fridge?.style;
    patch((s) => ({
      fridges: s.fridges.map((f, i) => (i === index ? { ...f, style: key } : f)),
      screen: "home",
    }));
    if (!fridge) return;
    updateFridge(fridge.id, { style: key }).catch((err) => {
      patch((s) => ({ fridges: s.fridges.map((f, i) => (i === index ? { ...f, style: prevStyle } : f)) }));
      patch({ syncError: describeError(err, "Couldn't save the fridge style.") });
    });
  };

  const updateFridgePhoto = (photoUrl: string) => {
    const index = state.stylingFridgeIndex;
    const fridge = state.fridges[index];
    if (!fridge) return;
    const prevPhotoUrl = fridge.photoUrl;
    patch((s) => ({ fridges: s.fridges.map((f, i) => (i === index ? { ...f, style: "custom", photoUrl } : f)), screen: "home" }));
    updateFridge(fridge.id, { style: "custom", photo_url: photoUrl }).catch((err) => {
      patch((s) => ({ fridges: s.fridges.map((f, i) => (i === index ? { ...f, photoUrl: prevPhotoUrl } : f)) }));
      patch({ syncError: describeError(err, "Couldn't save the fridge photo.") });
    });
  };

  const renameFridge = (name: string) =>
    patch((s) => ({ fridges: s.fridges.map((f, i) => (i === s.stylingFridgeIndex ? { ...f, name } : f)) }));
  const renameFridgeBlur = () => {
    const index = state.stylingFridgeIndex;
    const fridge = state.fridges[index];
    if (!fridge) return;
    const name = fridge.name.trim() || "My Fridge";
    patch((s) => ({
      fridges: s.fridges.map((f, i) => (i === index && !f.name.trim() ? { ...f, name: "My Fridge" } : f)),
    }));
    updateFridge(fridge.id, { name }).catch((err) => {
      patch({ syncError: describeError(err, "Couldn't save the fridge name.") });
    });
  };
  const deleteFridge = (index: number) => {
    const fridge = state.fridges[index];
    if (!fridge || state.fridges.length <= 1) return;
    patch((s) => {
      const fridges = s.fridges.filter((_, i) => i !== index);
      let activeFridge = s.activeFridge;
      if (index < s.activeFridge) activeFridge -= 1;
      else if (index === s.activeFridge) activeFridge = Math.max(0, index - 1);
      activeFridge = Math.min(activeFridge, fridges.length - 1);
      return { fridges, activeFridge, heroSlide: activeFridge, screen: "home" };
    });
    apiDeleteFridge(fridge.id).catch((err) => {
      patch((s) => ({ fridges: [...s.fridges.slice(0, index), fridge, ...s.fridges.slice(index)] }));
      patch({ syncError: describeError(err, "Couldn't delete the fridge.") });
    });
  };

  const openSearch = () => patch({ screen: "search", searchQuery: "" });

  const ensureShoppingSeed = () => {
    patch((s) => {
      if (s.shoppingSeeded) return {};
      const lowStock = (s.fridges[s.activeFridge]?.sections || [])
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
  const addShoppingItem = async () => {
    const name = state.newShoppingText.trim();
    if (!name) return;
    patch({ newShoppingText: "" });
    try {
      const entry = await createShoppingItem({ name, icon: null, section: "other" });
      patch((s) => ({ shoppingList: [...s.shoppingList, entry] }));
    } catch (err) {
      patch({ syncError: describeError(err, "Couldn't add the shopping item.") });
    }
  };
  const onNewShoppingKeyDown = (key: string) => {
    if (key === "Enter") addShoppingItem();
  };
  const toggleShoppingItem = (id: string) => {
    const current = state.shoppingList.find((i) => i.id === id);
    if (!current) return;
    patch((s) => ({ shoppingList: s.shoppingList.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)) }));
    updateShoppingItem(id, { checked: !current.checked }).catch((err) => {
      patch((s) => ({ shoppingList: s.shoppingList.map((i) => (i.id === id ? { ...i, checked: current.checked } : i)) }));
      patch({ syncError: describeError(err, "Couldn't update the shopping item.") });
    });
  };
  const removeShoppingItem = (id: string) => {
    patch((s) => ({ shoppingList: s.shoppingList.filter((i) => i.id !== id) }));
    deleteShoppingItem(id).catch((err) => patch({ syncError: describeError(err, "Couldn't remove the shopping item.") }));
  };
  const clearBought = async () => {
    const bought = state.shoppingList.filter((i) => i.checked);
    if (!bought.length) return;
    patch((s) => ({ shoppingList: s.shoppingList.filter((i) => !i.checked) }));
    const results = await Promise.allSettled(bought.map((i) => deleteShoppingItem(i.id)));
    const failedCount = results.filter((r) => r.status === "rejected").length;
    if (failedCount) patch({ syncError: `Couldn't clear ${failedCount} item${failedCount > 1 ? "s" : ""}.` });
  };

  const addPredictedToShopping = async (name: string, icon: string) => {
    if (state.shoppingList.some((i) => !i.checked && i.name.toLowerCase() === name.toLowerCase())) return;
    try {
      const entry = await createShoppingItem({ name, icon, section: ICON_SECTION[icon] || "other" });
      patch((s) => ({ shoppingList: [...s.shoppingList, entry] }));
    } catch (err) {
      patch({ syncError: describeError(err, "Couldn't add the suggestion.") });
    }
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

    if (!trimmed) {
      const reply: ChatMessage = { id: "b" + Date.now(), from: "bot", text: `Thanks for sharing "${attachmentName}" — I'll take a look!` };
      patch((s) => ({ chatMessages: [...s.chatMessages, reply], isTyping: false }));
      return;
    }

    const inventory = buildInventorySummary(state.fridges[state.activeFridge]);
    sendChatMessage(trimmed, "Chef", inventory)
      .then((res) => {
        const reply: ChatMessage = { id: "b" + Date.now(), from: "bot", text: res.agent_response };
        patch((s) => ({ chatMessages: [...s.chatMessages, reply], isTyping: false }));
      })
      .catch((err) => {
        const reply: ChatMessage = { id: "b" + Date.now(), from: "bot", text: describeError(err, "Sorry, I couldn't reach the assistant right now.") };
        patch((s) => ({ chatMessages: [...s.chatMessages, reply], isTyping: false }));
      });
  };
  const sendMessage = (attachmentName?: string) => sendChat(state.chatDraft, attachmentName);
  const onChatKeyDown = (key: string) => {
    if (key === "Enter") sendMessage();
  };
  const askQuick = (label: string) => sendChat(label);

  const AGENT_ACTIVATE_PROMPT: Record<ChatAgentName, string> = {
    Chef: "What can I cook tonight with what I have?",
    Guardian: "What's at risk of going bad soon?",
    Organizer: "How should I organize my fridge right now?",
    Shopkeeper: "What should I restock?",
  };
  const activateAgent = (agent: ChatAgentName) => {
    if (state.agentInsightLoading) return;
    patch({ agentInsightLoading: agent });
    const inventory = buildInventorySummary(state.fridges[state.activeFridge]);
    sendChatMessage(AGENT_ACTIVATE_PROMPT[agent], agent, inventory)
      .then((res) => {
        patch((s) => ({
          agentInsights: { ...s.agentInsights, [agent]: res.agent_response },
          agentInsightLoading: null,
        }));
      })
      .catch((err) => {
        patch({ agentInsightLoading: null, syncError: describeError(err, "Couldn't reach the agent right now.") });
      });
  };
  const dismissAgentInsight = (agent: ChatAgentName) =>
    patch((s) => {
      const next = { ...s.agentInsights };
      delete next[agent];
      return { agentInsights: next };
    });

  const goHome = () =>
    patch((s) => ({
      screen: s.lastMainScreen,
      selectedItemId: null,
      isEditingItem: false,
      addStep: 0,
      scanMethod: null,
      detected: [],
      expiryScanNote: null,
      expiryPhotoError: null,
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
      manualSectionId: s.fridges[s.activeFridge]?.sections[0]?.id || "",
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
    const found = findItem(state, id);
    if (!found) return;
    const { item: prevItem, section: fromSection } = found;
    const toSectionId = state.editSectionId || fromSection.id;
    const icon = state.editIcon || prevItem.icon;
    const moved = toSectionId !== fromSection.id;

    patch((s) => {
      const found2 = findItem(s, id);
      if (!found2) return {};
      const { item, section: fromSec, fridgeIndex } = found2;
      const fridge = s.fridges[fridgeIndex];
      const updatedItem = { ...item, name, icon };

      const sections =
        toSectionId === fromSec.id
          ? fridge.sections.map((sec) =>
              sec.id === fromSec.id ? { ...sec, items: sec.items.map((it) => (it.id === id ? updatedItem : it)) } : sec
            )
          : fridge.sections.map((sec) => {
              if (sec.id === fromSec.id) return { ...sec, items: sec.items.filter((it) => it.id !== id) };
              if (sec.id === toSectionId) return { ...sec, items: [...sec.items, updatedItem] };
              return sec;
            });

      return {
        fridges: s.fridges.map((f, i) => (i === fridgeIndex ? { ...f, sections } : f)),
        isEditingItem: false,
      };
    });

    updateItem(id, { name, icon, ...(moved ? { section_id: toSectionId } : {}) }).catch((err) => {
      patch((s) => {
        const found3 = findItem(s, id);
        if (!found3) return {};
        const { section: curSection, fridgeIndex } = found3;
        const fridge = s.fridges[fridgeIndex];
        const sections =
          curSection.id === fromSection.id
            ? fridge.sections.map((sec) =>
                sec.id === fromSection.id ? { ...sec, items: sec.items.map((it) => (it.id === id ? prevItem : it)) } : sec
              )
            : fridge.sections.map((sec) => {
                if (sec.id === curSection.id) return { ...sec, items: sec.items.filter((it) => it.id !== id) };
                if (sec.id === fromSection.id) return { ...sec, items: [...sec.items, prevItem] };
                return sec;
              });
        return { fridges: s.fridges.map((f, i) => (i === fridgeIndex ? { ...f, sections } : f)) };
      });
      patch({ syncError: describeError(err, "Couldn't save the item.") });
    });
  };

  const adjustItemQty = (id: string, delta: number) => {
    let newQty = 0;
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
                  sec.id === section.id
                    ? {
                        ...sec,
                        items: sec.items.map((it) => {
                          if (it.id !== id) return it;
                          newQty = Math.max(0, it.qty + delta);
                          return { ...it, qty: newQty };
                        }),
                      }
                    : sec
                ),
              }
            : f
        ),
      };
    });

    const existingTimer = qtyDebounceTimers.current[id];
    if (existingTimer) clearTimeout(existingTimer);
    qtyDebounceTimers.current[id] = setTimeout(() => {
      delete qtyDebounceTimers.current[id];
      // Backend requires quantity >= 1; a locally-displayed 0 (about to be discarded) is sent as 1.
      updateItem(id, { quantity: Math.max(1, newQty) }).catch((err) => {
        patch({ syncError: describeError(err, "Couldn't save the quantity.") });
      });
    }, 450);
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

    scheduleUndo(
      message,
      () => {
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
      },
      () => {
        onCommit?.();
        deleteItem(id).catch((err) => patch({ syncError: describeError(err, "Couldn't delete the item.") }));
      }
    );
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
        manualSectionId: s.fridges[s.addFridgeIndex]?.sections[0]?.id || "",
        manualSectionAuto: true,
        manualIcon: "leftovers",
        manualIconAuto: true,
        manualLocation: "fridge",
        manualExpiryDate: defaultExpiryDate(),
        manualNote: "",
      }));
      return;
    }
    if (method === "barcode") {
      patch({ scanMethod: method, addStep: 4, barcodeInput: "", barcodeError: null, expiryScanNote: null, expiryPhotoError: null });
      return;
    }
    // Receipt & photo scanning aren't wired to a real vision backend yet — this stays a
    // placeholder flow until that's built (see AGENTS.md / product audit notes).
    const detectedTemplates: { name: string; icon: string; group: string }[] = [
      { name: "Orange juice", icon: "milk", group: "dairy" },
      { name: "Bell peppers", icon: "carrot", group: "produce" },
      { name: "Sour cream", icon: "yogurt", group: "dairy" },
    ];
    patch({ scanMethod: method, addStep: 1 });
    setTimeout(() => {
      patch((s) => {
        const fridge = s.fridges[s.addFridgeIndex];
        if (!fridge) return { addStep: 0, scanMethod: null, syncError: "Add a fridge first." };
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
  const onBarcodeInputChange = (value: string) => patch({ barcodeInput: value, barcodeError: null });
  const lookupBarcode = async (explicitBarcode?: string) => {
    const barcode = (explicitBarcode ?? state.barcodeInput).trim();
    if (!barcode) return;
    patch({ barcodeLoading: true, barcodeError: null, barcodeInput: barcode });
    try {
      let fridgeIndex = state.addFridgeIndex;
      let fridge = state.fridges[fridgeIndex];
      if (!fridge) {
        // Brand-new users start with zero fridges — create one on the fly, same as sections.
        fridge = await createFridge("My Fridge");
        fridgeIndex = state.fridges.length;
        patch((s) => ({ fridges: [...s.fridges, fridge], activeFridge: fridgeIndex, addFridgeIndex: fridgeIndex }));
      }
      let sectionId = fridge.sections[0]?.id;
      if (!sectionId) {
        // Brand-new fridges start with zero sections — create one on the fly, same as manual add.
        const section = await createSection(fridge.id, "General");
        sectionId = section.id;
        fridge = { ...fridge, sections: [...fridge.sections, section] };
        patch((s) => ({
          fridges: s.fridges.map((f, i) => (i === fridgeIndex ? { ...f, sections: [...f.sections, section] } : f)),
        }));
      }
      const product = await scanBarcode(sectionId, barcode);
      const icon = FOOD_ICON_KEYS.includes(product.icon) ? product.icon : guessIcon(product.name) || "leftovers";
      const group = ICON_SECTION[icon];
      const target = new Date();
      target.setDate(target.getDate() + (product.default_shelf_life_days || suggestShelfLifeDays(icon)));
      const detected: DetectedItem = {
        id: "bc" + Date.now(),
        name: product.name,
        icon,
        section: (group && findSectionIdForGroup(fridge.sections, group)) || sectionId,
        checked: true,
        qty: 1,
        expiryDate: toISODate(target),
        location: guessLocation(product.name),
      };
      patch({ addStep: 6, detected: [detected], barcodeLoading: false, barcodeInput: "" });
    } catch (err) {
      patch({ barcodeLoading: false, barcodeError: describeError(err, "Couldn't look up that barcode.") });
    }
  };
  const captureExpiryPhoto = async (file: File) => {
    const sectionId = state.detected[0]?.section;
    if (!sectionId) return;
    patch({ expiryPhotoLoading: true, expiryPhotoError: null });
    try {
      const result = await scanExpiryPhoto(sectionId, file);
      if (!result.found || !result.date) {
        patch({ expiryPhotoLoading: false, expiryPhotoError: result.message || "Couldn't read a date on that photo." });
        return;
      }
      const note = `AI read the expiry date as ${result.date}${result.confidence ? ` (${result.confidence} confidence)` : ""} — double-check before adding.`;
      patch((s) => ({
        detected: s.detected.map((d, i) => (i === 0 ? { ...d, expiryDate: result.date! } : d)),
        expiryPhotoLoading: false,
        expiryPhotoError: null,
        expiryScanNote: note,
        addStep: 2,
      }));
    } catch (err) {
      patch({ expiryPhotoLoading: false, expiryPhotoError: describeError(err, "Couldn't read a date on that photo.") });
    }
  };
  const skipExpiryPhoto = () => patch({ addStep: 2, expiryPhotoError: null, expiryScanNote: null });
  const toggleDetected = (id: string) =>
    patch((s) => ({ detected: s.detected.map((d) => (d.id === id ? { ...d, checked: !d.checked } : d)) }));
  const onDetectedNameChange = (id: string, name: string) =>
    patch((s) => ({ detected: s.detected.map((d) => (d.id === id ? { ...d, name } : d)) }));
  const onDetectedIconChange = (id: string, icon: string) =>
    patch((s) => ({ detected: s.detected.map((d) => (d.id === id ? { ...d, icon } : d)) }));
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
  const confirmManualAdd = async () => {
    const name = state.manualName.trim();
    if (!name) return;
    const note = state.manualNote.trim() || "Added manually";
    const location = state.manualLocation;
    const expiryDate = state.manualExpiryDate;
    const shelfLifeDays = Math.max(1, daysUntil(expiryDate));

    patch({ screen: state.lastMainScreen, addStep: 0, scanMethod: null, manualName: "", manualNote: "" });

    try {
      let fridgeIndex = state.addFridgeIndex;
      let fridge = state.fridges[fridgeIndex];
      if (!fridge) {
        // Brand-new users start with zero fridges — create one on the fly, same as sections.
        fridge = await createFridge("My Fridge");
        fridgeIndex = state.fridges.length;
        patch((s) => ({ fridges: [...s.fridges, fridge], activeFridge: fridgeIndex, addFridgeIndex: fridgeIndex }));
      }
      let sectionId = state.manualSectionId || fridge.sections[0]?.id;
      if (!fridge.sections.some((sec) => sec.id === sectionId)) {
        const section = await createSection(fridge.id, "General");
        sectionId = section.id;
        patch((s) => ({
          fridges: s.fridges.map((f, i) => (i === fridgeIndex ? { ...f, sections: [...f.sections, section] } : f)),
        }));
      }
      const icon = state.manualIcon || (sectionId && DEFAULT_ICON_BY_SECTION[sectionId]) || "leftovers";
      const item = await createItem(sectionId!, {
        name,
        icon,
        location,
        quantity: 1,
        expiry_date: expiryDate,
        shelf_life_days: shelfLifeDays,
        note,
      });
      patch((s) => ({
        fridges: s.fridges.map((f, i) =>
          i === fridgeIndex
            ? { ...f, sections: f.sections.map((sec) => (sec.id === sectionId ? { ...sec, items: [...sec.items, item] } : sec)) }
            : f
        ),
      }));
    } catch (err) {
      patch({ syncError: describeError(err, "Couldn't add the item.") });
    }
  };

  const confirmAdd = async () => {
    const fridgeIndex = state.addFridgeIndex;
    const toAdd = state.detected.filter((d) => d.checked);
    patch({ screen: state.lastMainScreen, addStep: 0, scanMethod: null, detected: [], expiryScanNote: null, expiryPhotoError: null });
    if (!toAdd.length) return;

    const results = await Promise.allSettled(
      toAdd.map(async (d) => {
        const shelfLifeDays = d.expiryDate ? Math.max(1, daysUntil(d.expiryDate)) : suggestShelfLifeDays(d.icon);
        const expiryDate =
          d.expiryDate ||
          (() => {
            const target = new Date();
            target.setDate(target.getDate() + shelfLifeDays);
            return toISODate(target);
          })();
        const item = await createItem(d.section, {
          name: d.name,
          icon: d.icon,
          location: d.location,
          quantity: d.qty,
          expiry_date: expiryDate,
          shelf_life_days: shelfLifeDays,
          note: "Just added",
        });
        return { sectionId: d.section, item };
      })
    );

    const succeeded = results.filter(
      (r): r is PromiseFulfilledResult<{ sectionId: string; item: Item }> => r.status === "fulfilled"
    );
    const failedCount = results.length - succeeded.length;

    if (succeeded.length) {
      patch((s) => ({
        fridges: s.fridges.map((f, i) =>
          i === fridgeIndex
            ? {
                ...f,
                sections: f.sections.map((sec) => {
                  const toAppend = succeeded.filter((r) => r.value.sectionId === sec.id).map((r) => r.value.item);
                  return toAppend.length ? { ...sec, items: [...sec.items, ...toAppend] } : sec;
                }),
              }
            : f
        ),
      }));
    }
    if (failedCount) {
      patch({ syncError: `Couldn't add ${failedCount} item${failedCount > 1 ? "s" : ""}.` });
    }
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
    updateFridgePhoto,
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
    activateAgent,
    dismissAgentInsight,
    goHome,
    goTab,
    openAdd,
    selectAddFridge,
    onBarcodeInputChange,
    lookupBarcode,
    captureExpiryPhoto,
    skipExpiryPhoto,
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
    dismissSyncError,
    chooseMethod,
    toggleDetected,
    onDetectedNameChange,
    onDetectedIconChange,
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
