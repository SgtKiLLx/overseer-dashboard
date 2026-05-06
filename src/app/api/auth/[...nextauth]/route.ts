import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

const handler = NextAuth({
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: "https://discord.com/api/oauth2/authorize?scope=identify",
      // This part fixes the casing (SgtKiLLx)
      profile(profile) {
        if (profile.avatar === null) {
          const defaultAvatarNumber = parseInt(profile.discriminator) % 5;
          profile.image_url = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNumber}.png`;
        } else {
          profile.image_url = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`;
        }
        return {
          id: profile.id,
          name: profile.global_name || profile.username, // Corrects casing
          image: profile.image_url,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user }: any) {
      // Only let YOU in
      return user.id === process.env.ADMIN_DISCORD_ID;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  }
});

export { handler as GET, handler as POST };
