import { NextResponse, type NextRequest } from 'next/server';

// The old site used a capitalised path. Done here rather than in next.config
// redirects(), which match case-insensitively and would redirect the
// lowercase page to itself.
export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = '/astrology-services/panchang';
  return NextResponse.redirect(url, 308);
}

export const config = { matcher: '/astrology-services/Panchang' };
