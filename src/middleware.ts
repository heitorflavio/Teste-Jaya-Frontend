import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    if (req.nextauth?.token) {
      return NextResponse.next();
    } else {
      return NextResponse.redirect('/Login');
    }
  },
  {
    callbacks: {
      authorized: params => {
        let { token } = params;
        return !!token;
      },
    },
  },
);

export const config = {
  matcher: ['/']
};