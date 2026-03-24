/**
 * Sends Expo push notifications when a group event is created.
 * Service role is used for DB reads. Caller must be a group admin for the event's group.
 *
 * Invoke (user JWT): POST { eventId } — best-effort Expo send; no delivery log (v1).
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

type GroupEventRow = {
  id: string;
  group_id: string;
  title: string;
  starts_at: string;
  created_by_user_id: string;
  status: string;
};

type ExpoPushResult = { status?: string; id?: string; message?: string };

function formatEventStart(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

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
    const eventId = typeof body.eventId === 'string' ? body.eventId : undefined;

    if (!eventId) {
      return json({ error: 'eventId required' }, 400);
    }

    const authHeader = req.headers.get('Authorization');
    const jwt = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!jwt) {
      return json({ error: 'Unauthorized' }, 401);
    }

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

    const { data: evMeta, error: metaErr } = await supabase
      .from('group_events')
      .select('id, group_id, status')
      .eq('id', eventId)
      .maybeSingle();
    if (metaErr || !evMeta) {
      return json({ error: 'Event not found' }, 404);
    }
    if (evMeta.status !== 'active') {
      return json({ error: 'Event is not active' }, 400);
    }

    const { data: adminRow, error: adminErr } = await supabase
      .from('group_admins')
      .select('user_id')
      .eq('group_id', evMeta.group_id)
      .eq('user_id', userId)
      .maybeSingle();
    if (adminErr || !adminRow) {
      return json({ error: 'Forbidden' }, 403);
    }

    const result = await sendGroupEventCreatedPushes(supabase, eventId);
    if ('error' in result) return json({ error: result.error }, 400);
    return json({ ok: true, ...result.stats });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

type PushSendResult =
  | { error: string }
  | {
      stats: {
        eligibleMembers: number;
        messagesQueued: number;
        ticketsOk: number;
        ticketErrors: string[];
      };
    };

async function sendGroupEventCreatedPushes(
  supabase: ReturnType<typeof createClient>,
  eventId: string
): Promise<PushSendResult> {
  const { data: row, error: fetchErr } = await supabase
    .from('group_events')
    .select('id, group_id, title, starts_at, created_by_user_id, status')
    .eq('id', eventId)
    .eq('status', 'active')
    .maybeSingle();

  if (fetchErr) return { error: fetchErr.message };
  if (!row) return { error: 'Event not found' };

  const ev = row as GroupEventRow;

  const { data: members, error: mErr } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', ev.group_id);
  if (mErr) return { error: mErr.message };

  /** Include creator so the admin's device still gets a push when testing solo. */
  const userIds = (members ?? []).map((m: { user_id: string }) => m.user_id);
  if (userIds.length === 0) {
    return {
      stats: {
        eligibleMembers: 0,
        messagesQueued: 0,
        ticketsOk: 0,
        ticketErrors: [],
      },
    };
  }

  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('user_id, events_enabled')
    .in('user_id', userIds);

  const prefMap = new Map<string, boolean>(
    (prefs ?? []).map((p: { user_id: string; events_enabled: boolean }) => [
      p.user_id,
      p.events_enabled,
    ])
  );

  const eligible = userIds.filter((uid) => prefMap.get(uid) ?? true);
  if (eligible.length === 0) {
    return {
      stats: {
        eligibleMembers: 0,
        messagesQueued: 0,
        ticketsOk: 0,
        ticketErrors: [],
      },
    };
  }

  const { data: tokenRows, error: tErr } = await supabase
    .from('push_tokens')
    .select('user_id, token')
    .in('user_id', eligible);
  if (tErr) return { error: tErr.message };

  const when = formatEventStart(ev.starts_at);
  const pushTitle = 'New group event';
  const pushBody = when.length > 0 ? `${ev.title}\nStarts ${when}` : ev.title;

  /**
   * Omit channelId: Expo uses a default channel that always exists. A named channel
   * (e.g. "events") that was never created on the device causes Android to drop the notification.
   */
  const dataPayload = {
    type: 'group_event',
    eventId: ev.id,
    groupId: ev.group_id,
  } as const;

  const messages: Array<{
    to: string;
    userId: string;
    sound: 'default';
    title: string;
    body: string;
    priority: 'high';
    data: Record<string, string>;
  }> = [];

  const seenToken = new Set<string>();
  for (const tr of tokenRows ?? []) {
    const uid = tr.user_id as string;
    const to = tr.token as string;
    if (!to || seenToken.has(to)) continue;
    seenToken.add(to);
    messages.push({
      to,
      userId: uid,
      sound: 'default',
      title: pushTitle,
      body: pushBody.length > 200 ? `${pushBody.slice(0, 197)}...` : pushBody,
      priority: 'high',
      data: {
        type: dataPayload.type,
        eventId: String(dataPayload.eventId),
        groupId: String(dataPayload.groupId),
      },
    });
  }

  if (messages.length === 0) {
    return {
      stats: {
        eligibleMembers: eligible.length,
        messagesQueued: 0,
        ticketsOk: 0,
        ticketErrors: [],
      },
    };
  }

  let ticketsOk = 0;
  const ticketErrors: string[] = [];
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
        ticketsOk += 1;
      } else if (r && r.status === 'error') {
        const line = r.message ?? JSON.stringify(r.details ?? r);
        console.error('Expo ticket error', msg.to.slice(0, 24), line);
        if (ticketErrors.length < 5) ticketErrors.push(line);
      }
    });
  }

  return {
    stats: {
      eligibleMembers: eligible.length,
      messagesQueued: messages.length,
      ticketsOk,
      ticketErrors,
    },
  };
}
