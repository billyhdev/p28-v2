import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api, getUserFacingError, isApiError } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/contexts/LocaleContext';
import { t } from '@/lib/i18n';
import { authScreenStyles } from '@/components/auth/authScreenStyles';
import { Avatar, Button, Input } from '@/components/primitives';
import { authScreen, colors, radius, spacing, typography } from '@/theme/tokens';
import type { Profile, ProfileUpdates } from '@/lib/api';

/** Same options as onboarding preferred language field. Keys match lib/i18n language.* */
const LANGUAGE_OPTIONS: {
  value: string;
  labelKey: 'language.english' | 'language.korean' | 'language.khmer';
}[] = [
  { value: 'en', labelKey: 'language.english' },
  { value: 'km', labelKey: 'language.khmer' },
  { value: 'ko', labelKey: 'language.korean' },
];

function LanguageDropdown({
  value,
  onChange,
  disabled,
}: {
  value: string | null;
  onChange: (next: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabelKey = LANGUAGE_OPTIONS.find((o) => o.value === value)?.labelKey;
  return (
    <>
      <Text style={styles.label}>{t('profile.preferredLanguage')}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('profile.preferredLanguage')}
        accessibilityHint={t('profile.appLanguageHint')}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[styles.select, disabled ? styles.selectDisabled : null]}
      >
        <Text
          style={[styles.selectText, !selectedLabelKey ? styles.placeholderText : null]}
          numberOfLines={1}
        >
          {selectedLabelKey ? t(selectedLabelKey) : t('language.selectLanguage')}
        </Text>
        <FontAwesome
          name="chevron-down"
          size={14}
          color={colors.textSecondary}
          style={styles.selectIcon}
        />
      </Pressable>

      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('profile.preferredLanguage')}</Text>
            <Button
              title={t('common.done')}
              variant="text"
              onPress={() => setOpen(false)}
              accessibilityLabel={t('common.done')}
            />
          </View>
          <ScrollView contentContainerStyle={styles.modalList}>
            {LANGUAGE_OPTIONS.map((opt) => {
              const active = opt.value === value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  style={[styles.modalItem, active ? styles.modalItemActive : null]}
                  accessibilityRole="button"
                  accessibilityLabel={t(opt.labelKey)}
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.modalItemText, active ? styles.modalItemTextActive : null]}>
                    {t(opt.labelKey)}
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

export default function ProfileEditScreen() {
  const { session } = useAuth();
  const { setLocale } = useLocale();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState<string | undefined>(undefined);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
  /** Local file URI shown immediately after pick until upload completes. */
  const [localPreviewUri, setLocalPreviewUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = session?.user?.id;
  useEffect(() => {
    if (!userId) return;
    api.data.getProfile(userId).then((r) => {
      if (isApiError(r)) {
        setProfile(null);
        setPreferredLanguage(undefined);
      } else {
        setProfile(r);
        setDisplayName(r.displayName ?? '');
        setBio(r.bio ?? '');
        setAvatarUrl(r.avatarUrl);
        setPreferredLanguage(r.preferredLanguage);
      }
    });
  }, [userId]);

  const pickImage = async () => {
    if (!userId) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setError(t('profile.photoPermissionRequired'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      base64: true,
    });
    if (result.canceled || !result.assets[0]?.uri) return;
    const asset = result.assets[0];
    const pickedUri = asset.uri;
    setLocalPreviewUri(pickedUri);
    setError(null);
    setIsSubmitting(true);
    const uploadResult = await api.data.uploadProfileImage(
      userId,
      pickedUri,
      asset.base64 ?? undefined
    );
    setIsSubmitting(false);
    if (typeof uploadResult === 'string') {
      setAvatarUrl(uploadResult);
      // Keep local preview visible; remote URL may not render yet (e.g. cache/RLS). Cleared on next load.
    } else {
      setError(getUserFacingError(uploadResult));
      // Keep localPreviewUri so the selected image stays visible despite upload failure
    }
  };

  const hasChanges =
    (displayName.trim() || undefined) !== (profile?.displayName?.trim() || undefined) ||
    (bio || undefined) !== (profile?.bio ?? undefined) ||
    (preferredLanguage ?? undefined) !== (profile?.preferredLanguage ?? undefined) ||
    (avatarUrl ?? undefined) !== (profile?.avatarUrl ?? undefined);

  const handleSave = async () => {
    if (!userId) return;
    setIsSubmitting(true);
    setError(null);
    const updates: ProfileUpdates = {
      displayName: displayName.trim() || undefined,
      bio: bio || undefined,
      preferredLanguage: preferredLanguage || undefined,
    };
    if (avatarUrl) updates.avatarUrl = avatarUrl;
    const result = await api.data.updateProfile(userId, updates);
    setIsSubmitting(false);
    if (isApiError(result)) {
      setError(getUserFacingError(result));
    } else {
      if (result.preferredLanguage) setLocale(result.preferredLanguage);
      router.back();
    }
  };

  if (!userId) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarSection}>
        <View style={styles.avatarWrapper}>
          <Avatar
            source={
              localPreviewUri ? { uri: localPreviewUri } : avatarUrl ? { uri: avatarUrl } : null
            }
            fallbackText={displayName || profile?.displayName || session?.user?.email}
            size="xl"
            accessibilityLabel={t('profile.profilePhoto')}
            key={localPreviewUri ?? avatarUrl ?? 'fallback'}
          />
          <Pressable
            onPress={pickImage}
            disabled={isSubmitting}
            style={({ pressed }) => [
              styles.editPhotoButton,
              pressed && styles.editPhotoButtonPressed,
            ]}
            accessibilityLabel={t('profile.changePhoto')}
            accessibilityHint={t('profile.changePhotoHint')}
          >
            <FontAwesome name="pencil" size={14} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>
      <Input
        label={t('profile.displayName')}
        value={displayName}
        onChangeText={setDisplayName}
        placeholder={t('profile.displayNamePlaceholder')}
        inputStyle={styles.shortInput}
        accessibilityLabel={t('profile.displayName')}
      />
      <Input
        label={t('profile.bio')}
        value={bio}
        onChangeText={setBio}
        placeholder={t('profile.bioPlaceholderEdit')}
        multiline
        numberOfLines={12}
        inputStyle={styles.bioInput}
        textAlignVertical="top"
        accessibilityLabel={t('profile.bio')}
      />

      <View style={authScreenStyles.inputSpacing}>
        <LanguageDropdown
          value={preferredLanguage ?? null}
          onChange={setPreferredLanguage}
          disabled={isSubmitting}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <Button
        title={isSubmitting ? t('profile.saving') : t('common.save')}
        onPress={handleSave}
        disabled={isSubmitting || !hasChanges}
        style={authScreenStyles.ctaButton}
        accessibilityLabel={t('common.save')}
        accessibilityHint={hasChanges ? t('profile.saveHint') : t('profile.saveHintDisabled')}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  avatarSection: { alignItems: 'center', marginBottom: spacing.lg },
  avatarWrapper: { position: 'relative' as const },
  editPhotoButton: {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    minWidth: 44,
    minHeight: 44,
    borderRadius: 22,
    padding: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  editPhotoButtonPressed: { opacity: 0.8 },
  label: { ...typography.label, color: colors.textPrimary, marginBottom: spacing.xs },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    borderRadius: radius.button,
    paddingVertical: 14,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  selectDisabled: { opacity: 0.7 },
  selectText: { ...typography.body, color: colors.textPrimary, flex: 1 },
  selectIcon: { marginLeft: spacing.sm },
  placeholderText: { color: '#9DA3B3' },
  shortInput: { minHeight: authScreen.ctaMinHeight },
  bioInput: { minHeight: 300, paddingTop: spacing.sm },
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: { ...typography.h2, color: colors.textPrimary },
  modalList: { padding: spacing.lg, gap: spacing.sm },
  modalItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.button,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  modalItemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.brandSoft,
  },
  modalItemText: { ...typography.body, color: colors.textPrimary },
  modalItemTextActive: { color: colors.primary, fontWeight: '600' as const },
  errorText: { ...typography.caption, color: colors.error, marginBottom: spacing.sm },
});
