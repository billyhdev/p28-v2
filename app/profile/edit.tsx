import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api, getUserFacingError, isApiError } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/contexts/LocaleContext';
import { authScreenStyles } from '@/components/auth/authScreenStyles';
import { Avatar, Button, Input } from '@/components/primitives';
import { authScreen, colors, radius, spacing, typography } from '@/theme/tokens';
import type { Profile, ProfileUpdates } from '@/lib/api';

/** Same options as onboarding preferred language field. */
const LANGUAGE_OPTIONS: { value: string; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'km', label: 'Khmer' },
  { value: 'ko', label: 'Korean' },
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
  const selectedLabel = LANGUAGE_OPTIONS.find((o) => o.value === value)?.label;
  return (
    <>
      <Text style={styles.label}>Preferred language</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Preferred language"
        accessibilityHint="Opens a list of language options"
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[styles.select, disabled ? styles.selectDisabled : null]}
      >
        <Text
          style={[styles.selectText, !selectedLabel ? styles.placeholderText : null]}
          numberOfLines={1}
        >
          {selectedLabel ?? 'Select language'}
        </Text>
        <FontAwesome
          name="chevron-down"
          size={14}
          color={colors.textSecondary}
          style={styles.selectIcon}
        />
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Preferred language</Text>
            <Button title="Done" variant="text" onPress={() => setOpen(false)} />
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
      setError('Permission to access photos is required.');
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
            accessibilityLabel="Profile photo"
            key={localPreviewUri ?? avatarUrl ?? 'fallback'}
          />
          <Pressable
            onPress={pickImage}
            disabled={isSubmitting}
            style={({ pressed }) => [
              styles.editPhotoButton,
              pressed && styles.editPhotoButtonPressed,
            ]}
            accessibilityLabel="Change profile photo"
            accessibilityHint="Opens photo library to choose a new profile picture"
          >
            <FontAwesome name="pencil" size={14} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>
      <Input
        label="Display name"
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="How you'd like to be called"
        inputStyle={styles.shortInput}
        accessibilityLabel="Display name"
      />
      <Input
        label="Bio"
        value={bio}
        onChangeText={setBio}
        placeholder="Tell others about yourself (optional)"
        multiline
        numberOfLines={12}
        inputStyle={styles.bioInput}
        textAlignVertical="top"
        accessibilityLabel="Bio"
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
        title={isSubmitting ? 'Saving…' : 'Save'}
        onPress={handleSave}
        disabled={isSubmitting || !hasChanges}
        style={authScreenStyles.ctaButton}
        accessibilityLabel="Save"
        accessibilityHint={
          hasChanges ? 'Saves profile changes' : 'Save is disabled until you make changes'
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  avatarSection: { alignItems: 'center', marginBottom: spacing.xl },
  avatarWrapper: { position: 'relative' as const },
  editPhotoButton: {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  editPhotoButtonPressed: { opacity: 0.8 },
  label: { ...typography.label, color: colors.textPrimary, marginBottom: spacing.xs },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.surfaceHighlight,
    backgroundColor: colors.surface,
    borderRadius: radius.button,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
  },
  selectDisabled: { opacity: 0.7 },
  selectText: { ...typography.body, color: colors.textPrimary, flex: 1 },
  selectIcon: { marginLeft: spacing.sm },
  placeholderText: { color: colors.textSecondary },
  shortInput: { minHeight: authScreen.ctaMinHeight },
  bioInput: { minHeight: 320, paddingTop: spacing.md },
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
  modalItemTextActive: { color: colors.primary, fontWeight: '600' as const },
  errorText: { ...typography.caption, color: colors.error, marginBottom: spacing.sm },
});
