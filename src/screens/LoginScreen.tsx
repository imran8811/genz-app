import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuth } from '@/store/auth';
import { ApiError } from '@/api/client';
import { colors, fonts, spacing } from '@/theme';
import { Button, Field } from '@/components/common';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'Login'>>();
  const { login } = useAuth();
  const redirect = route.params?.redirectToCheckout;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      if (redirect) nav.replace('Checkout');
      else nav.goBack();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Login failed. Please try again.');
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
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.sub}>Sign in to place your order.</Text>

        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
        />

        <Pressable onPress={() => nav.navigate('ForgotPassword')} style={{ alignSelf: 'flex-end' }}>
          <Text style={styles.link}>Forgot password?</Text>
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={{ marginTop: 16 }}>
          <Button title="Sign in" onPress={submit} loading={loading} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>New here? </Text>
          <Pressable onPress={() => nav.replace('Register', { redirectToCheckout: redirect })}>
            <Text style={styles.link}>Create an account</Text>
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
  link: { fontFamily: fonts.bodySemibold, color: colors.yellow, fontSize: 14, paddingVertical: 6 },
  error: { color: colors.red, fontFamily: fonts.bodyMedium, fontSize: 14, marginTop: 12 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  footerText: { fontFamily: fonts.body, color: colors.textDim, fontSize: 14 },
});
