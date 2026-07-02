import nodemailer from "nodemailer";

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.office365.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: { ciphers: "SSLv3" },
  });
}

export async function sendWelcomeEmail(to: string, tempPassword: string, frontendUrl: string) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const transport = createTransport();

  await transport.sendMail({
    from: `Digaf <${from}>`,
    to,
    subject: "Welcome to Digaf – Your Account is Ready",
    text: `
Welcome to the Digaf Shareholder Registry Platform.

Your account has been created. Use the following credentials to log in:

  URL:      ${frontendUrl}
  Email:    ${to}
  Password: ${tempPassword}

You will be prompted to set a new password immediately after your first login.

If you need help, contact your system administrator.
    `.trim(),
    html: `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#f8fafc">
  <div style="background:#fff;border-radius:12px;padding:32px;box-shadow:0 1px 4px rgba(0,0,0,0.06)">
    <h2 style="color:#1e293b;margin:0 0 8px">Welcome to Digaf</h2>
    <p style="color:#64748b;margin:0 0 24px;font-size:14px">Your account on the Digaf Shareholder Registry Platform is ready.</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:13px;width:90px">URL</td>
        <td style="padding:8px 0;font-size:13px"><a href="${frontendUrl}" style="color:#4f46e5">${frontendUrl}</a></td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:13px">Email</td>
        <td style="padding:8px 0;font-size:13px">${to}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:13px">Password</td>
        <td style="padding:8px 0;font-size:13px"><strong style="letter-spacing:2px;font-size:15px">${tempPassword}</strong></td>
      </tr>
    </table>
    <div style="background:#fef3c7;border-radius:8px;padding:12px 16px;margin-bottom:24px">
      <p style="margin:0;font-size:13px;color:#92400e">You will be asked to set your own password immediately after your first login.</p>
    </div>
    <a href="${frontendUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">Log In Now</a>
    <p style="margin:24px 0 0;font-size:12px;color:#94a3b8">If you need help, contact your system administrator.</p>
  </div>
</div>
    `.trim(),
  });
}
