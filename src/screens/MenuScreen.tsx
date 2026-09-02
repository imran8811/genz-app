import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { useCatalog } from '@/store/catalog';
import { useCart } from '@/store/cart';
import { colors, fonts, radius, spacing } from '@/theme';
import { money } from '@/format';
import { Badge, Button, ErrorState, Loading } from '@/components/common';
import { FoodImage } from '@/components/FoodImage';
import { Toast, useToast } from '@/components/Toast';
import { Category, Deal, MenuItem, Variant } from '@/types';
import { TabParamList } from '@/navigation/types';

const TAB_BAR_HEIGHT = 52;

export default function MenuScreen() {
  const nav = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const route = useRoute<RouteProp<TabParamList, 'Menu'>>();
  const insets = useSafeAreaInsets();
  const { categories, deals, loading, error, currencySymbol, refresh } = useCatalog();
  const cart = useCart();
  const { toast, show } = useToast();

  const scrollRef = useRef<ScrollView>(null);
  const sectionY = useRef<Record<string, number>>({});
  const suppressSpy = useRef(false);
  const [activeTab, setActiveTab] = useState('');
  // item slug -> chosen size label ('' for single-price items)
  const [selected, setSelected] = useState<Record<string, string>>({});

  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [picks, setPicks] = useState<string[]>([]);

  const tabs = useMemo(() => {
    const cats = categories.map((c) => ({ slug: c.slug, name: c.name }));
    return deals.length ? [...cats, { slug: 'deals', name: 'Deals' }] : cats;
  }, [categories, deals]);

  useEffect(() => {
    if (!activeTab && tabs.length) setActiveTab(tabs[0].slug);
  }, [tabs, activeTab]);

  // Jump to a category if navigated with a param (e.g. from Home).
  const requested = route.params?.category;
  useEffect(() => {
    if (requested && sectionY.current[requested] != null) {
      scrollToSection(requested);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requested, categories.length]);

  const variantOf = useCallback(
    (item: MenuItem): Variant | null => {
      const label = selected[item.slug];
      return item.variants.find((v) => (v.label ?? '') === label) ?? item.variants[0] ?? null;
    },
    [selected],
  );

  function scrollToSection(slug: string) {
    const y = sectionY.current[slug];
    if (y == null) return;
    suppressSpy.current = true;
    setActiveTab(slug);
    scrollRef.current?.scrollTo({ y: Math.max(y - 4, 0), animated: true });
    setTimeout(() => (suppressSpy.current = false), 450);
  }

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    if (suppressSpy.current) return;
    const offset = e.nativeEvent.contentOffset.y + TAB_BAR_HEIGHT + 12;
    let current = tabs[0]?.slug ?? '';
    for (const t of tabs) {
      const y = sectionY.current[t.slug];
      if (y != null && y <= offset) current = t.slug;
    }
    if (current && current !== activeTab) setActiveTab(current);
  }

  function addItem(item: MenuItem) {
    const v = variantOf(item);
    if (!v) return;
    cart.add({
      key: `item:${item.slug}:${v.label ?? ''}`,
      kind: 'item',
      itemSlug: item.slug,
      size: v.label,
      name: item.name,
      variantLabel: v.label,
      image: item.image_url,
      unitPrice: v.price,
    });
    show(`${item.name}${v.label ? ` (${v.label})` : ''} added`);
  }

  function startDeal(deal: Deal) {
    if (deal.requires_selection && deal.options.length) {
      const first = deal.options[0].name;
      setPicks(Array.from({ length: deal.selection_count }, () => first));
      setActiveDeal(deal);
    } else {
      addDeal(deal, []);
    }
  }

  function addDeal(deal: Deal, chosen: string[]) {
    cart.add({
      key: chosen.length ? `deal:${deal.slug}:${chosen.join('|')}` : `deal:${deal.slug}`,
      kind: 'deal',
      dealSlug: deal.slug,
      name: deal.name,
      variantLabel: deal.selection_size,
      image: deal.image_url,
      unitPrice: deal.price,
      selections: chosen.length ? chosen : undefined,
    });
    show(`${deal.name} added`);
  }

  if (loading && !categories.length) return <Loading label="Loading the menu…" />;
  if (error && !categories.length) return <ErrorState message={error} onRetry={refresh} />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Sticky category tabs */}
      <View style={styles.tabBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabRow}
        >
          {tabs.map((t) => {
            const active = t.slug === activeTab;
            return (
              <Pressable
                key={t.slug}
                onPress={() => scrollToSection(t.slug)}
                style={[styles.tab, active && styles.tabActive]}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: insets.bottom + (cart.itemCount ? 96 : 24) }}
      >
        {categories.map((cat) => (
          <View
            key={cat.slug}
            onLayout={(e) => (sectionY.current[cat.slug] = e.nativeEvent.layout.y)}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>{cat.name}</Text>
            <View style={{ gap: 12 }}>
              {cat.items.map((item) => (
                <ItemCard
                  key={item.slug}
                  item={item}
                  category={cat}
                  currencySymbol={currencySymbol}
                  selectedVariant={variantOf(item)}
                  onSelectVariant={(v) =>
                    setSelected((s) => ({ ...s, [item.slug]: v.label ?? '' }))
                  }
                  onAdd={() => addItem(item)}
                />
              ))}
            </View>
          </View>
        ))}

        {deals.length > 0 && (
          <View
            onLayout={(e) => (sectionY.current['deals'] = e.nativeEvent.layout.y)}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>Deals</Text>
            <View style={{ gap: 12 }}>
              {deals.map((deal) => (
                <DealCard
                  key={deal.slug}
                  deal={deal}
                  currencySymbol={currencySymbol}
                  onAdd={() => startDeal(deal)}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Sticky cart bar */}
      {cart.itemCount > 0 && (
        <Pressable
          style={[styles.cartBar, { paddingBottom: insets.bottom || 12 }]}
          onPress={() => nav.navigate('Cart')}
        >
          <View style={styles.cartCountPill}>
            <Text style={styles.cartCountText}>{cart.itemCount}</Text>
          </View>
          <Text style={styles.cartBarText}>View cart</Text>
          <Text style={styles.cartBarTotal}>{money(cart.subtotal, currencySymbol)}</Text>
        </Pressable>
      )}

      <DealBuilderModal
        deal={activeDeal}
        picks={picks}
        currencySymbol={currencySymbol}
        onSetPick={(i, name) => setPicks((p) => p.map((v, idx) => (idx === i ? name : v)))}
        onCancel={() => setActiveDeal(null)}
        onConfirm={() => {
          if (activeDeal) addDeal(activeDeal, picks);
          setActiveDeal(null);
        }}
      />

      <Toast message={toast} />
    </View>
  );
}

// ---------- Item card ----------
function ItemCard({
  item,
  category,
  currencySymbol,
  selectedVariant,
  onSelectVariant,
  onAdd,
}: {
  item: MenuItem;
  category: Category;
  currencySymbol: string;
  selectedVariant: Variant | null;
  onSelectVariant: (v: Variant) => void;
  onAdd: () => void;
}) {
  const sized = category.type === 'sized' && item.variants.length > 1;
  const price = selectedVariant?.price ?? item.price_from ?? 0;

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <FoodImage uri={item.image_url} name={item.name} style={styles.cardThumb} />
        <View style={{ flex: 1, gap: 4 }}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardName} numberOfLines={2}>
              {item.name}
            </Text>
            {item.is_special ? <Badge label="Special" tone="red" /> : null}
          </View>
          {item.description ? (
            <Text style={styles.cardDesc} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
          <Text style={styles.price}>{money(price, currencySymbol)}</Text>
        </View>
      </View>

      {sized && (
        <View style={styles.sizeRow}>
          {item.variants.map((v) => {
            const active = selectedVariant?.label === v.label;
            return (
              <Pressable
                key={v.label ?? 'single'}
                onPress={() => onSelectVariant(v)}
                style={[styles.sizeChip, active && styles.sizeChipActive]}
              >
                <Text style={[styles.sizeChipText, active && styles.sizeChipTextActive]}>
                  {v.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <Pressable style={styles.addBtn} onPress={onAdd}>
        <Text style={styles.addBtnText}>Add to cart</Text>
      </Pressable>
    </View>
  );
}

// ---------- Deal card ----------
function DealCard({
  deal,
  currencySymbol,
  onAdd,
}: {
  deal: Deal;
  currencySymbol: string;
  onAdd: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <FoodImage uri={deal.image_url} name={deal.name} style={styles.cardThumb} />
        <View style={{ flex: 1, gap: 4 }}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardName} numberOfLines={2}>
              {deal.name}
            </Text>
            {deal.tag ? <Badge label={deal.tag} /> : null}
          </View>
          {deal.description ? (
            <Text style={styles.cardDesc} numberOfLines={3}>
              {deal.description}
            </Text>
          ) : null}
          {deal.extras.length > 0 ? (
            <Text style={styles.dealExtras}>+ {deal.extras.join(' · ')}</Text>
          ) : null}
          <Text style={styles.price}>{money(deal.price, currencySymbol)}</Text>
        </View>
      </View>
      <Pressable style={styles.addBtn} onPress={onAdd}>
        <Text style={styles.addBtnText}>
          {deal.requires_selection && deal.options.length ? 'Choose & add' : 'Add to cart'}
        </Text>
      </Pressable>
    </View>
  );
}

// ---------- Deal builder modal ----------
function DealBuilderModal({
  deal,
  picks,
  currencySymbol,
  onSetPick,
  onCancel,
  onConfirm,
}: {
  deal: Deal | null;
  picks: string[];
  currencySymbol: string;
  onSetPick: (index: number, name: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal visible={!!deal} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          {deal && (
            <>
              <Text style={styles.modalTitle}>{deal.name}</Text>
              <Text style={styles.modalSub}>
                Pick {deal.selection_count} {deal.selection_size ?? 'item'}
                {deal.selection_count > 1 ? 's' : ''}
              </Text>
              <ScrollView style={{ maxHeight: 360 }}>
                {picks.map((pick, i) => (
                  <View key={i} style={{ marginBottom: 16 }}>
                    <Text style={styles.pickLabel}>Choice {i + 1}</Text>
                    <View style={styles.pickWrap}>
                      {deal.options.map((opt) => {
                        const active = pick === opt.name;
                        return (
                          <Pressable
                            key={opt.slug}
                            onPress={() => onSetPick(i, opt.name)}
                            style={[styles.pickChip, active && styles.pickChipActive]}
                          >
                            <Text style={[styles.pickChipText, active && styles.pickChipTextActive]}>
                              {opt.name}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </ScrollView>
              <View style={styles.modalActions}>
                <View style={{ flex: 1 }}>
                  <Button title="Cancel" variant="secondary" onPress={onCancel} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    title={`Add · ${money(deal.price, currencySymbol)}`}
                    onPress={onConfirm}
                  />
                </View>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: TAB_BAR_HEIGHT,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    justifyContent: 'center',
  },
  tabRow: { paddingHorizontal: 12, gap: 8, alignItems: 'center' },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  tabText: { fontFamily: fonts.bodyMedium, color: colors.textDim, fontSize: 13 },
  tabTextActive: { color: '#000', fontFamily: fonts.bodySemibold },

  section: { paddingHorizontal: spacing(4), paddingTop: spacing(6) },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.text,
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 12,
  },
  cardTop: { flexDirection: 'row', gap: 12 },
  cardThumb: { width: 84, height: 84, borderRadius: radius.md },
  cardTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, justifyContent: 'space-between' },
  cardName: { fontFamily: fonts.bodySemibold, color: colors.text, fontSize: 16, flex: 1 },
  cardDesc: { fontFamily: fonts.body, color: colors.textDim, fontSize: 13, lineHeight: 18 },
  dealExtras: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 12 },
  price: { fontFamily: fonts.bodyBold, color: colors.yellow, fontSize: 16 },

  sizeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sizeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sizeChipActive: { borderColor: colors.yellow, backgroundColor: 'rgba(255,224,0,0.12)' },
  sizeChipText: { fontFamily: fonts.bodyMedium, color: colors.textDim, fontSize: 13 },
  sizeChipTextActive: { color: colors.yellow },

  addBtn: {
    backgroundColor: colors.red,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addBtnText: { fontFamily: fonts.bodySemibold, color: '#fff', fontSize: 15 },

  cartBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 0,
    backgroundColor: colors.yellow,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  cartCountPill: {
    backgroundColor: '#000',
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  cartCountText: { color: colors.yellow, fontFamily: fonts.bodyBold, fontSize: 13 },
  cartBarText: { flex: 1, fontFamily: fonts.bodyBold, color: '#000', fontSize: 16 },
  cartBarTotal: { fontFamily: fonts.bodyBold, color: '#000', fontSize: 16 },

  modalBackdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: 20,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: { fontFamily: fonts.display, fontSize: 24, color: colors.text, letterSpacing: 0.5 },
  modalSub: { fontFamily: fonts.body, color: colors.textDim, fontSize: 14, marginTop: 2, marginBottom: 16 },
  pickLabel: { fontFamily: fonts.bodyMedium, color: colors.textDim, fontSize: 13, marginBottom: 8 },
  pickWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pickChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickChipActive: { borderColor: colors.yellow, backgroundColor: 'rgba(255,224,0,0.12)' },
  pickChipText: { fontFamily: fonts.bodyMedium, color: colors.textDim, fontSize: 13 },
  pickChipTextActive: { color: colors.yellow },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
});
