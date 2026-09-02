import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, Pressable, View, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCatalog } from '@/store/catalog';
import { colors, fonts, radius, spacing } from '@/theme';
import { money } from '@/format';
import { Badge, ErrorState, Loading } from '@/components/common';
import { FoodImage } from '@/components/FoodImage';
import { MenuItem } from '@/types';
import { TabParamList } from '@/navigation/types';

export default function HomeScreen() {
  const nav = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const insets = useSafeAreaInsets();
  const { site, categories, deals, loading, error, currencySymbol, refresh } = useCatalog();

  const specials = useMemo<MenuItem[]>(() => {
    const all = categories.flatMap((c) => c.items.map((i) => ({ ...i, category_slug: c.slug })));
    const flagged = all.filter((i) => i.is_special || i.is_signature);
    return (flagged.length ? flagged : all).slice(0, 6);
  }, [categories]);

  if (loading && !categories.length) return <Loading label="Loading the good stuff…" />;
  if (error && !categories.length) return <ErrorState message={error} onRetry={refresh} />;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.yellow} />}
    >
      {/* Hero */}
      <View style={styles.hero}>
        <Badge label={site?.restaurant.tagline ?? 'Bold & Youthful'} tone="red" />
        <Text style={styles.heroTitle}>{site?.restaurant.name ?? 'GEN Z FOODS'}</Text>
        <Text style={styles.heroSub}>
          Pizzas, burgers & more — made loud. Order in a few taps.
        </Text>
        <Pressable style={styles.cta} onPress={() => nav.navigate('Menu')}>
          <Text style={styles.ctaText}>Browse the menu</Text>
        </Pressable>
        {site?.restaurant.timing ? (
          <Text style={styles.heroMeta}>🕒 {site.restaurant.timing}</Text>
        ) : null}
      </View>

      {/* Deals preview */}
      {deals.length > 0 && (
        <Section title="Hot Deals" onSeeAll={() => nav.navigate('Menu')}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
            {deals.slice(0, 6).map((d) => (
              <Pressable key={d.slug} style={styles.dealCard} onPress={() => nav.navigate('Menu')}>
                <FoodImage uri={d.image_url} name={d.name} style={styles.dealImg} />
                <View style={{ padding: 10, gap: 4 }}>
                  {d.tag ? <Badge label={d.tag} /> : null}
                  <Text style={styles.dealName} numberOfLines={2}>
                    {d.name}
                  </Text>
                  <Text style={styles.price}>{money(d.price, currencySymbol)}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </Section>
      )}

      {/* Specials / signatures */}
      {specials.length > 0 && (
        <Section title="Fan Favourites" onSeeAll={() => nav.navigate('Menu')}>
          <View style={{ gap: 12 }}>
            {specials.map((item) => (
              <Pressable
                key={item.slug}
                style={styles.itemRow}
                onPress={() => nav.navigate('Menu', { category: item.category_slug })}
              >
                <FoodImage uri={item.image_url} name={item.name} style={styles.itemThumb} />
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {item.description ? (
                    <Text style={styles.itemDesc} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}
                  {item.price_from != null ? (
                    <Text style={styles.price}>from {money(item.price_from, currencySymbol)}</Text>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </View>
        </Section>
      )}

      {/* Restaurant info */}
      {site && (
        <Section title="Visit us">
          <View style={styles.infoCard}>
            <InfoRow icon="📍" text={site.restaurant.address} />
            <InfoRow icon="📞" text={site.restaurant.phone} />
            {site.restaurant.whatsapp ? <InfoRow icon="💬" text={site.restaurant.whatsapp} /> : null}
          </View>
        </Section>
      )}
    </ScrollView>
  );
}

function Section({
  title,
  onSeeAll,
  children,
}: {
  title: string;
  onSeeAll?: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {onSeeAll ? (
          <Pressable onPress={onSeeAll} hitSlop={8}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function InfoRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={{ fontSize: 16 }}>{icon}</Text>
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    padding: spacing(6),
    paddingTop: spacing(8),
    gap: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  heroTitle: {
    fontFamily: fonts.display,
    fontSize: 46,
    color: colors.text,
    letterSpacing: 1,
    lineHeight: 48,
  },
  heroSub: { fontFamily: fonts.body, fontSize: 15, color: colors.textDim, lineHeight: 21 },
  heroMeta: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, marginTop: 2 },
  cta: {
    backgroundColor: colors.yellow,
    alignSelf: 'flex-start',
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: radius.pill,
    marginTop: 4,
  },
  ctaText: { fontFamily: fonts.bodyBold, color: '#000', fontSize: 15 },

  section: { paddingHorizontal: spacing(4), paddingTop: spacing(6) },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontFamily: fonts.display, fontSize: 24, color: colors.text, letterSpacing: 0.5 },
  seeAll: { fontFamily: fonts.bodyMedium, color: colors.yellow, fontSize: 13 },

  hRow: { gap: 12, paddingRight: 8 },
  dealCard: {
    width: 190,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  dealImg: { width: '100%', height: 110, borderRadius: 0 },
  dealName: { fontFamily: fonts.bodySemibold, color: colors.text, fontSize: 14 },
  price: { fontFamily: fonts.bodyBold, color: colors.yellow, fontSize: 15 },

  itemRow: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    alignItems: 'center',
  },
  itemThumb: { width: 68, height: 68, borderRadius: radius.md },
  itemName: { fontFamily: fonts.bodySemibold, color: colors.text, fontSize: 15 },
  itemDesc: { fontFamily: fonts.body, color: colors.textDim, fontSize: 12, lineHeight: 16 },

  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  infoRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  infoText: { fontFamily: fonts.body, color: colors.textDim, fontSize: 14, flex: 1 },
});
