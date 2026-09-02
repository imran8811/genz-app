import React, { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/store/auth';
import { useCatalog } from '@/store/catalog';
import { ordersApi } from '@/api/orders';
import { colors, fonts, radius, spacing } from '@/theme';
import { money } from '@/format';
import { Button } from '@/components/common';
import { StatusPill } from '@/components/StatusPill';
import { ApiOrder } from '@/types';
import { RootStackParamList, TabParamList } from '@/navigation/types';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Account'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function AccountScreen() {
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, logout } = useAuth();
  const { currencySymbol } = useCatalog();

  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    ordersApi
      .list()
      .then(setOrders)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load your orders.'))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  // Refresh orders whenever the tab regains focus (e.g. after checkout).
  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders]),
  );

  if (!isAuthenticated) {
    return (
      <View style={[styles.guest, { paddingBottom: insets.bottom }]}>
        <Ionicons name="person-circle-outline" size={72} color={colors.textMuted} />
        <Text style={styles.guestTitle}>You're not signed in</Text>
        <Text style={styles.guestSub}>Sign in to track orders and check out faster.</Text>
        <View style={{ alignSelf: 'stretch', gap: 12, marginTop: 12 }}>
          <Button title="Sign in" onPress={() => nav.navigate('Login')} />
          <Button title="Create account" variant="secondary" onPress={() => nav.navigate('Register')} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing(4), paddingBottom: insets.bottom + 24 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadOrders} tintColor={colors.yellow} />}
    >
      {/* Profile */}
      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() ?? '?'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.detail}>{user?.email}</Text>
          {user?.phone ? <Text style={styles.detail}>{user.phone}</Text> : null}
        </View>
      </View>

      <Text style={styles.sectionTitle}>My orders</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!error && orders.length === 0 && !loading ? (
        <Text style={styles.empty}>No orders yet. Your orders will appear here.</Text>
      ) : null}

      <View style={{ gap: 10 }}>
        {orders.map((o) => (
          <Pressable
            key={o.id ?? o.order_number}
            style={styles.orderRow}
            onPress={() => o.id != null && nav.navigate('OrderDetail', { id: o.id })}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.orderNumber}>{o.order_number}</Text>
              <Text style={styles.orderMeta}>
                {o.items.length} item{o.items.length === 1 ? '' : 's'} ·{' '}
                {o.placed_at ? new Date(o.placed_at).toLocaleDateString() : ''}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <Text style={styles.orderTotal}>{money(o.total_amount, currencySymbol)}</Text>
              {o.status ? <StatusPill status={o.status} /> : null}
            </View>
          </Pressable>
        ))}
      </View>

      <View style={{ marginTop: 28 }}>
        <Button title="Log out" variant="secondary" onPress={logout} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  guest: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: spacing(6), gap: 6 },
  guestTitle: { fontFamily: fonts.display, fontSize: 24, color: colors.text, letterSpacing: 0.5, marginTop: 8 },
  guestSub: { fontFamily: fonts.body, color: colors.textDim, fontSize: 14, textAlign: 'center' },

  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 24,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.display, fontSize: 26, color: '#000' },
  name: { fontFamily: fonts.bodySemibold, color: colors.text, fontSize: 18 },
  detail: { fontFamily: fonts.body, color: colors.textDim, fontSize: 13 },

  sectionTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.text, letterSpacing: 0.5, marginBottom: 12 },
  empty: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 14 },
  error: { color: colors.red, fontFamily: fonts.bodyMedium, fontSize: 14, marginBottom: 12 },

  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 14,
  },
  orderNumber: { fontFamily: fonts.bodySemibold, color: colors.text, fontSize: 15 },
  orderMeta: { fontFamily: fonts.body, color: colors.textDim, fontSize: 12 },
  orderTotal: { fontFamily: fonts.bodyBold, color: colors.yellow, fontSize: 15 },
});
