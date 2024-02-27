import { authenticate } from '@/services/auth';
import NextAuth from 'next-auth';
import type { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials): Promise<any> {
        if (!credentials?.email || !credentials.password) return null;

        const user = await authenticate(
          credentials.email,
          credentials.password,
        );

        if (user) {
          return user;
        } else {
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/Login',
  },
  callbacks: {
    jwt: ({ token, user }) => {
      return user ? { ...token, user } : token;
    },
    session: ({ session, token }: any) => {
      if (token?.user) {
        return token.user;
      }
      return session;
    },
  },
  session: {
    maxAge: 28800, // 8 hours
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };