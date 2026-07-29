"use client";

import { Check, Plus } from "lucide-react";
import { getRecipesView } from "@/lib/thatfridge/selectors";
import { useThatFridgeCtx } from "../ThatFridgeContext";
import FoodIcon from "../FoodIcon";

export default function RecipeDetailSheet() {
  const { state, actions } = useThatFridgeCtx();
  const recipesView = getRecipesView(state);
  const selectedRecipe = recipesView.find((r) => r.id === state.selectedRecipeId) || {
    name: "",
    minutes: 0,
    ratioLabel: "",
    icon: "",
    ingredientsView: [],
    stepsView: [],
  };

  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(22,50,92,0.32)" }}>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, top: 60, background: "#fff", borderRadius: "28px 28px 0 0", padding: "14px 22px 26px", animation: "pop .22s ease-out", display: "flex", flexDirection: "column" }}>
        <div onClick={actions.closeRecipeDetail} style={{ width: 36, height: 5, borderRadius: 3, background: "rgba(22,50,92,0.18)", margin: "0 auto 16px", cursor: "pointer", flex: "none" }} />
        <div style={{ flex: 1, overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <div style={{ width: 76, height: 76, background: "#eaf6ff", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ position: "relative", width: 44, height: 44 }}>
                <FoodIcon icon={selectedRecipe.icon} />
              </div>
            </div>
          </div>
          <div style={{ textAlign: "center", fontSize: 19, fontWeight: 700, marginBottom: 2 }}>{selectedRecipe.name}</div>
          <div style={{ textAlign: "center", fontSize: 12.5, color: "rgba(22,50,92,0.45)", marginBottom: 18 }}>
            {selectedRecipe.minutes} min · {selectedRecipe.ratioLabel}
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.3, color: "rgba(22,50,92,0.5)", marginBottom: 8 }}>INGREDIENTS</div>
          <div style={{ background: "#eaf6ff", borderRadius: 16, overflow: "hidden", marginBottom: 20 }}>
            {selectedRecipe.ingredientsView.map((ing, i) => {
              const onShoppingList = state.shoppingList.some((si) => !si.checked && si.name.toLowerCase() === ing.name.toLowerCase());
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: "1px solid rgba(22,50,92,0.06)" }}>
                  <div
                    onClick={ing.have || onShoppingList ? undefined : () => actions.addPredictedToShopping(ing.name, ing.icon)}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      background: onShoppingList ? "#2f6fb0" : ing.badgeBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: "none",
                      cursor: ing.have || onShoppingList ? "default" : "pointer",
                    }}
                  >
                    {ing.have || onShoppingList ? <Check size={12} color="#fff" strokeWidth={2.5} /> : <Plus size={12} color="#fff" strokeWidth={2.5} />}
                  </div>
                  <div style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}>{ing.name}</div>
                  <div style={{ fontSize: 11.5, color: onShoppingList ? "#2f6fb0" : ing.badgeBg, fontWeight: 700 }}>
                    {onShoppingList ? "On list" : ing.statusLabel}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.3, color: "rgba(22,50,92,0.5)", marginBottom: 8 }}>STEPS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 10 }}>
            {selectedRecipe.stepsView.map((step) => (
              <div key={step.n} style={{ display: "flex", gap: 10 }}>
                <div style={{ width: 22, height: 22, borderRadius: 11, background: "#eaf6ff", color: "#2f6fb0", fontSize: 11.5, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                  {step.n}
                </div>
                <div style={{ fontSize: 13.5, lineHeight: 1.5, color: "#16325c" }}>{step.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
