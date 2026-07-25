"use client";

import { ThatFridgeProvider, useThatFridgeCtx } from "./ThatFridgeContext";
import TabBar from "./TabBar";
import Fab from "./Fab";
import ProfileDrawer from "./ProfileDrawer";
import HomeScreen from "./screens/HomeScreen";
import FoodHubScreen from "./screens/FoodHubScreen";
import RecipeDetailSheet from "./screens/RecipeDetailSheet";
import FridgeStyleSheet from "./screens/FridgeStyleSheet";
import ItemDetailSheet from "./screens/ItemDetailSheet";
import AddScreen from "./screens/AddScreen";
import SearchScreen from "./screens/SearchScreen";
import ChatScreen from "./screens/ChatScreen";

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
    default:
      return null;
  }
}

function AppShell() {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        maxWidth: 480,
        margin: "0 auto",
        overflow: "hidden",
        background: "linear-gradient(180deg,#eaf6ff,#cfe8fb 55%,#eaf6ff)",
        fontFamily: "-apple-system, system-ui, sans-serif",
        color: "#16325c",
      }}
    >
      <Screens />
      <Fab />
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
