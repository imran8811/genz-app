import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';

import { ordersApi } from '@/api/orders';
import { useCatalog } from '@/store/catalog';
import { colors, fonts, radius, spacing } from '@/theme';
import { ErrorState, Loading } from '@/components/common';
import { OrderSummary } from '@/components/OrderSummary';
import { StatusPill } from '@/components/StatusPill';
import { ApiOrder } from '@/types';
import { RootStackParamList } from '@/navigation/types';

export default function OrderDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'OrderDetail'>>();
  const insets = useSafeAreaInsets();
  const { currencySymbol } = useCatalog();
  const { id } = route.params;

  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = React.useCallback(() => {
    setError(null);
    const controller = new AbortController();
    ordersApi
      .get(id, controller.signal)
      .then(setOrder)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load this order.'));
    return controller;
  }, [id]);

  useEffect(() => {
    const c = load();
    return () => c.abort();
  }, [load]);

  if (error) return <ErrorState message={error} onRetry={() => load()} />;
  if (!order) return <Loading />;

  const placed = order.placed_at ? new Date(order.placed_at).toLocaleString() : null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing(4), paddingBottom: insets.bottom + 20, gap: 12 }}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.number}>{order.order_number}</Text>
          {placed ? <Text style={styles.date}>{placed}</Text> : null}
        </View>
        {order.status ? <StatusPill status={order.status} /> : null}
      </View>
      <OrderSummary order={order} currencySymbol={currencySymbol} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
  },
  number: { fontFamily: fonts.bodyBold, color: colors.yellow, fontSize: 16, letterSpacing: 0.5 },
  date: { fontFamily: fonts.body, color: colors.textDim, fontSize: 13, marginTop: 2 },
});
