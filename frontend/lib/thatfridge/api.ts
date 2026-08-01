import type { CurrentUser, Fridge, NotificationPrefs, Recipe, Section, ShoppingItem, StorageLocation } from "./types";
import { RECIPES } from "./data";
import { apiFetch, setToken, type RawItem, toClientItem } from "./apiClient";

function resolveAfter<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 250));
}

// Recipes have no backend endpoint yet — stays mock.
export function fetchRecipes(): Promise<Recipe[]> {
  return resolveAfter(RECIPES);
}

interface RawSection {
  id: string;
  name: string;
  items: RawItem[];
}

interface RawFridge {
  id: string;
  name: string;
  style: string | null;
  sections: RawSection[];
}

function toClientSection(raw: RawSection): Section {
  return { id: raw.id, name: raw.name, items: raw.items.map(toClientItem) };
}

function toClientFridge(raw: RawFridge): Fridge {
  return {
    id: raw.id,
    name: raw.name,
    style: (raw.style as Fridge["style"]) ?? undefined,
    sections: raw.sections.map(toClientSection),
  };
}

export async function login(email: string, password: string): Promise<{ user: CurrentUser; token: string }> {
  const res = await apiFetch<{ user: CurrentUser; token: string }>("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(res.token);
  return res;
}

export async function register(name: string, email: string, password: string): Promise<{ user: CurrentUser; token: string }> {
  const res = await apiFetch<{ user: CurrentUser; token: string }>("/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
  setToken(res.token);
  return res;
}

export function logout(): Promise<void> {
  return apiFetch<void>("/logout", { method: "POST" });
}

export async function fetchMe(): Promise<CurrentUser> {
  const res = await apiFetch<{ user: CurrentUser }>("/me");
  return res.user;
}

export async function fetchFridges(): Promise<Fridge[]> {
  const raw = await apiFetch<RawFridge[]>("/fridges");
  return raw.map(toClientFridge);
}

export async function createFridge(name: string): Promise<Fridge> {
  const raw = await apiFetch<RawFridge>("/fridges", { method: "POST", body: JSON.stringify({ name }) });
  return toClientFridge(raw);
}

export async function updateFridge(id: string, data: { name?: string; style?: string }): Promise<Fridge> {
  const raw = await apiFetch<RawFridge>(`/fridges/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  return toClientFridge(raw);
}

export function deleteFridge(id: string): Promise<void> {
  return apiFetch<void>(`/fridges/${id}`, { method: "DELETE" });
}

export async function createSection(fridgeId: string, name: string): Promise<Section> {
  const raw = await apiFetch<RawSection>(`/fridges/${fridgeId}/sections`, { method: "POST", body: JSON.stringify({ name }) });
  return toClientSection(raw);
}

export interface CreateItemInput {
  name: string;
  icon: string;
  location?: StorageLocation;
  quantity?: number;
  expiry_date?: string;
  shelf_life_days?: number;
  note?: string;
}

export async function createItem(sectionId: string, data: CreateItemInput) {
  const raw = await apiFetch<RawItem>(`/sections/${sectionId}/items`, { method: "POST", body: JSON.stringify(data) });
  return toClientItem(raw);
}

export interface UpdateItemInput {
  name?: string;
  icon?: string;
  section_id?: string;
  location?: StorageLocation;
  quantity?: number;
  expiry_date?: string;
  note?: string;
}

export async function updateItem(id: string, data: UpdateItemInput) {
  const raw = await apiFetch<RawItem>(`/items/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  return toClientItem(raw);
}

export function deleteItem(id: string): Promise<void> {
  return apiFetch<void>(`/items/${id}`, { method: "DELETE" });
}

export function fetchShoppingItems(): Promise<ShoppingItem[]> {
  return apiFetch<ShoppingItem[]>("/shopping-items");
}

export function createShoppingItem(data: { name: string; icon: string | null; section: string }): Promise<ShoppingItem> {
  return apiFetch<ShoppingItem>("/shopping-items", { method: "POST", body: JSON.stringify(data) });
}

export function updateShoppingItem(id: string, data: Partial<{ name: string; icon: string | null; section: string; checked: boolean }>): Promise<ShoppingItem> {
  return apiFetch<ShoppingItem>(`/shopping-items/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export function deleteShoppingItem(id: string): Promise<void> {
  return apiFetch<void>(`/shopping-items/${id}`, { method: "DELETE" });
}

export function fetchNotificationPrefs(): Promise<NotificationPrefs> {
  return apiFetch<NotificationPrefs>("/notification-prefs");
}

export function updateNotificationPrefs(data: Partial<NotificationPrefs>): Promise<NotificationPrefs> {
  return apiFetch<NotificationPrefs>("/notification-prefs", { method: "PATCH", body: JSON.stringify(data) });
}
