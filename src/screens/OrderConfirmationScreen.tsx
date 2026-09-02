import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { ordersApi } from '@/api/orders';
import { useCatalog } from '@/store/catalog';
import { colors, fonts, radius, spacing } from '@/theme';
import { money } from '@/format';
import { Button, ErrorState, Loading } from '@/components/common';
import { OrderSummary } from '@/components/OrderSummary';
import { ApiOrder } from '@/types';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'OrderConfirmation'>;

export default function OrderConfirmationScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'OrderConfirmation'>>();
  const insets = useSafeAreaInsets();
  const { currencySymbol } = useCatalog();
  const { orderNumber } = route.params;

  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = React.useCallback(() => {
    setError(null);
    const controller = new AbortController();
    ordersApi
      .track(orderNumber, controller.signal)
      .then(setOrder)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load your order.'));
    return controller;
  }, [orderNumber]);

  useEffect(() => {
    const c = load();
    return () => c.abort();
  }, [load]);

  const goHome = () => nav.navigate('Tabs', { screen: 'Home' });

  if (error) return <ErrorState message={error} onRetry={() => load()} />;
  if (!order) return <Loading label="Confirming your order…" />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: insets.bottom + 20 }}>
        <View style={styles.hero}>
          <View style={styles.check}>
            <Ionicons name="checkmark" size={40} color="#000" />
          </View>
          <Text style={styles.title}>Order confirmed!</Text>
          <Text style={styles.sub}>Thanks — we've received your order.</Text>
          <View style={styles.numberPill}>
            <Text style={styles.numberText}>{order.order_number}</Text>
          </View>
          <Text style={styles.total}>{money(order.total_amount, currencySymbol)}</Text>
          <Text style={styles.payNote}>
            {order.payment_method === 'cod' ? 'Cash on delivery' : 'Paid online'}
          </Text>
        </View>

        <OrderSummary order={order} currencySymbol={currencySymbol} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: (insets.bottom || 12) + 8 }]}>
        <Button title="Back to home" onPress={goHome} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 8, paddingVertical: 20 },
  check: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  title: { fontFamily: fonts.display, fontSize: 30, color: colors.text, letterSpacing: 0.5 },
  sub: { fontFamily: fonts.body, color: colors.textDim, fontSize: 14 },
  numberPill: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
  },
  numberText: { fontFamily: fonts.bodyBold, color: colors.yellow, fontSize: 15, letterSpacing: 1 },
  total: { fontFamily: fonts.display, fontSize: 28, color: colors.text, marginTop: 8 },
  payNote: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 13 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing(4),
    paddingTop: 14,
  },
});
