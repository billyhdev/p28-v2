import { auth } from '@/lib/api';
import { getUserFacingError } from '@/lib/errors';
import type { ApiError } from '@/lib/api/contracts/errors';
import { AuthFormLayout } from '@/components/auth/AuthFormLayout';
import { authScreenStyles } from '@/components/auth/authScreenStyles';
import { Button, Input } from '@/components/primitives';
import { authScreen } from '@/theme/tokens';
import { router } from 'expo-router';
import React, { useState } from 'react';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setEmailError(null);
    setPasswordError(null);
    if (!email.trim()) {
      setEmailError('Please enter your email.');
      return;
    }
    if (!password) {
      setPasswordError('Please enter your password.');
      return;
    }
    setIsSubmitting(true);
    const result = await auth.signIn(email.trim(), password);
    setIsSubmitting(false);
    if ('error' in result) {
      setPasswordError(getUserFacingError(result.error as ApiError));
      return;
    }
    router.replace('/(tabs)');
  }

  return (
    <AuthFormLayout
      title="Sign in"
      subtitle="Use your email and password to sign in."
      footer={
        <Button
          title="Create an account"
          onPress={() => router.push('/auth/sign-up')}
          variant="text"
          disabled={isSubmitting}
          style={authScreenStyles.secondaryCtaButton}
          accessibilityLabel="Create an account"
          accessibilityHint="Navigates to the sign up screen"
        />
      }
    >
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        editable={!isSubmitting}
        error={emailError ?? undefined}
        containerStyle={authScreenStyles.inputSpacing}
        inputStyle={authScreen.inputStyle}
      />
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        secureTextEntry
        autoComplete="password"
        editable={!isSubmitting}
        error={passwordError ?? undefined}
        containerStyle={authScreenStyles.inputSpacing}
        inputStyle={authScreen.inputStyle}
      />
      <Button
        title={isSubmitting ? 'Signing in…' : 'Sign in'}
        onPress={handleSubmit}
        disabled={isSubmitting}
        style={authScreenStyles.ctaButton}
        accessibilityLabel="Sign in"
        accessibilityHint="Submits the sign in form with your email and password"
      />
    </AuthFormLayout>
  );
}
