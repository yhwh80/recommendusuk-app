import Resend from "@auth/core/providers/resend";
import { Resend as ResendAPI } from "resend";

function generateOTP(): string {
  const digits = "0123456789";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let code = "";
  for (let i = 0; i < 6; i++) code += digits[bytes[i] % 10];
  return code;
}

// Password-reset provider for Convex Auth. Emails a 6-digit code the user enters
// along with a new password to reset it.
export const ResendOTPPasswordReset = Resend({
  id: "resend-otp-password-reset",
  apiKey: process.env.RESEND_API_KEY,
  maxAge: 60 * 15,
  async generateVerificationToken() {
    return generateOTP();
  },
  async sendVerificationRequest({ identifier: email, provider, token }) {
    const resend = new ResendAPI(provider.apiKey as string);
    const { error } = await resend.emails.send({
      from: "RecommendUsJobsUK <noreply@recommendusjobsuk.com>",
      to: [email],
      subject: "Reset your RecommendUsJobsUK password",
      text:
        `We got a request to reset your password.\n\n` +
        `Your reset code is: ${token}\n\n` +
        `Enter it on the site along with your new password. ` +
        `This code expires in 15 minutes. If you didn't request this, ignore this email.`,
    });
    if (error) {
      throw new Error("Could not send reset email: " + JSON.stringify(error));
    }
  },
});
