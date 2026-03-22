import { Stack } from 'expo-router';
import { useLocale } from '@/contexts/LocaleContext';
import { t } from '@/lib/i18n';

export default function MessagesTabLayout() {
  useLocale();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="friends"
        options={{
          title: t('messages.friendsList'),
          headerBackTitle: t('common.back'),
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: t('messages.newChat'),
          headerBackTitle: t('common.back'),
        }}
      />
      <Stack.Screen
        name="create-folder"
        options={{
          title: t('messages.createFolder'),
          headerBackTitle: t('common.back'),
        }}
      />
      <Stack.Screen
        name="add-chat-to-folder/[chatId]"
        options={{
          title: t('messages.addToFolder'),
          headerBackTitle: t('common.back'),
        }}
      />
      <Stack.Screen
        name="edit-folder/[folderId]"
        options={{
          title: t('messages.editFolder'),
          headerBackTitle: t('common.back'),
        }}
      />
      <Stack.Screen
        name="add-chats-to-folder/[folderId]"
        options={{
          title: t('messages.addToFolder'),
          headerBackTitle: t('common.back'),
        }}
      />
      <Stack.Screen
        name="chat/[id]"
        options={{
          title: '',
          headerBackTitle: t('common.back'),
        }}
      />
      <Stack.Screen
        name="chat/[id]/edit"
        options={{
          title: t('messages.editChat'),
          headerBackTitle: t('common.back'),
        }}
      />
      <Stack.Screen
        name="chat/[id]/manage-members"
        options={{
          title: t('messages.manageMembers'),
          headerBackTitle: t('common.back'),
        }}
      />
    </Stack>
  );
}
