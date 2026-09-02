import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '@/theme';
import { money } from '@/format';
import { ApiOrder } from '@/types';

/** Read-only summary of an order: line items, delivery address and totals. */
export function OrderSummary({
  order,
  currencySymbol,
}: {
  order: ApiOrder;
  currencySymbol: string;
}) {
  const s = order.shipping;
  return (
    <View style={{ gap: 12 }}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Items</Text>
        {order.items.map((it, i) => (
          <View key={it.id ?? i} style={styles.itemRow}>
            <Text style={styles.qty}>{it.quantity}×</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{it.name}</Text>
              {it.variant_label ? <Text style={styles.itemMeta}>{it.variant_label}</Text> : null}
              {it.selections?.length ? (
                <Text style={styles.itemMeta}>{it.selections.join(', ')}</Text>
              ) : null}
            </View>
            <Text style={styles.itemPrice}>{money(it.line_total, currencySymbol)}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <Row label="Subtotal" value={money(order.subtotal, currencySymbol)} />
        <Row label="Delivery fee" value={money(order.delivery_fee, currencySymbol)} />
        <Row label="Total" value={money(order.total_amount, currencySymbol)} strong />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Delivering to</Text>
        <Text style={styles.addrName}>{s.name}</Text>
        <Text style={styles.addrLine}>{s.phone}</Text>
        <Text style={styles.addrLine}>
          {[s.address_line_1, s.area, s.city].filter(Boolean).join(', ')}
        </Text>
        {s.landmark ? <Text style={styles.addrLine}>Near {s.landmark}</Text> : null}
      </View>
    </View>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.totalRow}>
      <Text style={[styles.totalLabel, strong && styles.strong]}>{label}</Text>
      <Text style={[styles.totalValue, strong && styles.strong]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
  },
  cardTitle: { fontFamily: fonts.bodySemibold, color: colors.text, fontSize: 16, marginBottom: 12 },
  itemRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 10 },
  qty: { fontFamily: fonts.bodyBold, color: colors.yellow, fontSize: 14, minWidth: 26 },
  itemName: { fontFamily: fonts.bodyMedium, color: colors.text, fontSize: 14 },
  itemMeta: { fontFamily: fonts.body, color: colors.textDim, fontSize: 12 },
  itemPrice: { fontFamily: fonts.bodyMedium, color: colors.text, fontSize: 14 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  totalLabel: { fontFamily: fonts.body, color: colors.textDim, fontSize: 14 },
  totalValue: { fontFamily: fonts.bodyMedium, color: colors.text, fontSize: 14 },
  strong: { fontFamily: fonts.bodyBold, color: colors.text, fontSize: 16 },
  addrName: { fontFamily: fonts.bodySemibold, color: colors.text, fontSize: 15, marginBottom: 2 },
  addrLine: { fontFamily: fonts.body, color: colors.textDim, fontSize: 14, lineHeight: 20 },
});
