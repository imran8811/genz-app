import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useCart } from '@/store/cart';
import { useCatalog } from '@/store/catalog';
import { useAuth } from '@/store/auth';
import { ordersApi } from '@/api/orders';
import { ApiError } from '@/api/client';
import { colors, fonts, radius, spacing } from '@/theme';
import { money } from '@/format';
import { Button, Field } from '@/components/common';
import { DeliveryDetails, PaymentMethod } from '@/types';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Checkout'>;

export default function CheckoutScreen() {
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const cart = useCart();
  const { currencySymbol, deliveryFee } = useCatalog();
  const { user } = useAuth();

  const [form, setForm] = useState<DeliveryDetails>({
    recipient_name: user?.name ?? '',
    phone: user?.phone ?? '',
    address_line_1: '',
    area: '',
    city: '',
    landmark: '',
    notes: '',
  });
  const [payment, setPayment] = useState<PaymentMethod>('cod');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = cart.subtotal + deliveryFee;
  const set = (k: keyof DeliveryDetails) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    setError(null);
    if (!form.recipient_name.trim() || !form.phone.trim() || !form.address_line_1.trim() || !form.city.trim()) {
      setError('Please fill in name, phone, address and city.');
      return;
    }
    setSubmitting(true);
    try {
      const order = await ordersApi.checkout({
        lines: cart.lines,
        delivery: form,
        paymentMethod: payment,
      });
      cart.clear();
      nav.replace('OrderConfirmation', { orderNumber: order.order_number });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not place your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: insets.bottom + 24 }}>
        <Text style={styles.heading}>Delivery details</Text>

        <Field label="Full name" value={form.recipient_name} onChangeText={set('recipient_name')} placeholder="Your name" />
        <Field
          label="Phone"
          value={form.phone}
          onChangeText={set('phone')}
          placeholder="03xx-xxxxxxx"
          keyboardType="phone-pad"
        />
        <Field label="Address" value={form.address_line_1} onChangeText={set('address_line_1')} placeholder="House / street" />
        <Field label="Area" value={form.area} onChangeText={set('area')} placeholder="Neighbourhood (optional)" />
        <Field label="City" value={form.city} onChangeText={set('city')} placeholder="City" />
        <Field label="Landmark" value={form.landmark} onChangeText={set('landmark')} placeholder="Nearby landmark (optional)" />
        <Field
          label="Notes"
          value={form.notes}
          onChangeText={set('notes')}
          placeholder="Delivery instructions (optional)"
          multiline
        />

        <Text style={[styles.heading, { marginTop: 8 }]}>Payment</Text>
        <PaymentOption
          label="Cash on delivery"
          selected={payment === 'cod'}
          onPress={() => setPayment('cod')}
        />
        <PaymentOption label="Pay online" badge="Coming soon" disabled selected={false} onPress={() => {}} />

        <View style={styles.summary}>
          <Row label="Subtotal" value={money(cart.subtotal, currencySymbol)} />
          <Row label="Delivery fee" value={money(deliveryFee, currencySymbol)} />
          <Row label="Total" value={money(total, currencySymbol)} strong />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={{ marginTop: 16 }}>
          <Button
            title={`Place order · ${money(total, currencySymbol)}`}
            onPress={submit}
            loading={submitting}
            disabled={cart.isEmpty}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PaymentOption({
  label,
  selected,
  onPress,
  disabled,
  badge,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  badge?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.payOption, selected && styles.payOptionActive, disabled && { opacity: 0.5 }]}
    >
      <View style={[styles.radio, selected && styles.radioActive]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
      <Text style={styles.payLabel}>{label}</Text>
      {badge ? <Text style={styles.payBadge}>{badge}</Text> : null}
    </Pressable>
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
  heading: { fontFamily: fonts.display, fontSize: 22, color: colors.text, letterSpacing: 0.5, marginBottom: 14 },
  payOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 10,
  },
  payOptionActive: { borderColor: colors.yellow },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: colors.yellow },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.yellow },
  payLabel: { flex: 1, fontFamily: fonts.bodyMedium, color: colors.text, fontSize: 15 },
  payBadge: { fontFamily: fonts.bodyMedium, color: colors.textMuted, fontSize: 12 },

  summary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
    marginTop: 8,
    gap: 6,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { fontFamily: fonts.body, color: colors.textDim, fontSize: 14 },
  rowValue: { fontFamily: fonts.bodyMedium, color: colors.text, fontSize: 14 },
  rowStrong: { fontFamily: fonts.bodyBold, color: colors.text, fontSize: 17 },
  error: { color: colors.red, fontFamily: fonts.bodyMedium, fontSize: 14, marginTop: 14 },
});
