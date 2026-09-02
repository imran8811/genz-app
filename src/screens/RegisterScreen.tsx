import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuth } from '@/store/auth';
import { ApiError } from '@/api/client';
import { colors, fonts, spacing } from '@/theme';
import { Button, Field } from '@/components/common';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Register'>;

export default function RegisterScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'Register'>>();
  const { register } = useAuth();
  const redirect = route.params?.redirectToCheckout;

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    setError(null);
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError('Please fill in name, email and password.');
      return;
    }
    if (form.password !== form.password_confirmation) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
        password_confirmation: form.password_confirmation,
      });
      if (redirect) nav.replace('Checkout');
      else nav.goBack();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not create your account.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.sub}>Join GEN Z Foods to order faster.</Text>

        <Field label="Full name" value={form.name} onChangeText={set('name')} placeholder="Your name" />
        <Field
          label="Email"
          value={form.email}
          onChangeText={set('email')}
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Field
          label="Phone"
          value={form.phone}
          onChangeText={set('phone')}
          placeholder="03xx-xxxxxxx (optional)"
          keyboardType="phone-pad"
        />
        <Field
          label="Password"
          value={form.password}
          onChangeText={set('password')}
          placeholder="At least 6 characters"
          secureTextEntry
        />
        <Field
          label="Confirm password"
          value={form.password_confirmation}
          onChangeText={set('password_confirmation')}
          placeholder="Repeat password"
          secureTextEntry
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={{ marginTop: 16 }}>
          <Button title="Create account" onPress={submit} loading={loading} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Pressable onPress={() => nav.replace('Login', { redirectToCheckout: redirect })}>
            <Text style={styles.link}>Sign in</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing(6), paddingTop: spacing(8) },
  title: { fontFamily: fonts.display, fontSize: 34, color: colors.text, letterSpacing: 0.5 },
  sub: { fontFamily: fonts.body, color: colors.textDim, fontSize: 15, marginBottom: 24, marginTop: 4 },
  link: { fontFamily: fonts.bodySemibold, color: colors.yellow, fontSize: 14 },
  error: { color: colors.red, fontFamily: fonts.bodyMedium, fontSize: 14, marginTop: 12 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  footerText: { fontFamily: fonts.body, color: colors.textDim, fontSize: 14 },
});
