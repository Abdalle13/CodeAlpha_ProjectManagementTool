import nodemailer from "nodemailer";

export function createMailer() {
  const host = process.env.EMAIL_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.EMAIL_PORT, 10) || 587;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.warn("Mailer warning: EMAIL_USER or EMAIL_PASS not configured.");
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

export async function sendPasswordResetEmail({ to, resetToken, userName }) {
  const transporter = createMailer();
  if (!transporter) {
    console.warn("Email transporter not ready, skipping actual send.");
    return false;
  }

  const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
  const resetUrl = `${clientOrigin}/reset-password?token=${resetToken}&email=${encodeURIComponent(to)}`;
  const from = process.env.EMAIL_FROM || `Taskbora <${process.env.EMAIL_USER}>`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Reset your Taskbora password</title>
    </head>
    <body style="margin: 0; padding: 32px 16px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 540px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);">
        <!-- Brand Header with Logo -->
        <tr>
          <td style="padding: 28px 32px; background: #ffffff; border-bottom: 1px solid #f1f5f9;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="width: 44px; height: 44px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 12px; text-align: center; vertical-align: middle; box-shadow: 0 2px 6px rgba(37,99,235,0.25);">
                  <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 26px; font-weight: 900; color: #ffffff; line-height: 44px; display: inline-block;">T</span>
                </td>
                <td style="padding-left: 14px; vertical-align: middle;">
                  <div style="font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; line-height: 1.1;">Taskbora</div>
                  <div style="font-size: 11px; font-weight: 600; color: #64748b; letter-spacing: 0.8px; text-transform: uppercase; margin-top: 2px;">Project Management Platform</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Main Content -->
        <tr>
          <td style="padding: 32px;">
            <h1 style="color: #0f172a; font-size: 20px; font-weight: 700; margin: 0 0 16px 0; letter-spacing: -0.3px;">Password Reset Request</h1>
            <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">Hello ${userName || "there"},</p>
            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 28px 0;">
              We received a request to reset the password for your Taskbora workspace account. Click the secure button below to choose a new password:
            </p>

            <!-- Call to action button -->
            <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 28px auto;">
              <tr>
                <td align="center" style="border-radius: 10px; background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);">
                  <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 10px;">
                    Reset Password &rarr;
                  </a>
                </td>
              </tr>
            </table>

            <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 16px 0; background: #f8fafc; padding: 12px 16px; border-radius: 8px; border-left: 3px solid #3b82f6;">
              <strong>Security Note:</strong> This reset link will expire in <strong>1 hour</strong>. If you did not request a password change, please ignore this email; your account remains secure.
            </p>

            <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 20px 0 0 0; word-break: break-all;">
              Button not working? Copy and paste this URL into your browser:<br />
              <a href="${resetUrl}" style="color: #3b82f6; text-decoration: underline;">${resetUrl}</a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding: 20px 32px; background: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              &copy; ${new Date().getFullYear()} Taskbora. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return await transporter.sendMail({
    from,
    to,
    subject: "Reset your Taskbora password",
    text: `Hello ${userName || ""},\n\nPlease use this link to reset your password:\n${resetUrl}\n\nThis link will expire in 1 hour.`,
    html,
  });
}
