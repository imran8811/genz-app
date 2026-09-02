import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '@/theme';

const TONES: Record<string, string> = {
  pending: colors.yellow,
  confirmed: colors.yellow,
  preparing: colors.yellow,
  ready: colors.success,
  out_for_delivery: colors.success,
  delivered: colors.success,
  completed: colors.success,
  cancelled: colors.red,
};

/** Small coloured pill for an order status string. */
export function StatusPill({ status }: { status: string }) {
  const tone = TONES[status] ?? colors.textMuted;
  const label = status.replace(/_/g, ' ');
  return (
    <View style={[styles.pill, { borderColor: tone }]}>
      <View style={[styles.dot, { backgroundColor: tone }]} />
      <Text style={[styles.text, { color: tone }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  text: { fontFamily: fonts.bodySemibold, fontSize: 12, textTransform: 'capitalize' },
});
