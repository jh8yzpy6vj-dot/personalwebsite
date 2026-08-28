/**
 * Versand der Anfragen.
 *
 * ⚠️ **MailChannels' Gratis-Versand für Cloudflare Workers ist seit 2024
 * eingestellt** — deshalb ein Transaktions-Mailer mit API. Umgesetzt ist
 * **Resend**; Postmark wäre gleichwertig und ließe sich hier austauschen,
 * ohne dass Formular oder Route sich ändern.
 *
 * **Konfiguration** (Worker-Secrets, nicht in `wrangler.toml` und nicht
 * ins Repo):
 *
 * ```
 * npx wrangler secret put RESEND_API_KEY
 * npx wrangler secret put ANFRAGE_AN        # Zieladresse
 * npx wrangler secret put ANFRAGE_VON       # verifizierte Absenderadresse
 * ```
 *
 * `ANFRAGE_VON` muss eine bei Resend **verifizierte Domain** sein. Die
 * Adresse des Anfragenden dort einzusetzen wäre Absender-Fälschung und
 * würde von SPF/DKIM abgewiesen — sie steht stattdessen in `reply_to`.
 */

export type MailErgebnis =
  | { ok: true }
  | { ok: false; grund: "nicht_konfiguriert" | "versand_fehlgeschlagen" };

export type Mail = {
  betreff: string;
  text: string;
  /** Adresse des Anfragenden — landet in `reply_to`, nicht in `from`. */
  antwortAn: string;
};

type Env = {
  RESEND_API_KEY?: string;
  ANFRAGE_AN?: string;
  ANFRAGE_VON?: string;
};

export async function sendeMail(mail: Mail, env: Env): Promise<MailErgebnis> {
  const { RESEND_API_KEY, ANFRAGE_AN, ANFRAGE_VON } = env;

  // Fehlt die Konfiguration, ist das kein Fehler des Anfragenden. Die Route
  // macht daraus eine Meldung, die auf die E-Mail-Adresse verweist —
  // niemals ein stilles Schlucken der Anfrage.
  if (!RESEND_API_KEY || !ANFRAGE_AN || !ANFRAGE_VON) {
    return { ok: false, grund: "nicht_konfiguriert" };
  }

  try {
    const antwort = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: ANFRAGE_VON,
        to: [ANFRAGE_AN],
        reply_to: mail.antwortAn,
        subject: mail.betreff,
        text: mail.text,
      }),
    });

    if (!antwort.ok) return { ok: false, grund: "versand_fehlgeschlagen" };
    return { ok: true };
  } catch {
    return { ok: false, grund: "versand_fehlgeschlagen" };
  }
}
