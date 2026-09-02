/**
 * App configuration.
 *
 * API_BASE_URL points at the genz-web-apis backend (`/api/v1`). We target the
 * live production API directly (same host the web app uses), so no local dev
 * server is required to run the app.
 *
 * To point at a local backend during development instead, set the
 * EXPO_PUBLIC_API_BASE_URL environment variable (e.g. in a .env file) — on a
 * physical device via Expo Go use your PC's LAN IP, not localhost:
 *   EXPO_PUBLIC_API_BASE_URL=http://192.168.1.42:8000/api/v1
 * (Emulator hints: Android → http://10.0.2.2:8000/api/v1, iOS sim → http://localhost:8000/api/v1.)
 */
const PROD_API = 'https://api.genzfoods.pk/api/v1';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || PROD_API;

/**
 * The menu is read directly from the genz-admin public feed (source of truth),
 * cached in AsyncStorage. Auth, checkout and orders still go through
 * API_BASE_URL (genz-web-apis).
 */
const PROD_ADMIN_MENU_URL = 'https://api.admin.genzfoods.pk/api/public/menu';

export const ADMIN_MENU_URL =
  process.env.EXPO_PUBLIC_ADMIN_MENU_URL?.trim() || PROD_ADMIN_MENU_URL;

/** Storage keys (AsyncStorage). Mirror the web app's naming where sensible. */
export const STORAGE_KEYS = {
  token: 'genz_api_token',
  user: 'genz_current_user',
  cart: 'genz_cart_v2',
  menu: 'genz_menu_cache_v1',
} as const;
