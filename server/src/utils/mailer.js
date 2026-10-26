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
  const from = process.env.EMAIL_FROM || `Taskora <${process.env.EMAIL_USER}>`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <h2 style="color: #1e293b; margin-top: 0;">Taskora Password Reset</h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.6;">Hello ${userName || "there"},</p>
      <p style="color: #475569; font-size: 15px; line-height: 1.6;">We received a request to reset your password for your Taskora workspace account. Click the button below to set a new password:</p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${resetUrl}" style="background-color: #3b82f6; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 15px;">Reset Password</a>
      </div>
      <p style="color: #64748b; font-size: 13px; line-height: 1.5;">This link will expire in 1 hour. If you didn't request this reset, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px;">Taskora Project Management Platform</p>
    </div>
  `;

  return await transporter.sendMail({
    from,
    to,
    subject: "Reset your Taskora password",
    text: `Hello ${userName || ""},\n\nPlease use this link to reset your password:\n${resetUrl}\n\nThis link will expire in 1 hour.`,
    html,
  });
}
