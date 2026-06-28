import Resend from "@auth/core/providers/resend";
import { Resend as ResendAPI } from "resend";

// 6-digit numeric one-time code (web crypto is available in Convex actions).
function generateOTP(): string {
  const digits = "0123456789";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let code = "";
  for (let i = 0; i < 6; i++) code += digits[bytes[i] % 10];
  return code;
}

// Email-verification provider for Convex Auth's Password flow. Emails a short
// code via Resend that the user types in to confirm their address.
export const ResendOTP = Resend({
  id: "resend-otp",
  apiKey: process.env.RESEND_API_KEY,
  maxAge: 60 * 15, // codes valid 15 minutes
  async generateVerificationToken() {
    return generateOTP();
  },
  async sendVerificationRequest({ identifier: email, provider, token }) {
    const resend = new ResendAPI(provider.apiKey as string);
    const { error } = await resend.emails.send({
      from: "RecommendUsJobsUK <noreply@recommendusjobsuk.com>",
      to: [email],
      subject: "Your RecommendUsJobsUK verification code",
      text:
        `Welcome to RecommendUsJobsUK!\n\n` +
        `Your verification code is: ${token}\n\n` +
        `Enter it on the site to finish creating your account. ` +
        `This code expires in 15 minutes.`,
    });
    if (error) {
      throw new Error("Could not send verification email: " + JSON.stringify(error));
    }
  },
});
