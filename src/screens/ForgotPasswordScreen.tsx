import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { authApi } from '@/api/auth';
import { ApiError } from '@/api/client';
import { colors, fonts, spacing } from '@/theme';
import { Button, Field } from '@/components/common';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>;

/**
 * Two-step reset. Requesting a token returns a message; in the backend's debug
 * mode the reset_token is returned in the response and pre-filled here so the
 * flow is testable without email wired up (mirrors genz-web).
 */
export default function ForgotPasswordScreen() {
  const nav = useNavigation<Nav>();
  const [phase, setPhase] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function requestToken() {
    setError(null);
    setMessage(null);
    if (!email.trim()) return setError('Enter your email.');
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email.trim());
      setMessage(res.message);
      if (res.reset_token) setToken(res.reset_token); // debug convenience
      setPhase('reset');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not send reset instructions.');
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword() {
    setError(null);
    if (!token.trim() || !password) return setError('Enter the reset token and a new password.');
    if (password !== confirm) return setError('Passwords do not match.');
    setLoading(true);
    try {
      const res = await authApi.resetPassword({
        token: token.trim(),
        email: email.trim(),
        password,
        password_confirmation: confirm,
      });
      setMessage(res.message);
      setTimeout(() => nav.replace('Login'), 800);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not reset your password.');
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
        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.sub}>
          {phase === 'request'
            ? "Enter your email and we'll send reset instructions."
            : 'Enter the reset token and choose a new password.'}
        </Text>

        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          editable={phase === 'request'}
        />

        {phase === 'reset' && (
          <>
            <Field label="Reset token" value={token} onChangeText={setToken} placeholder="Paste token" autoCapitalize="none" />
            <Field label="New password" value={password} onChangeText={setPassword} placeholder="At least 6 characters" secureTextEntry />
            <Field label="Confirm password" value={confirm} onChangeText={setConfirm} placeholder="Repeat password" secureTextEntry />
          </>
        )}

        {message ? <Text style={styles.message}>{message}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={{ marginTop: 16 }}>
          {phase === 'request' ? (
            <Button title="Send reset instructions" onPress={requestToken} loading={loading} />
          ) : (
            <Button title="Reset password" onPress={resetPassword} loading={loading} />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing(6), paddingTop: spacing(8) },
  title: { fontFamily: fonts.display, fontSize: 34, color: colors.text, letterSpacing: 0.5 },
  sub: { fontFamily: fonts.body, color: colors.textDim, fontSize: 15, marginBottom: 24, marginTop: 4 },
  message: { color: colors.success, fontFamily: fonts.bodyMedium, fontSize: 14, marginTop: 12 },
  error: { color: colors.red, fontFamily: fonts.bodyMedium, fontSize: 14, marginTop: 12 },
});
