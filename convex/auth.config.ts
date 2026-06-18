export default {
  providers: [
    {
      // Set by `npx @convex-dev/auth` / `npx convex dev`. Used to validate JWTs.
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
};
