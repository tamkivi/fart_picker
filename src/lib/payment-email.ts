import "server-only";
import nodemailer from "nodemailer";

type PaymentEmailInput = {
  to: string;
  orderId: number;
  buildName: string;
  amountEurCents: number;
  createdAt: string;
};

function readSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number.parseInt(process.env.SMTP_PORT ?? "", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM_EMAIL;

  if (!host || !Number.isFinite(port) || !user || !pass || !from) {
    return null;
  }

  return {
    host,
    port,
    user,
    pass,
    from,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
  };
}

export async function sendPaymentConfirmationEmail(input: PaymentEmailInput): Promise<{ sent: boolean; reason?: string }> {
  const config = readSmtpConfig();
  if (!config) {
    return { sent: false, reason: "SMTP config missing" };
  }

  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  await transport.sendMail({
    from: config.from,
    to: input.to,
    subject: `Order #${input.orderId} payment received`,
    text: [
      `Thanks for your preorder.`,
      ``,
      `Order ID: ${input.orderId}`,
      `Build: ${input.buildName}`,
      `Amount: EUR ${(input.amountEurCents / 100).toFixed(2)}`,
      `Placed at: ${input.createdAt}`,
      ``,
      `We will assemble and configure your system after payment confirmation.`,
    ].join("\n"),
    html: `
      <p>Thanks for your preorder.</p>
      <p><strong>Order ID:</strong> ${input.orderId}</p>
      <p><strong>Build:</strong> ${input.buildName}</p>
      <p><strong>Amount:</strong> EUR ${(input.amountEurCents / 100).toFixed(2)}</p>
      <p><strong>Placed at:</strong> ${input.createdAt}</p>
      <p>We will assemble and configure your system after payment confirmation.</p>
    `,
  });

  return { sent: true };
}
