import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { colors, fonts, radius } from '@/theme';

// ---- Button ----
export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
}) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.btn,
        variant === 'primary' && styles.btnPrimary,
        variant === 'secondary' && styles.btnSecondary,
        variant === 'ghost' && styles.btnGhost,
        isDisabled && styles.btnDisabled,
        pressed && !isDisabled && styles.btnPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#000' : colors.text} />
      ) : (
        <Text
          style={[
            styles.btnText,
            variant === 'primary' && styles.btnTextPrimary,
            variant === 'ghost' && styles.btnTextGhost,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

// ---- Text input field ----
export function Field({
  label,
  error,
  ...props
}: TextInputProps & { label?: string; error?: string }) {
  return (
    <View style={styles.fieldWrap}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[styles.input, !!error && styles.inputError]}
        {...props}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

// ---- Loading / error / empty states ----
export function Loading({ label }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.yellow} />
      {label ? <Text style={styles.dim}>{label}</Text> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.dim}>{message}</Text>
      {onRetry ? (
        <View style={{ marginTop: 16, alignSelf: 'stretch' }}>
          <Button title="Try again" onPress={onRetry} variant="secondary" />
        </View>
      ) : null}
    </View>
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.dim}>{subtitle}</Text> : null}
    </View>
  );
}

// ---- Quantity stepper ----
export function QtyStepper({
  quantity,
  onIncrement,
  onDecrement,
}: {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable onPress={onDecrement} style={styles.stepBtn} hitSlop={6}>
        <Text style={styles.stepBtnText}>−</Text>
      </Pressable>
      <Text style={styles.stepQty}>{quantity}</Text>
      <Pressable onPress={onIncrement} style={styles.stepBtn} hitSlop={6}>
        <Text style={styles.stepBtnText}>+</Text>
      </Pressable>
    </View>
  );
}

// ---- Pill / badge ----
export function Badge({ label, tone = 'yellow' }: { label: string; tone?: 'yellow' | 'red' }) {
  return (
    <View style={[styles.badge, tone === 'red' ? styles.badgeRed : styles.badgeYellow]}>
      <Text style={[styles.badgeText, tone === 'red' && { color: '#fff' }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  btnPrimary: { backgroundColor: colors.yellow },
  btnSecondary: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  btnGhost: { backgroundColor: 'transparent' },
  btnDisabled: { opacity: 0.5 },
  btnPressed: { opacity: 0.85 },
  btnText: { fontFamily: fonts.bodySemibold, fontSize: 16, color: colors.text },
  btnTextPrimary: { color: '#000' },
  btnTextGhost: { color: colors.yellow },

  fieldWrap: { marginBottom: 16 },
  fieldLabel: {
    fontFamily: fonts.bodyMedium,
    color: colors.textDim,
    marginBottom: 6,
    fontSize: 13,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 16,
  },
  inputError: { borderColor: colors.red },
  fieldError: { color: colors.red, fontFamily: fonts.body, fontSize: 12, marginTop: 4 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  dim: { color: colors.textDim, fontFamily: fonts.body, textAlign: 'center', fontSize: 14 },
  errorTitle: { color: colors.text, fontFamily: fonts.bodySemibold, fontSize: 18 },
  emptyTitle: { color: colors.text, fontFamily: fonts.display, fontSize: 22, letterSpacing: 0.5 },

  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  stepBtnText: { color: colors.yellow, fontSize: 20, fontFamily: fonts.bodySemibold, lineHeight: 22 },
  stepQty: { color: colors.text, fontFamily: fonts.bodySemibold, minWidth: 22, textAlign: 'center' },

  badge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeYellow: { backgroundColor: colors.yellow },
  badgeRed: { backgroundColor: colors.red },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: 11, color: '#000', letterSpacing: 0.4 },
});
