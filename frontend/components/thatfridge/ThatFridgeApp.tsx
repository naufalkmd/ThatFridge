"use client";

import { ThatFridgeProvider, useThatFridgeCtx } from "./ThatFridgeContext";
import TabBar from "./TabBar";
import Fab from "./Fab";
import ProfileDrawer from "./ProfileDrawer";
import UndoToast from "./UndoToast";
import HomeScreen from "./screens/HomeScreen";
import FoodHubScreen from "./screens/FoodHubScreen";
import RecipeDetailSheet from "./screens/RecipeDetailSheet";
import FridgeStyleSheet from "./screens/FridgeStyleSheet";
import ItemDetailSheet from "./screens/ItemDetailSheet";
import AddScreen from "./screens/AddScreen";
import SearchScreen from "./screens/SearchScreen";
import ChatScreen from "./screens/ChatScreen";
import NotificationsScreen from "./screens/NotificationsScreen";
import NotificationHistoryScreen from "./screens/NotificationHistoryScreen";
import AboutScreen from "./screens/AboutScreen";
import AuthScreen from "./screens/AuthScreen";

function Screens() {
  const { state } = useThatFridgeCtx();
  switch (state.screen) {
    case "home":
      return <HomeScreen />;
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
    case "notifications":
      return <NotificationsScreen />;
    case "notificationHistory":
      return <NotificationHistoryScreen />;
    case "about":
      return <AboutScreen />;
    default:
      return null;
  }
}

const shellStyle: React.CSSProperties = {
  position: "relative",
  width: "100%",
  height: "100vh",
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
      <div style={shellStyle}>
        <AuthScreen />
      </div>
    );
  }

  if (state.isLoading) {
    return (
      <div style={{ ...shellStyle, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600 }}>
        Loading your fridge…
      </div>
    );
  }

  return (
    <div style={shellStyle}>
      <Screens />
      <Fab />
      <UndoToast />
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
