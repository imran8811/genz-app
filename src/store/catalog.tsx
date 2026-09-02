import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { catalogApi } from '@/api/catalog';
import { STORAGE_KEYS } from '@/config';
import { Category, Deal, SiteInfo } from '@/types';

interface CatalogState {
  site: SiteInfo | null;
  categories: Category[];
  deals: Deal[];
  loading: boolean;
  error: string | null;
  currencySymbol: string;
  deliveryFee: number;
  refresh: () => Promise<void>;
}

const CatalogContext = createContext<CatalogState | null>(null);

interface MenuCache {
  categories: Category[];
  deals: Deal[];
}

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [site, setSite] = useState<SiteInfo | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Site (restaurant/currency/delivery) — non-fatal if it fails.
    const sitePromise = catalogApi
      .site()
      .then(setSite)
      .catch(() => {});

    // Menu + deals come from the genz-admin feed; on failure keep the cache.
    const menuPromise = catalogApi
      .menu()
      .then(async ({ categories: cats, deals: dls }) => {
        setCategories(cats);
        setDeals(dls);
        try {
          await AsyncStorage.setItem(
            STORAGE_KEYS.menu,
            JSON.stringify({ categories: cats, deals: dls } satisfies MenuCache),
          );
        } catch {
          /* ignore storage errors */
        }
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Failed to load the menu.');
      });

    await Promise.all([sitePromise, menuPromise]);
    setLoading(false);
  }, []);

  useEffect(() => {
    (async () => {
      // Paint instantly from the cached menu, then refresh from the feed.
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.menu);
        if (raw) {
          const cached = JSON.parse(raw) as MenuCache;
          setCategories(cached.categories ?? []);
          setDeals(cached.deals ?? []);
        }
      } catch {
        /* ignore */
      }
      await load();
    })();
  }, [load]);

  const value = useMemo<CatalogState>(
    () => ({
      site,
      categories,
      deals,
      loading,
      error,
      currencySymbol: site?.currency.symbol ?? 'Rs',
      deliveryFee: site?.delivery_fee ?? 0,
      refresh: load,
    }),
    [site, categories, deals, loading, error, load],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogState {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider');
  return ctx;
}
