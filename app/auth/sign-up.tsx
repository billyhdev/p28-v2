import { auth } from '@/lib/api';
import { getUserFacingError } from '@/lib/errors';
import type { ApiError } from '@/lib/api/contracts/errors';
import { AuthFormLayout } from '@/components/auth/AuthFormLayout';
import { authScreenStyles } from '@/components/auth/authScreenStyles';
import { Button, Input } from '@/components/primitives';
import { usePendingSignUp } from '@/contexts/PendingSignUpContext';
import { authScreen } from '@/theme/tokens';
import { router } from 'expo-router';
import React, { useState } from 'react';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setPendingSignUp } = usePendingSignUp();

  const canSubmit = !!email.trim() && !!password && !!confirmPassword && password.length >= 6;

  async function handleSubmit() {
    setEmailError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);
    if (!email.trim()) {
      setEmailError('Please enter your email.');
      return;
    }
    if (!password) {
      setPasswordError('Please enter a password.');
      return;
    }
    if (password.length < 6) {
      setPasswordError('Password should be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
      return;
    }
    setIsSubmitting(true);
    const check = await auth.checkEmailAvailable(email.trim());
    setIsSubmitting(false);
    if ('error' in check) {
      setEmailError(getUserFacingError(check.error as ApiError));
      return;
    }
    if (!check.available) {
      setEmailError('An account with this email already exists. Please sign in instead.');
      return;
    }
    setPendingSignUp(email.trim(), password);
    router.replace('/auth/onboarding');
  }

  return (
    <AuthFormLayout
      title="Create account"
      subtitle="Enter your email and a password. We'll ask for a few details next."
      footer={
        <Button
          title="Already have an account? Sign in"
          onPress={() => router.back()}
          variant="text"
          disabled={isSubmitting}
          style={authScreenStyles.secondaryCtaButton}
          accessibilityLabel="Already have an account? Sign in"
          accessibilityHint="Navigates back to the sign in screen"
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
        placeholder="At least 6 characters"
        secureTextEntry
        autoComplete="new-password"
        editable={!isSubmitting}
        error={passwordError ?? undefined}
        containerStyle={authScreenStyles.inputSpacing}
        inputStyle={authScreen.inputStyle}
      />
      <Input
        label="Confirm password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Re-enter your password"
        secureTextEntry
        autoComplete="new-password"
        editable={!isSubmitting}
        error={confirmPasswordError ?? undefined}
        containerStyle={authScreenStyles.inputSpacing}
        inputStyle={authScreen.inputStyle}
      />
      <Button
        title={isSubmitting ? 'Checking…' : 'Continue'}
        onPress={handleSubmit}
        disabled={!canSubmit || isSubmitting}
        style={authScreenStyles.ctaButton}
        accessibilityLabel="Continue"
        accessibilityHint="Continues to the onboarding screen"
      />
    </AuthFormLayout>
  );
}
