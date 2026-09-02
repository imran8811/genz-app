# genz-app — GEN Z Foods Mobile App

React Native (Expo, managed) customer app for Gen Z Foods. Talks to
[`genz-web-apis`](../genz-web-apis) — the **same** `/api/v1` backend as
[`genz-web`](../genz-web). No backend changes are needed for the app: it uses
the existing catalog, auth (Sanctum Bearer tokens), checkout and orders
endpoints. (CORS doesn't apply — native apps aren't browser-origin gated, and
auth is Bearer-token, not cookie/session.)

- **Stack:** Expo SDK 57, React Native 0.86, React 19, TypeScript.
- **Navigation:** React Navigation (native-stack + bottom-tabs). No expo-router.
- **State:** React Context — `AuthProvider`, `CartProvider`, `CatalogProvider`
  (in `src/store/`). Cart, auth token and user are persisted with AsyncStorage.
- **Brand:** matches genz-web "Bold & Youthful" — near-black bg, red `#ff1f2d`
  + lemon-yellow `#ffe000` accents, **Anton** display + **Outfit** body
  (`@expo-google-fonts`). Tokens in `src/theme.ts`.

## Run / build
```bash
npm install
npm start          # Expo dev server + QR code for Expo Go
npm run android    # open in Android emulator
npm run typecheck  # tsc --noEmit
```
Test on a **physical phone**: install **Expo Go**, scan the QR from `npm start`
(phone and PC on the same Wi-Fi).

### API base URL
Set in `src/config.ts`. Defaults to the **live production API**
`https://api.genzfoods.pk/api/v1` (same host the web app uses), so no local
backend is needed to run the app.

To point at a local backend instead, set `EXPO_PUBLIC_API_BASE_URL` (no code
edit). On a physical device via Expo Go use your PC's LAN IP, not localhost:
```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.42:8000/api/v1   # find IP via ipconfig
# and start the backend on the LAN: php artisan serve --host=0.0.0.0 --port=8000
```
Emulator hints: Android → `http://10.0.2.2:8000/api/v1`, iOS sim → `http://localhost:8000/api/v1`.

## Structure
- `App.tsx` — fonts gate, providers, root stack (Tabs + Checkout, Order screens,
  and a modal group for Login/Register/ForgotPassword).
- `src/config.ts` — API base URL + AsyncStorage keys.
- `src/theme.ts`, `src/format.ts` — design tokens, money formatting.
- `src/types.ts` — mirrors the web-apis JSON resources (Category/MenuItem/
  Variant/Deal/ApiOrder…).
- `src/api/` — `client.ts` (fetch wrapper, Bearer token, error parsing),
  `catalog.ts`, `auth.ts`, `orders.ts`. Menu/deals/orders come wrapped in
  `{ data }`; `/site` is unwrapped.
- `src/store/` — `auth.tsx`, `cart.tsx`, `catalog.tsx` (loads site+menu+deals once).
- `src/components/` — `common.tsx` (Button/Field/Loading/QtyStepper/Badge…),
  `FoodImage`, `OrderSummary`, `StatusPill`, `Toast`.
- `src/screens/` — Home, Menu, Cart, Checkout, OrderConfirmation, OrderDetail,
  Account, Login, Register, ForgotPassword.

## Flows (mirror genz-web)
- Browse (Home specials/deals) → **Menu** (sticky category tabs, size selectors
  for sized items, deal-builder modal for deals needing N selections) → add to
  local cart (sticky cart bar) → **Cart** (qty/remove, subtotal + delivery fee).
- **Checkout requires login** (Cart routes to the Login modal with a
  `redirectToCheckout` flag). Delivery form pre-fills name/phone from the account;
  posts `/checkout` (backend **re-prices server-side**) → **Order confirmation**
  (fetched via `/orders/track/{number}`).
- **Account** tab: profile + **My Orders** (`/orders`, tap → `/orders/{id}`) + logout.
  Guests see sign-in / create-account prompts.

## Data sources
- Ordering (menu pricing, cart, checkout, orders, auth): `genz-web-apis`.
- Menu/deal **images**: originate in [`genz-admin`](../genz-admin), arrive as
  absolute `image_url`s through `genz-web-apis` (cache-busted `?v=`). `FoodImage`
  falls back to a branded initial tile when an image is missing/fails.

## Build status
- ✅ Built & typechecks; bundles clean (`expo export`). Menu (sizes + deals),
  cart, auth, checkout (COD), order confirmation, My Orders.
- ⏳ Pending: **online payment** — the backend gateway is still a stub, so the
  Checkout "Pay online" option is shown disabled ("Coming soon"); only COD is
  wired end-to-end. Enable it here once web-apis lands the gateway.
- Possible adds: item detail screen (`/menu/items/{slug}`), push notifications,
  reading the menu directly from `genz-admin-apis` (needs slug-based checkout).

## Conventions
- Path alias `@/*` → `src/*` (tsconfig `paths`; resolved by Expo Metro).
- Keep types in sync with `genz-web-apis` resources. Guard optional fields —
  `image_url`, `variant_label`, `selections`, `area`, `landmark` can be null.
