/**
 * Sends Expo push notifications for a published group announcement and records deliveries.
 * Service role is used for DB reads/writes (RLS blocks broad client access to deliveries).
 *
 * Invoke (user JWT): POST { announcementId } — caller must be a group admin for that announcement's group.
 * Idempotent per user: skips users who already have an announcement_deliveries row; retries can complete partial sends.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.95.3';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

type AnnouncementRow = {
  id: string;
  group_id: string;
  title: string;
  body: string;
  meeting_link?: string | null;
};

type ExpoPushResult = { status?: string; id?: string; message?: string };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !serviceKey) {
      return json({ error: 'Missing Supabase configuration' }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const announcementId =
      typeof body.announcementId === 'string' ? body.announcementId : undefined;

    if (!announcementId) {
      return json({ error: 'announcementId required' }, 400);
    }

    const authHeader = req.headers.get('Authorization');
    const jwt = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!jwt) {
      return json({ error: 'Unauthorized' }, 401);
    }

    // Validate JWT via GoTrue (works with JWT signing keys). Gateway verify_jwt is disabled for this
    // function because Supabase edge verify_jwt can 401 asymmetric / rotated user tokens.
    const apikey = anonKey ?? serviceKey;
    const authUserUrl = `${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`;
    const userRes = await fetch(authUserUrl, {
      headers: {
        Authorization: `Bearer ${jwt}`,
        apikey,
        Accept: 'application/json',
        'X-Supabase-Api-Version': '2024-01-01',
      },
    });
    if (!userRes.ok) {
      return json({ error: 'Unauthorized' }, 401);
    }
    const userPayload = (await userRes.json().catch(() => null)) as { id?: string } | null;
    const userId = userPayload?.id;
    if (!userId || typeof userId !== 'string') {
      return json({ error: 'Unauthorized' }, 401);
    }

    const { data: annMeta, error: metaErr } = await supabase
      .from('announcements')
      .select('id, group_id, status')
      .eq('id', announcementId)
      .maybeSingle();
    if (metaErr || !annMeta) {
      return json({ error: 'Announcement not found' }, 404);
    }
    if (annMeta.status !== 'published') {
      return json({ error: 'Announcement is not published' }, 400);
    }

    const { data: adminRow, error: adminErr } = await supabase
      .from('group_admins')
      .select('user_id')
      .eq('group_id', annMeta.group_id)
      .eq('user_id', userId)
      .maybeSingle();
    if (adminErr || !adminRow) {
      return json({ error: 'Forbidden' }, 403);
    }

    const err = await sendAnnouncementPushes(supabase, announcementId);
    if (err) return json({ error: err }, 400);
    return json({ ok: true });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

async function sendAnnouncementPushes(
  supabase: ReturnType<typeof createClient>,
  announcementId: string
): Promise<string | null> {
  const { data: ann, error: fetchErr } = await supabase
    .from('announcements')
    .select('id, group_id, title, body, meeting_link')
    .eq('id', announcementId)
    .eq('status', 'published')
    .maybeSingle();

  if (fetchErr) return fetchErr.message;
  if (!ann) return 'Announcement not found';

  const row = ann as AnnouncementRow;

  const { data: members, error: mErr } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', row.group_id);
  if (mErr) return mErr.message;

  const userIds = (members ?? []).map((m: { user_id: string }) => m.user_id);
  if (userIds.length === 0) return null;

  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('user_id, announcements_enabled')
    .in('user_id', userIds);

  const prefMap = new Map<string, boolean>(
    (prefs ?? []).map((p: { user_id: string; announcements_enabled: boolean }) => [
      p.user_id,
      p.announcements_enabled,
    ])
  );

  const { data: gmSettings } = await supabase
    .from('group_member_settings')
    .select('user_id, announcements_enabled')
    .eq('group_id', row.group_id)
    .in('user_id', userIds);

  const gmsMap = new Map<string, boolean>(
    (gmSettings ?? []).map((r: { user_id: string; announcements_enabled: boolean }) => [
      r.user_id,
      r.announcements_enabled,
    ])
  );

  const eligible = userIds.filter((uid) => {
    const globalOn = prefMap.get(uid) ?? true;
    const groupOn = gmsMap.get(uid) ?? true;
    return globalOn && groupOn;
  });

  if (eligible.length === 0) return null;

  const { data: tokenRows, error: tErr } = await supabase
    .from('push_tokens')
    .select('user_id, token')
    .in('user_id', eligible);
  if (tErr) return tErr.message;

  const { data: deliveredRows } = await supabase
    .from('announcement_deliveries')
    .select('user_id')
    .eq('announcement_id', announcementId)
    .in('user_id', eligible);

  const alreadyDelivered = new Set(
    (deliveredRows ?? []).map((d: { user_id: string }) => d.user_id)
  );

  /** One Expo message per token; track user for delivery rows. */
  const messages: Array<{
    to: string;
    userId: string;
    sound: 'default';
    title: string;
    body: string;
    data: { groupId: string; announcementId: string; meetingLink?: string };
    channelId: string;
  }> = [];

  const seenToken = new Set<string>();
  for (const tr of tokenRows ?? []) {
    const uid = tr.user_id as string;
    const to = tr.token as string;
    if (alreadyDelivered.has(uid)) continue;
    if (!to || seenToken.has(to)) continue;
    seenToken.add(to);
    const link = row.meeting_link?.trim();
    messages.push({
      to,
      userId: uid,
      sound: 'default',
      title: row.title,
      body: row.body.length > 200 ? `${row.body.slice(0, 197)}...` : row.body,
      data: {
        groupId: row.group_id,
        announcementId: row.id,
        ...(link ? { meetingLink: link } : {}),
      },
      channelId: 'announcements',
    });
  }

  if (messages.length === 0) {
    return null;
  }

  const now = new Date().toISOString();
  const sentUserIds = new Set<string>();
  const chunkSize = 99;

  for (let i = 0; i < messages.length; i += chunkSize) {
    const chunk = messages.slice(i, i + chunkSize);
    const payload = chunk.map(({ userId: _u, ...rest }) => rest);

    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });

    const rawText = await res.text();
    let parsed: { data?: ExpoPushResult[] } = {};
    try {
      parsed = JSON.parse(rawText) as { data?: ExpoPushResult[] };
    } catch {
      console.error('Expo push non-JSON response', res.status, rawText);
      continue;
    }

    if (!res.ok) {
      console.error('Expo push error', res.status, rawText);
      continue;
    }

    const results = parsed.data;
    if (!Array.isArray(results)) {
      console.error('Expo push missing data array', rawText);
      continue;
    }

    chunk.forEach((msg, idx) => {
      const r = results[idx];
      if (r && r.status === 'ok') {
        sentUserIds.add(msg.userId);
      } else if (r && r.status === 'error') {
        console.error('Expo ticket error', msg.to.slice(0, 24), r.message ?? r);
      }
    });
  }

  if (sentUserIds.size === 0) {
    console.error('send-announcement: no successful Expo tickets for', announcementId);
    return null;
  }

  const deliveryRows = [...sentUserIds].map((user_id) => ({
    announcement_id: row.id,
    user_id,
    status: 'sent' as const,
    delivered_at: now,
  }));

  const { error: delErr } = await supabase.from('announcement_deliveries').upsert(deliveryRows, {
    onConflict: 'announcement_id,user_id',
  });
  if (delErr) console.error('announcement_deliveries upsert', delErr);

  return null;
}
