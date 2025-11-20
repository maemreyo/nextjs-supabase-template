export const authConfig = {
  providers: {
    email: {
      enabled: true,
    },
    google: {
      enabled: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? true : false,
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    },
    github: {
      enabled: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID ? true : false,
      clientId: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
    },
  },
  redirects: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    afterSignIn: '/dashboard',
    afterSignUp: '/dashboard',
    error: '/auth/error',
  },
  session: {
    maxAge: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
}