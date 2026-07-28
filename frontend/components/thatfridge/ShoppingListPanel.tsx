"use client";

import { Check, Plus, X } from "lucide-react";
import { useThatFridgeCtx } from "./ThatFridgeContext";

export default function ShoppingListPanel() {
  const { state, actions } = useThatFridgeCtx();

  const shoppingList = state.shoppingList;
  const activeShopping = shoppingList.filter((i) => !i.checked);
  const boughtItemsView = shoppingList.filter((i) => i.checked);
  const hasNoShopping = activeShopping.length === 0 && boughtItemsView.length === 0;

  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          value={state.newShoppingText}
          onChange={(e) => actions.onNewShoppingChange(e.target.value)}
          onKeyDown={(e) => actions.onNewShoppingKeyDown(e.key)}
          placeholder="Add an item…"
          style={{ flex: 1, border: "none", outline: "none", background: "#fff", boxShadow: "0 6px 16px rgba(22,50,92,0.06)", borderRadius: 14, padding: "11px 14px", fontSize: 13.5, color: "#16325c" }}
        />
        <div onClick={actions.addShoppingItem} style={{ width: 40, height: 40, borderRadius: 14, background: "#16325c", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flex: "none" }}>
          <Plus size={18} color="#fff" strokeWidth={2.3} />
        </div>
      </div>

      {hasNoShopping && (
        <div style={{ textAlign: "center", color: "rgba(22,50,92,0.45)", fontSize: 13, marginTop: 20 }}>
          Your list is empty — add items or check the Crew for low-stock picks.
        </div>
      )}

      {activeShopping.length > 0 && (
        <div style={{ marginBottom: 18, background: "#fff", boxShadow: "0 6px 16px rgba(22,50,92,0.06)", borderRadius: 16, overflow: "hidden" }}>
          {activeShopping.map((item) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderBottom: "1px solid rgba(22,50,92,0.06)" }}>
              <div onClick={() => actions.toggleShoppingItem(item.id)} style={{ width: 22, height: 22, borderRadius: 7, border: "1.5px solid rgba(22,50,92,0.25)", flex: "none", cursor: "pointer" }} />
              <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 600 }}>{item.name}</div>
              <div onClick={() => actions.removeShoppingItem(item.id)} style={{ display: "flex", cursor: "pointer", padding: 4 }}>
                <X size={14} color="rgba(22,50,92,0.3)" strokeWidth={2} />
              </div>
            </div>
          ))}
        </div>
      )}

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
                  style={{ width: 22, height: 22, borderRadius: 7, background: "#2f6fb0", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", cursor: "pointer" }}
                >
                  <Check size={13} color="#fff" strokeWidth={2.5} />
                </div>
                <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 600, textDecoration: "line-through" }}>{item.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
