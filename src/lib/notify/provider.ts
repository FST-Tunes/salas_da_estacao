import "server-only";
/**
 * Notification delivery boundary. The rest of the app only knows the
 * `NotifyProvider` interface, so the channel (SMS, WhatsApp, …) can be swapped
 * with env vars and zero code changes — matching the project's portability rule.
 *
 * Selected by `NOTIFY_PROVIDER`:
 *   - "log"             (default) → just logs the message; needs no account.
 *   - "twilio-sms"      → SMS via Twilio.
 *   - "twilio-whatsapp" → WhatsApp via Twilio (requires an approved template).
 *
 * If a real provider is selected but its env is incomplete, we fall back to the
 * log provider with a warning rather than throwing — a misconfigured channel
 * must never break the admin approve/reject flow.
 */

export interface NotifyMessage {
  /** Destination phone, normalized to E.164 (e.g. "+351912345678"). */
  to: string;
  body: string;
}

export interface NotifyResult {
  ok: boolean;
  provider: string;
  error?: string;
}

export interface NotifyProvider {
  readonly name: string;
  send(msg: NotifyMessage): Promise<NotifyResult>;
}

/**
 * Best-effort E.164 normalization. Stored numbers are often local PT format
 * ("912 345 678"); providers want "+351912345678". Default country code is
 * configurable via NOTIFY_DEFAULT_COUNTRY_CODE (defaults to Portugal, +351).
 */
export function normalizePhone(raw: string): string {
  const cc = process.env.NOTIFY_DEFAULT_COUNTRY_CODE ?? "+351";
  const trimmed = raw.replace(/[\s\-()]/g, "");
  if (trimmed.startsWith("+")) return trimmed;
  if (trimmed.startsWith("00")) return `+${trimmed.slice(2)}`;
  return `${cc}${trimmed}`;
}

// ── Providers ─────────────────────────────────────────────────────────────--
const logProvider: NotifyProvider = {
  name: "log",
  async send({ to, body }) {
    console.info(`[notify:log] → ${to}\n${body}`);
    return { ok: true, provider: "log" };
  },
};

/** Twilio Messages API, shared by SMS and WhatsApp (channel = prefix). */
function twilioProvider(channel: "sms" | "whatsapp"): NotifyProvider | null {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) return null;

  const name = channel === "whatsapp" ? "twilio-whatsapp" : "twilio-sms";
  const wrap = (n: string) => (channel === "whatsapp" ? `whatsapp:${n}` : n);

  return {
    name,
    async send({ to, body }) {
      try {
        const res = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({ To: wrap(to), From: wrap(from), Body: body }),
          },
        );
        if (!res.ok) {
          const detail = (await res.text()).slice(0, 200);
          return { ok: false, provider: name, error: `${res.status}: ${detail}` };
        }
        return { ok: true, provider: name };
      } catch (err) {
        return { ok: false, provider: name, error: String(err) };
      }
    },
  };
}

export function getNotifyProvider(): NotifyProvider {
  const choice = process.env.NOTIFY_PROVIDER ?? "log";
  switch (choice) {
    case "twilio-sms":
    case "twilio-whatsapp": {
      const channel = choice === "twilio-whatsapp" ? "whatsapp" : "sms";
      const provider = twilioProvider(channel);
      if (provider) return provider;
      console.warn(
        `[notify] NOTIFY_PROVIDER="${choice}" mas faltam credenciais Twilio; a usar o provider "log".`,
      );
      return logProvider;
    }
    case "log":
      return logProvider;
    default:
      console.warn(`[notify] NOTIFY_PROVIDER="${choice}" desconhecido; a usar "log".`);
      return logProvider;
  }
}
