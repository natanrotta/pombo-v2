/**
 * Renders the HTML + plain-text bodies for the e-mail-confirmation PIN
 * e-mail. Locale-aware (pt-BR / en / es) and branded as Pombo, mirroring
 * the password-reset template. The 6-digit PIN is shown prominently — there
 * is no link to click; the user types the code back into the app.
 *
 * Locale comes from `user.language` (the row is already loaded to issue the
 * PIN, so the preference is available).
 */

import { escapeHtml } from "@shared/util/html";

export type EmailVerificationPinLocale = "pt-BR" | "en" | "es";

export interface EmailVerificationPinVars {
  userName: string;
  /** The plaintext 6-digit code. Never logged — only rendered into the mail. */
  pin: string;
  /** PIN TTL in minutes — surfaced in the copy so users know the window. */
  ttlMinutes: number;
  /** Absolute URL to the Pombo logo (e.g. `${FRONTEND_URL}/pombo-icon.png`).
   *  Must be absolute — e-mail clients can't resolve app-relative paths. */
  logoUrl: string;
  /** Defaults to pt-BR when omitted or unknown. */
  locale?: string;
}

export interface EmailVerificationPinBodies {
  subject: string;
  html: string;
  text: string;
}

interface CopyBundle {
  subject: string;
  preheader: string;
  brand: string;
  brandTagline: string;
  headline: (name: string) => string;
  bodyIntro: string;
  codeLabel: string;
  expiryHint: (ttlMinutes: number) => string;
  ignore: string;
}

const COPY: Record<EmailVerificationPinLocale, CopyBundle> = {
  "pt-BR": {
    subject: "Seu código de confirmação — Pombo",
    preheader: "Confirme seu e-mail para continuar na Pombo.",
    brand: "Pombo",
    brandTagline: "Pombo · Seu gateway de mensagens",
    headline: (name) => `Olá, ${name}`,
    bodyIntro:
      "Use o código abaixo para confirmar seu e-mail e continuar criando sua conta.",
    codeLabel: "Seu código de confirmação",
    expiryHint: (ttl) =>
      `O código expira em <strong style="color:#0f172a;">${ttl} minutos</strong>.`,
    ignore:
      "Se você não criou uma conta na Pombo, pode ignorar este e-mail com segurança.",
  },
  en: {
    subject: "Your confirmation code — Pombo",
    preheader: "Confirm your email to continue on Pombo.",
    brand: "Pombo",
    brandTagline: "Pombo · Your messaging gateway",
    headline: (name) => `Hi ${name},`,
    bodyIntro:
      "Use the code below to confirm your email and finish creating your account.",
    codeLabel: "Your confirmation code",
    expiryHint: (ttl) =>
      `The code expires in <strong style="color:#0f172a;">${ttl} minutes</strong>.`,
    ignore:
      "If you didn't create a Pombo account, you can safely ignore this email.",
  },
  es: {
    subject: "Tu código de confirmación — Pombo",
    preheader: "Confirma tu correo para continuar en Pombo.",
    brand: "Pombo",
    brandTagline: "Pombo · Tu gateway de mensajería",
    headline: (name) => `Hola, ${name}`,
    bodyIntro:
      "Usa el código de abajo para confirmar tu correo y terminar de crear tu cuenta.",
    codeLabel: "Tu código de confirmación",
    expiryHint: (ttl) =>
      `El código expira en <strong style="color:#0f172a;">${ttl} minutos</strong>.`,
    ignore:
      "Si no creaste una cuenta en Pombo, puedes ignorar este correo con seguridad.",
  },
};

const SUPPORTED_LOCALES: readonly EmailVerificationPinLocale[] = [
  "pt-BR",
  "en",
  "es",
];

function resolveLocale(locale?: string): EmailVerificationPinLocale {
  if (!locale) return "pt-BR";
  if ((SUPPORTED_LOCALES as readonly string[]).includes(locale)) {
    return locale as EmailVerificationPinLocale;
  }
  const base = locale.split("-")[0];
  if (base === "en") return "en";
  if (base === "es") return "es";
  return "pt-BR";
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, "");
}

export function renderEmailVerificationPinEmail(
  vars: EmailVerificationPinVars,
): EmailVerificationPinBodies {
  const locale = resolveLocale(vars.locale);
  const copy = COPY[locale];

  // Render each digit with letter-spacing for legibility; escape defensively
  // even though the PIN is digits-only.
  const pinSafe = escapeHtml(vars.pin);
  const logoUrlSafe = escapeHtml(vars.logoUrl);

  const subject = copy.subject;

  const html = `<!doctype html>
<html lang="${locale}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f5f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#1a202c;">
    <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
      ${escapeHtml(copy.preheader)}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f7fb;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:16px;box-shadow:0 1px 3px rgba(15,23,42,0.06);overflow:hidden;">
            <tr>
              <td style="padding:40px 40px 24px 40px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <img src="${logoUrlSafe}" width="40" height="40" alt="${escapeHtml(copy.brand)}" style="display:block;width:40px;height:40px;border-radius:11px;border:0;outline:none;text-decoration:none;" />
                    </td>
                    <td style="vertical-align:middle;padding-left:12px;">
                      <div style="font-size:16px;font-weight:600;color:#0f172a;letter-spacing:-0.01em;">${escapeHtml(copy.brand)}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 40px 0 40px;">
                <h1 style="margin:0;font-size:22px;line-height:1.35;font-weight:600;color:#0f172a;letter-spacing:-0.015em;">
                  ${escapeHtml(copy.headline(vars.userName))}
                </h1>
                <p style="margin:16px 0 0 0;font-size:15px;line-height:1.6;color:#475569;">
                  ${escapeHtml(copy.bodyIntro)}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 40px 8px 40px;">
                <p style="margin:0 0 8px 0;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#94a3b8;">
                  ${escapeHtml(copy.codeLabel)}
                </p>
                <div style="display:inline-block;padding:16px 28px;border-radius:12px;background-color:#f1f5f9;border:1px solid #e2e8f0;font-size:34px;font-weight:700;letter-spacing:0.35em;color:#0f172a;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;">
                  ${pinSafe}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 40px 32px 40px;">
                <p style="margin:0;font-size:13px;line-height:1.5;color:#64748b;">
                  <!-- Controlled HTML (the <strong> in copy.expiryHint); no user input — do not escape -->
                  ${copy.expiryHint(vars.ttlMinutes)}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px;border-top:1px solid #e2e8f0;background-color:#f8fafc;">
                <p style="margin:0;font-size:12px;line-height:1.5;color:#94a3b8;">
                  ${escapeHtml(copy.ignore)}
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:24px 0 0 0;font-size:12px;color:#94a3b8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
            ${escapeHtml(copy.brandTagline)}
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    stripHtml(copy.headline(vars.userName)),
    "",
    copy.bodyIntro,
    "",
    `${copy.codeLabel}: ${vars.pin}`,
    stripHtml(copy.expiryHint(vars.ttlMinutes)),
    "",
    copy.ignore,
    "",
    `— ${copy.brand}`,
  ].join("\n");

  return { subject, html, text };
}
