"use client";

import { ThatFridgeProvider, useThatFridgeCtx } from "./ThatFridgeContext";
import TabBar from "./TabBar";
import ProfileDrawer from "./ProfileDrawer";
import UndoToast from "./UndoToast";
import SyncErrorToast from "./SyncErrorToast";
import HomeScreen from "./screens/HomeScreen";
import InventoryScreen from "./screens/InventoryScreen";
import FoodHubScreen from "./screens/FoodHubScreen";
import RecipeDetailSheet from "./screens/RecipeDetailSheet";
import FridgeStyleSheet from "./screens/FridgeStyleSheet";
import ItemDetailSheet from "./screens/ItemDetailSheet";
import AddScreen from "./screens/AddScreen";
import SearchScreen from "./screens/SearchScreen";
import ChatScreen from "./screens/ChatScreen";
import ChatHistoryScreen from "./screens/ChatHistoryScreen";
import NotificationsScreen from "./screens/NotificationsScreen";
import NotificationHistoryScreen from "./screens/NotificationHistoryScreen";
import AIDataScreen from "./screens/AIDataScreen";
import AboutScreen from "./screens/AboutScreen";
import AuthScreen from "./screens/AuthScreen";

function Screens() {
  const { state } = useThatFridgeCtx();
  switch (state.screen) {
    case "home":
      return <HomeScreen />;
    case "inventory":
      return <InventoryScreen />;
    case "foodHub":
      return <FoodHubScreen />;
    case "recipeDetail":
      return <RecipeDetailSheet />;
    case "fridgeStyle":
      return <FridgeStyleSheet />;
    case "itemDetail":
      return <ItemDetailSheet />;
    case "add":
      return <AddScreen />;
    case "search":
      return <SearchScreen />;
    case "chat":
      return <ChatScreen />;
    case "chatHistory":
      return <ChatHistoryScreen />;
    case "notifications":
      return <NotificationsScreen />;
    case "notificationHistory":
      return <NotificationHistoryScreen />;
    case "aiData":
      return <AIDataScreen />;
    case "about":
      return <AboutScreen />;
    default:
      return null;
  }
}

const shellStyle: React.CSSProperties = {
  position: "relative",
  width: "100%",
  maxWidth: 480,
  margin: "0 auto",
  overflow: "hidden",
  background: "linear-gradient(180deg,#eaf6ff,#cfe8fb 55%,#eaf6ff)",
  fontFamily: "-apple-system, system-ui, sans-serif",
  color: "#16325c",
};

function AppShell() {
  const { state } = useThatFridgeCtx();

  if (!state.isAuthenticated) {
    return (
      <div className="thatfridge-shell" style={shellStyle}>
        <AuthScreen />
      </div>
    );
  }

  if (state.isLoading) {
    return (
      <div
        className="thatfridge-shell"
        style={{ ...shellStyle, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600 }}
      >
        Loading your fridge…
      </div>
    );
  }

  return (
    <div className="thatfridge-shell" style={shellStyle}>
      <Screens />
      <UndoToast />
      <SyncErrorToast />
      <TabBar />
      <ProfileDrawer />
    </div>
  );
}

export default function ThatFridgeApp() {
  return (
    <ThatFridgeProvider>
      <AppShell />
    </ThatFridgeProvider>
  );
}
