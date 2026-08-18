/**
 * Placeholder for sending invite / temporary-access-code emails.
 * Currently logs to console only — swap in a real email provider later.
 */
export function sendInviteEmail(opts: {
  to: string;
  name: string;
  tempPassword: string;
}): void {
  // TODO(email): integrate with email provider (e.g. Resend, SendGrid, SMTP)
  console.log(
    `[InviteEmail] Sending temporary access code to ${opts.to} (${opts.name}). ` +
      `Code: ${opts.tempPassword}`
  );
}
