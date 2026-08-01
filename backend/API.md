# ThatFridge API

Base URL (local dev): `http://127.0.0.1:8000/api`

## Auth

All endpoints except `register`/`login` require a Bearer token:

```
Authorization: Bearer <token>
Accept: application/json
```

Tokens come from Sanctum (personal access tokens, not cookie/SPA sessions) — needed because the frontend runs on a different origin/port than the API. See `README.md` for CORS setup.

---

### `POST /register`

Create an account and get a token back immediately (no separate login needed).

**Body**
```json
{ "name": "Jordan Diaz", "email": "jordan@example.com", "password": "at-least-8-chars" }
```

**201**
```json
{ "user": { "name": "Jordan Diaz", "email": "jordan@example.com" }, "token": "1|abc123..." }
```

**422** — validation failure (`email` already taken, `password` too short, etc.)

---

### `POST /login`

**Body**
```json
{ "email": "jordan@example.com", "password": "at-least-8-chars" }
```

**200** — same shape as register.

**422** — `{"message": "...", "errors": {"email": ["These credentials do not match our records."]}}`

---

### `POST /logout` 🔒

Revokes the token used to make this request. No body.

**200** `{ "message": "Logged out." }`

---

### `GET /me` 🔒

**200** `{ "user": { "name": "Jordan Diaz", "email": "jordan@example.com" } }`

**401** — missing/invalid/revoked token.

---

## Fridges

A fridge belongs to one user. Every endpoint below is scoped — a user can only see/touch their own fridges. Cross-user access returns **403**.

### `GET /fridges` 🔒

Returns all of the current user's fridges, fully nested (sections → items).

**200**
```json
{
  "data": [
    {
      "id": "1",
      "name": "Kitchen",
      "style": "photo",
      "sections": [
        {
          "id": "1",
          "name": "Top shelf",
          "items": [
            {
              "id": "1",
              "name": "Milk",
              "icon": "milk",
              "freshness": 50,
              "days": 4,
              "note": null,
              "location": "fridge"
            }
          ]
        }
      ]
    }
  ]
}
```

`freshness` (0–100, nullable) and `days` (nullable) are **computed on read** from `expiry_date` + `shelf_life_days` — they are not stored columns. `freshness` is null if the item has no `expiry_date` or no shelf-life value (own or from its linked product).

### `POST /fridges` 🔒

**Body** `{ "name": "Garage", "style": "classic" }` — `style` optional.

**201** — single fridge object (same shape as above, `sections: []`).

### `GET /fridges/{fridge}` 🔒

**200** — single fridge, nested. **403** if not yours.

### `PATCH /fridges/{fridge}` 🔒

**Body** — any of `name`, `style`.

**200** — updated fridge.

### `DELETE /fridges/{fridge}` 🔒

**204** — cascades: deletes all its sections and their items too.

---

## Sections

Always created/modified under a parent fridge; ownership is enforced via that fridge.

### `POST /fridges/{fridge}/sections` 🔒

**Body** `{ "name": "Drinks shelf", "position": 0 }` — `position` optional, default `0`.

**201**
```json
{ "id": "1", "name": "Drinks shelf", "items": [] }
```

### `PATCH /sections/{section}` 🔒

**Body** — any of `name`, `position`.

**200** — updated section.

### `DELETE /sections/{section}` 🔒

**204** — cascades to its items.

---

## Items

Always created/modified under a parent section. **This is the contract Track B's ingestion endpoints (manual entry, barcode, receipt scan, photo scan) write through.**

### `POST /sections/{section}/items` 🔒

**Body**
```json
{
  "product_id": null,
  "name": "Milk",
  "icon": "milk",
  "location": "fridge",
  "quantity": 1,
  "expiry_date": "2026-08-01",
  "shelf_life_days": 8,
  "note": null,
  "source": "manual"
}
```

| field | required | notes |
|---|---|---|
| `product_id` | no | must exist in `products` if given |
| `name` | yes | |
| `icon` | yes | free string, matches frontend icon key |
| `location` | no | `fridge` \| `freezer` \| `pantry` |
| `quantity` | no | default `1` |
| `expiry_date` | no | `YYYY-MM-DD` |
| `shelf_life_days` | no | used with `expiry_date` to compute `freshness` |
| `note` | no | |
| `source` | no | `manual` \| `barcode` \| `receipt` \| `photo` \| `voice` |

**201** — item object (same shape as nested items above, with computed `freshness`/`days`).

### `PATCH /items/{item}` 🔒

**Body** — any subset of the fields above.

**200** — updated item.

### `DELETE /items/{item}` 🔒

**204**

---

## Shopping list

Flat list, scoped directly to the user (not nested under a fridge).

### `GET /shopping-items` 🔒

**200**
```json
{ "data": [{ "id": "1", "name": "Eggs", "icon": "egg", "section": "Dairy", "checked": false }] }
```

### `POST /shopping-items` 🔒

**Body** `{ "name": "Eggs", "icon": "egg", "section": "Dairy", "checked": false }` — `icon`/`checked` optional (`checked` defaults `false`).

**201** — shopping item object.

### `PATCH /shopping-items/{shoppingItem}` 🔒

**Body** — any subset of `name`, `icon`, `section`, `checked`. Toggling done state is just `{ "checked": true }`.

**200** — updated shopping item.

### `DELETE /shopping-items/{shoppingItem}` 🔒

**204**

---

## Notification preferences

Singleton per user — no id in the URL. First `GET`/`PATCH` auto-creates the row with defaults (all `true`) if it doesn't exist yet.

### `GET /notification-prefs` 🔒

**200**
```json
{ "expiryAlerts": true, "lowStock": true, "recipeTips": true, "weeklyDigest": true }
```

### `PATCH /notification-prefs` 🔒

**Body** — any subset of `expiryAlerts`, `lowStock`, `recipeTips`, `weeklyDigest` (booleans).

**200** — full updated prefs object.

---

## Freshness cron (not an HTTP endpoint)

`app:check-item-freshness` runs daily at 07:00 (`routes/console.php`). Scans all items with an `expiry_date` within 3 days (or already past), and for each one:

- skips it if the owning user has `expiryAlerts` off
- skips it if an undone `expiring` notification already exists for that item (no duplicate spam)
- otherwise creates a `notification_events` row: `{ fridge_id, item_id, kind: "expiring", message, done: false }`

Run manually any time with:
```bash
php artisan app:check-item-freshness
```

**Not yet built:** a `GET /notification-events` endpoint for the frontend to actually read these. `lowStock`/`recipe` kinds are also not generated yet — `lowStock` needs a "usual quantity" baseline that doesn't exist (deferred `usage_history` feature), and `recipe` suggestions haven't been scoped.

---

## Error shape

Validation errors (422):
```json
{ "message": "The name field is required.", "errors": { "name": ["The name field is required."] } }
```

Auth/authorization failures: **401** (missing/invalid token) or **403** (valid token, wrong owner) with `{ "message": "..." }`.
