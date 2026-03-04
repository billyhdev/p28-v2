import { auth } from '@/lib/api';
import { getUserFacingError } from '@/lib/errors';
import type { ApiError } from '@/lib/api/contracts/errors';
import { AuthFormLayout } from '@/components/auth/AuthFormLayout';
import { authScreenStyles } from '@/components/auth/authScreenStyles';
import { Button, Input } from '@/components/primitives';
import { usePendingSignUp } from '@/contexts/PendingSignUpContext';
import { t } from '@/lib/i18n';
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
      title={t('auth.createAccount')}
      subtitle={t('auth.createAccountSubtitle')}
      footer={
        <Button
          title={t('auth.alreadyHaveAccountSignIn')}
          onPress={() => router.back()}
          variant="text"
          disabled={isSubmitting}
          style={authScreenStyles.secondaryCtaButton}
          accessibilityLabel={t('auth.alreadyHaveAccountSignIn')}
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
        title={isSubmitting ? t('auth.checking') : t('common.continue')}
        onPress={handleSubmit}
        disabled={!canSubmit || isSubmitting}
        style={authScreenStyles.ctaButton}
        accessibilityLabel={t('common.continue')}
        accessibilityHint="Continues to the onboarding screen"
      />
    </AuthFormLayout>
  );
}
