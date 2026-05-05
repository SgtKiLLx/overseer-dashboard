import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

const handler = NextAuth({
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: "https://discord.com/api/oauth2/authorize?scope=identify",
    }),
  ],
  callbacks: {
    async session({ session, token }: any) {
      // Only let YOU in. token.sub is your Discord ID.
      if (token.sub !== process.env.ADMIN_DISCORD_ID) {
        return null; // This blocks unauthorized users
      }
      if (session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  }
});

// THIS LINE IS CRITICAL:
export { handler as GET, handler as POST };
