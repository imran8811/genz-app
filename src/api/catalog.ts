import { api } from './client';
import { ApiError } from './client';
import { ADMIN_MENU_URL } from '@/config';
import { Category, Deal, DealOption, MenuItem, SiteInfo, Variant } from '@/types';

// ===== Admin public feed (menu.json shape) =====
interface FeedItem {
  id: string;
  name: string;
  description?: string | null;
  price?: number | string;
  prices?: Record<string, number | string | null>;
  special?: boolean;
  signature?: boolean;
  tag?: string;
  pizzaSelection?: { size: string; count: number; from: string[] };
  dealExtras?: string[];
  image?: string;
}
interface FeedCategory {
  id: string;
  name: string;
  type: 'single' | 'sized';
  sizes?: string[];
  image?: string;
  items: FeedItem[];
}
interface Feed {
  generated_at?: string;
  categories: FeedCategory[];
}

const isDealsCategory = (slug: string) => slug.endsWith('deals');
const num = (v: unknown): number => (typeof v === 'string' ? parseFloat(v) : (v as number)) || 0;

export interface ParsedMenu {
  categories: Category[];
  deals: Deal[];
}

/** Parse the canonical feed into display categories + deals (identity by slug). */
export function parseFeed(feed: Feed): ParsedMenu {
  const cats = feed.categories ?? [];

  // Map every non-deal item slug -> name, so deal option slugs can be labelled.
  const nameBySlug: Record<string, string> = {};
  for (const c of cats) {
    if (isDealsCategory(c.id)) continue;
    for (const it of c.items ?? []) nameBySlug[it.id] = it.name;
  }

  const categories: Category[] = [];
  const deals: Deal[] = [];

  for (const c of cats) {
    if (isDealsCategory(c.id)) {
      for (const it of c.items ?? []) {
        const sel = it.pizzaSelection;
        deals.push({
          name: it.name,
          slug: it.id,
          group: c.name,
          description: it.description ?? null,
          price: num(it.price),
          tag: it.tag ?? null,
          image_url: it.image ?? null,
          requires_selection: !!sel && (sel.from?.length ?? 0) > 0,
          selection_size: sel?.size ?? null,
          selection_count: sel?.count ?? 0,
          extras: it.dealExtras ?? [],
          options: (sel?.from ?? []).map<DealOption>((slug) => ({
            slug,
            name: nameBySlug[slug] ?? slug,
          })),
        });
      }
      continue;
    }

    const items: MenuItem[] = (c.items ?? []).map((it) => {
      const variants: Variant[] = [];
      if (it.prices && typeof it.prices === 'object') {
        const order = c.sizes?.length ? c.sizes : Object.keys(it.prices);
        for (const label of order) {
          if (it.prices[label] == null) continue;
          variants.push({ label, price: num(it.prices[label]) });
        }
      } else {
        variants.push({ label: null, price: num(it.price) });
      }
      const prices = variants.map((v) => v.price);
      return {
        name: it.name,
        slug: it.id,
        description: it.description ?? null,
        image_url: it.image ?? null,
        is_special: !!it.special,
        is_signature: !!it.signature,
        is_available: true,
        category_slug: c.id,
        price_from: prices.length ? Math.min(...prices) : null,
        variants,
      };
    });

    categories.push({
      name: c.name,
      slug: c.id,
      type: c.type,
      sizes: c.sizes ?? null,
      image_url: c.image ?? null,
      items,
    });
  }

  return { categories, deals };
}

export const catalogApi = {
  // Restaurant info / currency / delivery fee still come from genz-web-apis.
  site: (signal?: AbortSignal) => api.get<SiteInfo>('/site', false, signal),

  // Menu + deals are read straight from the genz-admin public feed.
  menu: async (signal?: AbortSignal): Promise<ParsedMenu> => {
    let res: Response;
    try {
      res = await fetch(ADMIN_MENU_URL, { headers: { Accept: 'application/json' }, signal });
    } catch {
      throw new ApiError('Unable to load the menu. Check your internet connection.', 0, null);
    }
    if (!res.ok) throw new ApiError(`Menu feed error (HTTP ${res.status}).`, res.status, null);
    const feed = (await res.json()) as Feed;
    return parseFeed(feed);
  },
};
