import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: { signIn: '/auth/signin' },
});

export const config = {
  matcher: [
    '/',
    '/projects/:path*',
    '/tasks',
    '/gantt',
    '/api/((?!auth).*)',
  ],
};
