import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/fund')) {
    const url = request.nextUrl.clone()
    const newPath = pathname.replace(/^\/fund(\/)?/, '/') || '/'
    url.pathname = newPath
    return NextResponse.rewrite(url)
  }
}

export const config = {
  matcher: ['/fund', '/fund/(.*)'],
}
