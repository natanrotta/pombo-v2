/**
 * Renders the HTML + plain-text bodies for the password-reset e-mail.
 * Locale-aware (pt-BR / en / es) and branded as Pombo, matching
 * the invite-email + patient-document-email templates.
 *
 * Locale comes from the user's `user.language` (we already loaded the
 * user record by email to issue the token, so the preference is available).
 */

import { escapeHtml } from "@shared/util/html";

export type PasswordResetEmailLocale = "pt-BR" | "en" | "es";

export interface PasswordResetEmailVars {
  userName: string;
  resetUrl: string;
  /** Token TTL in minutes — surfaced in the copy so users know the window. */
  ttlMinutes: number;
  /** Defaults to pt-BR when omitted or unknown. */
  locale?: string;
}

export interface PasswordResetEmailBodies {
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
  bodyIntro: (ttlMinutes: number) => string;
  cta: string;
  fallbackHint: string;
  ignore: string;
}

const COPY: Record<PasswordResetEmailLocale, CopyBundle> = {
  "pt-BR": {
    subject: "Redefinição de senha — Pombo",
    preheader: "Crie uma nova senha para acessar sua conta na Pombo.",
    brand: "Pombo",
    brandTagline: "Pombo · Seu gateway de mensagens",
    headline: (name) => `Olá, ${name}`,
    bodyIntro: (ttl) =>
      `Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha — o link expira em <strong style="color:#0f172a;">${ttl} minutos</strong> e só pode ser usado uma vez.`,
    cta: "Redefinir senha",
    fallbackHint:
      "Se o botão não funcionar, copie e cole este link no navegador:",
    ignore:
      "Se você não solicitou essa redefinição, pode ignorar este e-mail com segurança.",
  },
  en: {
    subject: "Reset your password — Pombo",
    preheader: "Create a new password to access your Pombo account.",
    brand: "Pombo",
    brandTagline: "Pombo · Your messaging gateway",
    headline: (name) => `Hi ${name},`,
    bodyIntro: (ttl) =>
      `We received a request to reset your account password. Click the button below to set a new one — the link expires in <strong style="color:#0f172a;">${ttl} minutes</strong> and can only be used once.`,
    cta: "Reset password",
    fallbackHint:
      "If the button doesn't work, copy and paste this link into your browser:",
    ignore:
      "If you didn't request this reset, you can safely ignore this email.",
  },
  es: {
    subject: "Restablecer contraseña — Pombo",
    preheader: "Crea una nueva contraseña para acceder a tu cuenta de Pombo.",
    brand: "Pombo",
    brandTagline: "Pombo · Tu gateway de mensajería",
    headline: (name) => `Hola, ${name}`,
    bodyIntro: (ttl) =>
      `Recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el botón para crear una nueva — el enlace expira en <strong style="color:#0f172a;">${ttl} minutos</strong> y solo se puede usar una vez.`,
    cta: "Restablecer contraseña",
    fallbackHint:
      "Si el botón no funciona, copia y pega este enlace en el navegador:",
    ignore:
      "Si no solicitaste este restablecimiento, puedes ignorar este correo con seguridad.",
  },
};

const SUPPORTED_LOCALES: readonly PasswordResetEmailLocale[] = [
  "pt-BR",
  "en",
  "es",
];

function resolveLocale(locale?: string): PasswordResetEmailLocale {
  if (!locale) return "pt-BR";
  if ((SUPPORTED_LOCALES as readonly string[]).includes(locale)) {
    return locale as PasswordResetEmailLocale;
  }
  const base = locale.split("-")[0];
  if (base === "en") return "en";
  if (base === "es") return "es";
  return "pt-BR";
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, "");
}

export function renderPasswordResetEmail(
  vars: PasswordResetEmailVars,
): PasswordResetEmailBodies {
  const locale = resolveLocale(vars.locale);
  const copy = COPY[locale];

  const resetUrlSafe = escapeHtml(vars.resetUrl);

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
                      <div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#22d3a8 0%,#3b82f6 100%);display:inline-block;line-height:40px;text-align:center;color:#ffffff;font-weight:700;font-size:18px;letter-spacing:-0.02em;">C</div>
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
                  ${copy.bodyIntro(vars.ttlMinutes)}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 40px 8px 40px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="border-radius:10px;background-color:#3b82f6;">
                      <a href="${resetUrlSafe}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.005em;">
                        ${escapeHtml(copy.cta)}
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 40px 32px 40px;">
                <p style="margin:0;font-size:12px;line-height:1.5;color:#94a3b8;word-break:break-all;">
                  ${escapeHtml(copy.fallbackHint)}<br />
                  <a href="${resetUrlSafe}" style="color:#3b82f6;text-decoration:none;">${resetUrlSafe}</a>
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
    stripHtml(copy.bodyIntro(vars.ttlMinutes)),
    "",
    `${copy.cta}: ${vars.resetUrl}`,
    "",
    copy.ignore,
    "",
    `— ${copy.brand}`,
  ].join("\n");

  return { subject, html, text };
}
