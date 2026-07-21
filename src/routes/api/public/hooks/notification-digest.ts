import { createFileRoute } from "@tanstack/react-router";

/**
 * Hourly digest sender. Called by pg_cron.
 * - Verifies shared secret in `x-cron-secret` header.
 * - Finds users with email_enabled AND enough hours since last_email_digest_at.
 * - Bundles unread notifications into a single email per user.
 * - Marks profiles.last_email_digest_at so we don't spam.
 *
 * If no email domain is configured yet, we skip actual sends but still update
 * the timestamp for visibility. Once the domain is set up and the transactional
 * template `notification-digest` exists, real emails go out.
 */
export const Route = createFileRoute("/api/public/hooks/notification-digest")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const provided = request.headers.get("x-cron-secret");
        const expected = process.env.DIGEST_CRON_SECRET;
        if (!expected || provided !== expected) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: profiles, error: profErr } = await supabaseAdmin
          .from("profiles")
          .select("id, email, full_name, notification_prefs, last_email_digest_at")
          .limit(1000);
        if (profErr) {
          return new Response(JSON.stringify({ error: profErr.message }), { status: 500 });
        }

        const now = Date.now();
        let sent = 0;
        let skipped = 0;

        // Attempt to load the template helper — optional until email is set up.
        let sendTemplateEmail:
          | ((
              tpl: string,
              to: string,
              opts: { templateData: Record<string, unknown>; idempotencyKey: string },
            ) => Promise<{ sent: boolean; reason?: string }>)
          | null = null;
        try {
          const modPath = "@/lib/email-templates/send-email";
          type SendModType = {
            sendTemplateEmail?: (
              tpl: string,
              to: string,
              opts: { templateData: Record<string, unknown>; idempotencyKey: string },
            ) => Promise<{ sent: boolean; reason?: string }>;
          };
          const mod = (await import(/* @vite-ignore */ modPath)) as unknown as SendModType;
          sendTemplateEmail = mod.sendTemplateEmail ?? null;
        } catch {
          sendTemplateEmail = null;
        }

        for (const p of profiles ?? []) {
          const prefs = (p.notification_prefs ?? {}) as {
            email_enabled?: boolean;
            digest_frequency_hours?: number;
          };
          if (!prefs.email_enabled) {
            skipped++;
            continue;
          }

          const freq = Math.max(1, prefs.digest_frequency_hours ?? 1);
          const last = p.last_email_digest_at ? new Date(p.last_email_digest_at).getTime() : 0;
          if (now - last < freq * 3600_000) {
            skipped++;
            continue;
          }

          const { data: notifs } = await supabaseAdmin
            .from("notifications")
            .select("kind, title, message, severity, created_at, link")
            .eq("user_id", p.id)
            .is("read_at", null)
            .order("created_at", { ascending: false })
            .limit(20);

          if (!notifs || notifs.length === 0) {
            skipped++;
            continue;
          }

          if (sendTemplateEmail && p.email) {
            try {
              const res = await sendTemplateEmail("notification-digest", p.email, {
                templateData: {
                  name: p.full_name || p.email.split("@")[0],
                  notifications: notifs,
                  count: notifs.length,
                },
                idempotencyKey: `digest-${p.id}-${Math.floor(now / (freq * 3600_000))}`,
              });
              if (res.sent) sent++;
              else skipped++;
            } catch (e) {
              console.error("[digest] send failed for", p.email, (e as Error).message);
              skipped++;
              continue;
            }
          }

          await supabaseAdmin
            .from("profiles")
            .update({ last_email_digest_at: new Date(now).toISOString() })
            .eq("id", p.id);
        }

        return new Response(
          JSON.stringify({
            ok: true,
            sent,
            skipped,
            template_available: Boolean(sendTemplateEmail),
          }),
          { headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
