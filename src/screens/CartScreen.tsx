import React from 'react';
import { ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useCart } from '@/store/cart';
import { useCatalog } from '@/store/catalog';
import { useAuth } from '@/store/auth';
import { colors, fonts, radius, spacing } from '@/theme';
import { money } from '@/format';
import { Button, EmptyState, QtyStepper } from '@/components/common';
import { FoodImage } from '@/components/FoodImage';
import { RootStackParamList, TabParamList } from '@/navigation/types';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Cart'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function CartScreen() {
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const cart = useCart();
  const { currencySymbol, deliveryFee } = useCatalog();
  const { isAuthenticated } = useAuth();

  const total = cart.subtotal + (cart.isEmpty ? 0 : deliveryFee);

  function goCheckout() {
    if (!isAuthenticated) {
      nav.navigate('Login', { redirectToCheckout: true });
      return;
    }
    nav.navigate('Checkout');
  }

  if (cart.isEmpty) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <EmptyState title="Your cart is empty" subtitle="Add something tasty from the menu." />
        <View style={{ padding: 20 }}>
          <Button title="Browse menu" onPress={() => nav.navigate('Menu')} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: 24, gap: 12 }}>
        {cart.lines.map((line) => (
          <View key={line.key} style={styles.line}>
            <FoodImage uri={line.image} name={line.name} style={styles.thumb} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.name} numberOfLines={2}>
                {line.name}
              </Text>
              {line.variantLabel ? <Text style={styles.meta}>{line.variantLabel}</Text> : null}
              {line.selections?.length ? (
                <Text style={styles.meta}>{line.selections.join(', ')}</Text>
              ) : null}
              <Text style={styles.price}>{money(line.unitPrice, currencySymbol)}</Text>
              <View style={styles.lineFooter}>
                <QtyStepper
                  quantity={line.quantity}
                  onIncrement={() => cart.increment(line.key)}
                  onDecrement={() => cart.decrement(line.key)}
                />
                <Pressable onPress={() => cart.remove(line.key)} hitSlop={8}>
                  <Text style={styles.remove}>Remove</Text>
                </Pressable>
              </View>
            </View>
            <Text style={styles.lineTotal}>
              {money(line.unitPrice * line.quantity, currencySymbol)}
            </Text>
          </View>
        ))}

        <Pressable onPress={cart.clear} style={styles.clearBtn}>
          <Text style={styles.clearText}>Clear cart</Text>
        </Pressable>
      </ScrollView>

      {/* Summary + checkout */}
      <View style={[styles.summary, { paddingBottom: (insets.bottom || 12) + 8 }]}>
        <Row label="Subtotal" value={money(cart.subtotal, currencySymbol)} />
        <Row label="Delivery fee" value={money(deliveryFee, currencySymbol)} />
        <Row label="Total" value={money(total, currencySymbol)} strong />
        <View style={{ marginTop: 8 }}>
          <Button
            title={isAuthenticated ? 'Proceed to checkout' : 'Sign in to checkout'}
            onPress={goCheckout}
          />
        </View>
      </View>
    </View>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, strong && styles.rowStrong]}>{label}</Text>
      <Text style={[styles.rowValue, strong && styles.rowStrong]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  line: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  thumb: { width: 72, height: 72, borderRadius: radius.md },
  name: { fontFamily: fonts.bodySemibold, color: colors.text, fontSize: 15 },
  meta: { fontFamily: fonts.body, color: colors.textDim, fontSize: 12 },
  price: { fontFamily: fonts.bodyMedium, color: colors.textMuted, fontSize: 13 },
  lineFooter: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4 },
  remove: { fontFamily: fonts.bodyMedium, color: colors.red, fontSize: 13 },
  lineTotal: { fontFamily: fonts.bodyBold, color: colors.yellow, fontSize: 15 },

  clearBtn: { alignSelf: 'center', paddingVertical: 8 },
  clearText: { fontFamily: fonts.bodyMedium, color: colors.textMuted, fontSize: 13 },

  summary: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing(4),
    paddingTop: 16,
    gap: 6,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { fontFamily: fonts.body, color: colors.textDim, fontSize: 14 },
  rowValue: { fontFamily: fonts.bodyMedium, color: colors.text, fontSize: 14 },
  rowStrong: { fontFamily: fonts.bodyBold, color: colors.text, fontSize: 17 },
});
