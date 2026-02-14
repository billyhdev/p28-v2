import React, { useMemo, useState, useEffect } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';

import { AuthFormLayout } from '@/components/auth/AuthFormLayout';
import { authScreenStyles } from '@/components/auth/authScreenStyles';
import { Button, Input } from '@/components/primitives';
import { useLocale } from '@/contexts/LocaleContext';
import { useAuth } from '@/hooks/useAuth';
import { usePendingSignUp } from '@/contexts/PendingSignUpContext';
import { api, auth } from '@/lib/api';
import { getUserFacingError } from '@/lib/errors';
import type { ApiError } from '@/lib/api/contracts/errors';
import { authScreen, colors, radius, spacing, typography } from '@/theme/tokens';

type Option = { value: string; label: string };

/** Common countries (ISO 3166-1 alpha-2), alphabetically by label. */
const COUNTRY_OPTIONS: Option[] = [
  { value: 'AF', label: 'Afghanistan' },
  { value: 'AL', label: 'Albania' },
  { value: 'DZ', label: 'Algeria' },
  { value: 'AR', label: 'Argentina' },
  { value: 'AM', label: 'Armenia' },
  { value: 'AU', label: 'Australia' },
  { value: 'AT', label: 'Austria' },
  { value: 'AZ', label: 'Azerbaijan' },
  { value: 'BH', label: 'Bahrain' },
  { value: 'BD', label: 'Bangladesh' },
  { value: 'BY', label: 'Belarus' },
  { value: 'BE', label: 'Belgium' },
  { value: 'BZ', label: 'Belize' },
  { value: 'BJ', label: 'Benin' },
  { value: 'BT', label: 'Bhutan' },
  { value: 'BO', label: 'Bolivia' },
  { value: 'BA', label: 'Bosnia and Herzegovina' },
  { value: 'BW', label: 'Botswana' },
  { value: 'BR', label: 'Brazil' },
  { value: 'BN', label: 'Brunei' },
  { value: 'BG', label: 'Bulgaria' },
  { value: 'KH', label: 'Cambodia' },
  { value: 'CM', label: 'Cameroon' },
  { value: 'CA', label: 'Canada' },
  { value: 'CL', label: 'Chile' },
  { value: 'CN', label: 'China' },
  { value: 'CO', label: 'Colombia' },
  { value: 'CR', label: 'Costa Rica' },
  { value: 'HR', label: 'Croatia' },
  { value: 'CU', label: 'Cuba' },
  { value: 'CY', label: 'Cyprus' },
  { value: 'CZ', label: 'Czech Republic' },
  { value: 'DK', label: 'Denmark' },
  { value: 'EC', label: 'Ecuador' },
  { value: 'EG', label: 'Egypt' },
  { value: 'SV', label: 'El Salvador' },
  { value: 'EE', label: 'Estonia' },
  { value: 'ET', label: 'Ethiopia' },
  { value: 'FJ', label: 'Fiji' },
  { value: 'FI', label: 'Finland' },
  { value: 'FR', label: 'France' },
  { value: 'GE', label: 'Georgia' },
  { value: 'DE', label: 'Germany' },
  { value: 'GH', label: 'Ghana' },
  { value: 'GR', label: 'Greece' },
  { value: 'GT', label: 'Guatemala' },
  { value: 'HN', label: 'Honduras' },
  { value: 'HK', label: 'Hong Kong' },
  { value: 'HU', label: 'Hungary' },
  { value: 'IS', label: 'Iceland' },
  { value: 'IN', label: 'India' },
  { value: 'ID', label: 'Indonesia' },
  { value: 'IR', label: 'Iran' },
  { value: 'IQ', label: 'Iraq' },
  { value: 'IE', label: 'Ireland' },
  { value: 'IL', label: 'Israel' },
  { value: 'IT', label: 'Italy' },
  { value: 'JM', label: 'Jamaica' },
  { value: 'JP', label: 'Japan' },
  { value: 'JO', label: 'Jordan' },
  { value: 'KZ', label: 'Kazakhstan' },
  { value: 'KE', label: 'Kenya' },
  { value: 'KW', label: 'Kuwait' },
  { value: 'KG', label: 'Kyrgyzstan' },
  { value: 'LA', label: 'Laos' },
  { value: 'LV', label: 'Latvia' },
  { value: 'LB', label: 'Lebanon' },
  { value: 'LY', label: 'Libya' },
  { value: 'LT', label: 'Lithuania' },
  { value: 'LU', label: 'Luxembourg' },
  { value: 'MO', label: 'Macau' },
  { value: 'MY', label: 'Malaysia' },
  { value: 'MT', label: 'Malta' },
  { value: 'MX', label: 'Mexico' },
  { value: 'MD', label: 'Moldova' },
  { value: 'MN', label: 'Mongolia' },
  { value: 'ME', label: 'Montenegro' },
  { value: 'MA', label: 'Morocco' },
  { value: 'MM', label: 'Myanmar' },
  { value: 'NP', label: 'Nepal' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'NZ', label: 'New Zealand' },
  { value: 'NG', label: 'Nigeria' },
  { value: 'KP', label: 'North Korea' },
  { value: 'MK', label: 'North Macedonia' },
  { value: 'NO', label: 'Norway' },
  { value: 'OM', label: 'Oman' },
  { value: 'PK', label: 'Pakistan' },
  { value: 'PS', label: 'Palestine' },
  { value: 'PA', label: 'Panama' },
  { value: 'PG', label: 'Papua New Guinea' },
  { value: 'PY', label: 'Paraguay' },
  { value: 'PE', label: 'Peru' },
  { value: 'PH', label: 'Philippines' },
  { value: 'PL', label: 'Poland' },
  { value: 'PT', label: 'Portugal' },
  { value: 'PR', label: 'Puerto Rico' },
  { value: 'QA', label: 'Qatar' },
  { value: 'RO', label: 'Romania' },
  { value: 'RU', label: 'Russia' },
  { value: 'RW', label: 'Rwanda' },
  { value: 'SA', label: 'Saudi Arabia' },
  { value: 'RS', label: 'Serbia' },
  { value: 'SG', label: 'Singapore' },
  { value: 'SK', label: 'Slovakia' },
  { value: 'SI', label: 'Slovenia' },
  { value: 'ZA', label: 'South Africa' },
  { value: 'KR', label: 'South Korea' },
  { value: 'SS', label: 'South Sudan' },
  { value: 'ES', label: 'Spain' },
  { value: 'LK', label: 'Sri Lanka' },
  { value: 'SE', label: 'Sweden' },
  { value: 'CH', label: 'Switzerland' },
  { value: 'SY', label: 'Syria' },
  { value: 'TW', label: 'Taiwan' },
  { value: 'TJ', label: 'Tajikistan' },
  { value: 'TH', label: 'Thailand' },
  { value: 'TL', label: 'Timor-Leste' },
  { value: 'TR', label: 'Turkey' },
  { value: 'TM', label: 'Turkmenistan' },
  { value: 'UA', label: 'Ukraine' },
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'US', label: 'United States' },
  { value: 'UZ', label: 'Uzbekistan' },
  { value: 'VE', label: 'Venezuela' },
  { value: 'VN', label: 'Vietnam' },
  { value: 'YE', label: 'Yemen' },
  { value: 'ZW', label: 'Zimbabwe' },
];

const LANGUAGE_OPTIONS: Option[] = [
  { value: 'en', label: 'English' },
  { value: 'km', label: 'Khmer' },
  { value: 'ko', label: 'Korean' },
];

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

function formatDateToYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateForDisplay(isoDate: string): string {
  const date = new Date(isoDate + 'T12:00:00');
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function BirthDateField({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerDate =
    value && isIsoDate(value) ? new Date(value + 'T12:00:00') : new Date(2000, 0, 1);

  const handleChange = (_event: { type: string }, selectedDate: Date | undefined) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selectedDate) {
      onChange(formatDateToYYYYMMDD(selectedDate));
    }
  };

  const handlePress = () => {
    if (disabled) return;
    setShowPicker(true);
  };

  return (
    <View style={authScreenStyles.inputSpacing}>
      <Text style={styles.label}>Birth date</Text>
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        style={[styles.select, disabled ? styles.selectDisabled : null]}
        accessibilityRole="button"
        accessibilityLabel="Birth date"
        accessibilityHint="Opens date picker"
      >
        <Text style={[styles.selectText, !value ? styles.placeholderText : null]}>
          {value ? formatDateForDisplay(value) : 'Select date (optional)'}
        </Text>
      </Pressable>
      {showPicker && (
        <>
          {Platform.OS === 'ios' && (
            <View style={styles.datePickerRow}>
              <Button title="Done" variant="text" onPress={() => setShowPicker(false)} />
            </View>
          )}
          <DateTimePicker
            value={pickerDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleChange}
            maximumDate={new Date()}
          />
        </>
      )}
    </View>
  );
}

function SelectField({
  label,
  value,
  placeholder,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string | null;
  placeholder: string;
  options: Option[];
  disabled?: boolean;
  onChange: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((o) => o.value === value)?.label;
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint="Opens a list of options"
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[styles.select, disabled ? styles.selectDisabled : null]}
      >
        <Text style={[styles.selectText, !selectedLabel ? styles.placeholderText : null]}>
          {selectedLabel ?? placeholder}
        </Text>
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{label}</Text>
            <Button title="Done" variant="text" onPress={() => setOpen(false)} />
          </View>
          <ScrollView contentContainerStyle={styles.modalList}>
            {options.map((opt) => {
              const active = opt.value === value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  style={[styles.modalItem, active ? styles.modalItemActive : null]}
                >
                  <Text style={[styles.modalItemText, active ? styles.modalItemTextActive : null]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

export default function OnboardingScreen() {
  const { session } = useAuth();
  const { setLocale } = useLocale();
  const { pendingSignUp, clearPendingSignUp } = usePendingSignUp();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [country, setCountry] = useState<string | null>(null);
  const [preferredLanguage, setPreferredLanguage] = useState<string | null>('en');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // User must have either pending sign-up (from sign-up screen) or existing session
  useEffect(() => {
    if (!pendingSignUp && !session?.user?.id) {
      router.replace('/auth/sign-in');
    }
  }, [pendingSignUp, session?.user?.id]);

  const canSubmit = useMemo(() => {
    if (!firstName.trim() || !lastName.trim()) return false;
    if (birthDate.trim() && !isIsoDate(birthDate)) return false;
    return true;
  }, [firstName, lastName, birthDate]);

  async function handleSubmit() {
    setError(null);
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter your first and last name.');
      return;
    }
    if (birthDate.trim() && !isIsoDate(birthDate)) {
      setError('Birth date must be in YYYY-MM-DD format.');
      return;
    }

    let userId: string | null = session?.user?.id ?? pendingSignUp?.userId ?? null;

    if (pendingSignUp && !userId) {
      setIsSubmitting(true);
      const signUpResult = await auth.signUp(pendingSignUp.email, pendingSignUp.password);
      if ('error' in signUpResult) {
        const err = signUpResult.error as ApiError;
        if (err.code === 'EMAIL_CONFIRMATION_REQUIRED') {
          clearPendingSignUp();
          setError('Please check your email to confirm your account, then sign in.');
          setIsSubmitting(false);
          return;
        }
        setError(getUserFacingError(err));
        setIsSubmitting(false);
        return;
      }
      userId = signUpResult.session?.user?.id ?? null;
      clearPendingSignUp();
    } else if (pendingSignUp?.userId) {
      clearPendingSignUp();
    }

    if (!userId) {
      setError('Something went wrong. Please try signing in.');
      setIsSubmitting(false);
      return;
    }

    const result = await api.data.createProfile(userId, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthDate: birthDate.trim() ? birthDate.trim() : undefined,
      country: country ?? undefined,
      preferredLanguage: preferredLanguage ?? undefined,
    });
    setIsSubmitting(false);

    if ('message' in result) {
      setError(getUserFacingError(result));
      return;
    }

    if (result.preferredLanguage) setLocale(result.preferredLanguage);
    router.replace('/(tabs)');
  }

  function handleBackToSignIn() {
    clearPendingSignUp();
    router.replace('/auth/sign-in');
  }

  return (
    <AuthFormLayout
      title="About you"
      subtitle="First name, last name, and a few optional details so we can personalize your experience."
      contentContainerStyle={{ paddingBottom: spacing.xl * 2 }}
      footer={
        <Button
          title="Back to sign in"
          onPress={handleBackToSignIn}
          variant="text"
          disabled={isSubmitting}
          style={authScreenStyles.secondaryCtaButton}
          accessibilityLabel="Back to sign in"
          accessibilityHint="Returns to the sign in screen"
        />
      }
    >
      <Input
        label="First name"
        value={firstName}
        onChangeText={setFirstName}
        placeholder="First name"
        editable={!isSubmitting}
        containerStyle={authScreenStyles.inputSpacing}
        inputStyle={authScreen.inputStyle}
      />
      <Input
        label="Last name"
        value={lastName}
        onChangeText={setLastName}
        placeholder="Last name"
        editable={!isSubmitting}
        containerStyle={authScreenStyles.inputSpacing}
        inputStyle={authScreen.inputStyle}
      />
      <BirthDateField value={birthDate} onChange={setBirthDate} disabled={isSubmitting} />

      <View style={authScreenStyles.inputSpacing}>
        <SelectField
          label="Country of residence"
          value={country}
          placeholder="Select country (optional)"
          options={COUNTRY_OPTIONS}
          disabled={isSubmitting}
          onChange={setCountry}
        />
      </View>
      <View style={authScreenStyles.inputSpacing}>
        <SelectField
          label="Preferred language"
          value={preferredLanguage}
          placeholder="Select language"
          options={LANGUAGE_OPTIONS}
          disabled={isSubmitting}
          onChange={setPreferredLanguage}
        />
      </View>

      {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

      <Button
        title={isSubmitting ? 'Saving…' : 'Continue'}
        onPress={handleSubmit}
        disabled={isSubmitting || !canSubmit}
        style={authScreenStyles.ctaButton}
        accessibilityLabel="Continue"
        accessibilityHint="Creates your profile and continues to the app"
      />
    </AuthFormLayout>
  );
}

const styles = StyleSheet.create({
  errorBanner: { ...typography.caption, color: colors.error, marginBottom: spacing.sm },
  label: { ...typography.label, color: colors.textPrimary, marginTop: spacing.xs },
  datePickerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  select: {
    borderWidth: 1,
    borderColor: colors.surfaceHighlight,
    backgroundColor: colors.surface,
    borderRadius: radius.button,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
  },
  selectDisabled: { opacity: 0.7 },
  selectText: { ...typography.body, color: colors.textPrimary },
  placeholderText: { color: colors.textSecondary },
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceHighlight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: { ...typography.h2, color: colors.textPrimary },
  modalList: { padding: spacing.lg, gap: spacing.sm },
  modalItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.button,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceHighlight,
  },
  modalItemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  modalItemText: { ...typography.body, color: colors.textPrimary },
  modalItemTextActive: { color: colors.primary, fontWeight: '600' },
});
