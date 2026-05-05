import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

const handler = NextAuth({
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      // Explicitly ask for basic profile info
      authorization: "https://discord.com/api/oauth2/authorize?scope=identify+email",
    }),
  ],
  callbacks: {
    // 1. The SignIn callback is the proper place to block unauthorized users
    async signIn({ user }: any) {
      const isAdmin = user.id === process.env.ADMIN_DISCORD_ID;
      if (!isAdmin) {
        console.error("Unauthorized login attempt from ID:", user.id);
        return false; // This sends the user to an "Access Denied" page safely
      }
      return true; // Allow you in
    },
    // 2. The session callback just adds your ID to the session for the dashboard to use
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login', // Redirects back to login on failure
  }
});

export { handler as GET, handler as POST };
