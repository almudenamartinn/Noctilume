import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    id?: string;
    status?: string;
  } | null;

  if (!body || typeof body.id !== 'string' || !body.id || typeof body.status !== 'string') {
    return NextResponse.json({ error: 'A valid incident ID and status are required.' }, { status: 400 });
  }

  const { id, status } = body;
  if (!['unreported', 'reported', 'resolved'].includes(status)) {
    return NextResponse.json({ error: 'Invalid incident status.' }, { status: 400 });
  }

  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const color = status === 'resolved' ? '#10B981' : status === 'reported' ? '#F59E0B' : '#EF4444';

    const basePayload: Record<string, string> = { status, color };
    const updaterPayload: Record<string, string> = {};
    updaterPayload.updated_by = user.id;
    if (user.email) updaterPayload.updated_by_email = user.email;
    const name = user.user_metadata?.name || user.user_metadata?.full_name;
    if (typeof name === 'string' && name) updaterPayload.updated_by_name = name;

    let payload: Record<string, string> = { ...basePayload, ...updaterPayload };
    const { error } = await supabase.from('incidents').update(payload).eq('id', id);

    if (error) {
      const msg = error.message || '';
      if (/updated_by|updated_by_email|updated_by_name|Could not find the 'updated_by' column/i.test(msg) || /column .* does not exist/i.test(msg)) {
        payload = basePayload;
        const retry = await supabase.from('incidents').update(payload).eq('id', id);
        if (retry.error) {
          console.error('Incident update failed:', retry.error.message);
          return NextResponse.json({ error: 'Could not update the incident.' }, { status: 500 });
        }
        return NextResponse.json({ ok: true });
      }

      console.error('Incident update failed:', error.message);
      return NextResponse.json({ error: 'Could not update the incident.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Incident update exception:', message);
    return NextResponse.json({ error: 'Could not update the incident.' }, { status: 500 });
  }
}
