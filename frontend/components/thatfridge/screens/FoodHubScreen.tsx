"use client";

import { getRecipesView, getTonightPick } from "@/lib/thatfridge/selectors";
import { useThatFridgeCtx } from "../ThatFridgeContext";
import PixelIcon from "../PixelIcon";

const SECTION_NAMES: Record<string, string> = { dairy: "Dairy", produce: "Produce", protein: "Protein", leftovers: "Leftovers", other: "Other" };
const SECTION_ORDER = ["dairy", "produce", "protein", "leftovers", "other"];

export default function FoodHubScreen() {
  const { state, actions } = useThatFridgeCtx();
  const recipesView = getRecipesView(state);
  const tonightPick = getTonightPick(recipesView);

  const shoppingList = state.shoppingList;
  const activeShopping = shoppingList.filter((i) => !i.checked);
  const boughtItemsView = shoppingList.filter((i) => i.checked);
  const groupedShopping = SECTION_ORDER.map((id) => ({
    id,
    name: SECTION_NAMES[id],
    items: activeShopping.filter((i) => (i.section || "other") === id),
  })).filter((g) => g.items.length > 0);
  const hasNoShopping = activeShopping.length === 0 && boughtItemsView.length === 0;

  const foodTranslate = state.foodSubtab === "recipes" ? "0%" : "-50%";
  const recipesTabBg = state.foodSubtab === "recipes" ? "#16325c" : "transparent";
  const recipesTabColor = state.foodSubtab === "recipes" ? "#fff" : "rgba(22,50,92,0.55)";
  const shoppingTabBg = state.foodSubtab === "shopping" ? "#16325c" : "transparent";
  const shoppingTabColor = state.foodSubtab === "shopping" ? "#fff" : "rgba(22,50,92,0.55)";

  return (
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#eaf6ff,#cfe8fb 55%,#eaf6ff)", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: "none", padding: "28px 20px 14px" }}>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 14 }}>Kitchen</div>
        <div style={{ display: "flex", background: "rgba(255,255,255,0.6)", borderRadius: 14, padding: 4, gap: 4 }}>
          <div onClick={actions.selectRecipesTab} style={{ flex: 1, textAlign: "center", padding: 9, borderRadius: 11, fontSize: 13, fontWeight: 700, cursor: "pointer", background: recipesTabBg, color: recipesTabColor }}>
            Recipes
          </div>
          <div onClick={actions.selectShoppingTab} style={{ flex: 1, textAlign: "center", padding: 9, borderRadius: 11, fontSize: 13, fontWeight: 700, cursor: "pointer", background: shoppingTabBg, color: shoppingTabColor }}>
            Shopping
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "hidden", position: "relative" }} onTouchStart={actions.onSwipeStart} onTouchEnd={actions.onSwipeEnd}>
        <div style={{ display: "flex", width: "200%", height: "100%", transform: `translateX(${foodTranslate})`, transition: "transform .28s ease" }}>
          {/* recipes pane */}
          <div style={{ width: "50%", flex: "none", overflowY: "auto", padding: "6px 20px 100px", boxSizing: "border-box" }}>
            {tonightPick && (
              <div onClick={() => actions.openRecipeDetail(tonightPick.id)} style={{ position: "relative", background: "#fff", boxShadow: "0 10px 24px rgba(22,50,92,0.1)", borderRadius: 18, padding: "14px 16px", marginBottom: 18, cursor: "pointer" }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.4, color: "#16325c", marginBottom: 8 }}>TONIGHT&apos;S PICK</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ position: "relative", width: 46, height: 46, flex: "none", borderRadius: 13, background: "#f6f1e4", padding: 8, boxSizing: "border-box" }}>
                    <PixelIcon icon={tonightPick.iconData} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>{tonightPick.name}</div>
                    <div style={{ fontSize: 12, color: "rgba(22,50,92,0.5)" }}>
                      {tonightPick.minutes} min · {tonightPick.ratioLabel}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.3, color: "rgba(22,50,92,0.5)", marginBottom: 8 }}>ALL RECIPES</div>
            <div style={{ background: "#fff", boxShadow: "0 6px 16px rgba(22,50,92,0.06)", borderRadius: 16, overflow: "hidden" }}>
              {recipesView.map((r) => (
                <div key={r.id} onClick={() => actions.openRecipeDetail(r.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderBottom: "1px solid rgba(22,50,92,0.06)", cursor: "pointer" }}>
                  <div style={{ position: "relative", width: 38, height: 38, flex: "none", borderRadius: 11, background: "#f6f1e4", padding: 6, boxSizing: "border-box" }}>
                    <PixelIcon icon={r.iconData} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{r.name}</div>
                    <div style={{ fontSize: 11.5, color: "rgba(22,50,92,0.45)" }}>{r.minutes} min</div>
                  </div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: r.ratioColor, background: r.ratioBg, padding: "5px 10px", borderRadius: 11 }}>{r.ratioLabel}</div>
                </div>
              ))}
            </div>
          </div>

          {/* shopping pane */}
          <div style={{ width: "50%", flex: "none", overflowY: "auto", padding: "6px 20px 100px", boxSizing: "border-box" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <input
                value={state.newShoppingText}
                onChange={(e) => actions.onNewShoppingChange(e.target.value)}
                onKeyDown={(e) => actions.onNewShoppingKeyDown(e.key)}
                placeholder="Add an item…"
                style={{ flex: 1, border: "none", outline: "none", background: "#fff", boxShadow: "0 6px 16px rgba(22,50,92,0.06)", borderRadius: 14, padding: "11px 14px", fontSize: 13.5, color: "#16325c" }}
              />
              <div onClick={actions.addShoppingItem} style={{ width: 40, height: 40, borderRadius: 14, background: "#16325c", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flex: "none", color: "#fff", fontSize: 16 }}>
                +
              </div>
            </div>

            {hasNoShopping && (
              <div style={{ textAlign: "center", color: "rgba(22,50,92,0.45)", fontSize: 13, marginTop: 20 }}>
                Your list is empty — add items or check the Kitchen for low-stock picks.
              </div>
            )}

            {groupedShopping.map((grp) => (
              <div key={grp.id} style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.3, color: "rgba(22,50,92,0.5)", marginBottom: 8 }}>{grp.name}</div>
                <div style={{ background: "#fff", boxShadow: "0 6px 16px rgba(22,50,92,0.06)", borderRadius: 16, overflow: "hidden" }}>
                  {grp.items.map((item) => (
                    <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderBottom: "1px solid rgba(22,50,92,0.06)" }}>
                      <div onClick={() => actions.toggleShoppingItem(item.id)} style={{ width: 22, height: 22, borderRadius: 7, border: "1.5px solid rgba(22,50,92,0.25)", flex: "none", cursor: "pointer" }} />
                      <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 600 }}>{item.name}</div>
                      <div onClick={() => actions.removeShoppingItem(item.id)} style={{ color: "rgba(22,50,92,0.3)", fontSize: 14, cursor: "pointer", padding: 4 }}>✕</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {boughtItemsView.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.3, color: "rgba(22,50,92,0.5)" }}>BOUGHT ({boughtItemsView.length})</div>
                  <div onClick={actions.clearBought} style={{ fontSize: 11.5, fontWeight: 700, color: "#2f6fb0", cursor: "pointer" }}>
                    Clear
                  </div>
                </div>
                <div style={{ background: "#fff", boxShadow: "0 6px 16px rgba(22,50,92,0.06)", borderRadius: 16, overflow: "hidden" }}>
                  {boughtItemsView.map((item) => (
                    <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderBottom: "1px solid rgba(22,50,92,0.06)", opacity: 0.55 }}>
                      <div
                        onClick={() => actions.toggleShoppingItem(item.id)}
                        style={{ width: 22, height: 22, borderRadius: 7, background: "#2f6fb0", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", cursor: "pointer", color: "#fff", fontSize: 12 }}
                      >
                        ✓
                      </div>
                      <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 600, textDecoration: "line-through" }}>{item.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
