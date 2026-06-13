import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from '@/lib/session'
import { refreshToken, updateUserSession } from '@/app/actions/auth'

export async function proxy(request: NextRequest) {
    const session = await getSession()
    const { pathname } = request.nextUrl

    const isAuthPage =
        pathname.startsWith('/login') || pathname.startsWith('/register')
    const isRootPath = pathname === '/'

    // If the user is trying to access dashboard routes (non-auth) without the cookie
    if (!isAuthPage && !session.token) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // If a logged-in user tries to access /login or /register
    if (isAuthPage && session.token) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (session.refreshToken && session.refreshTokenExpiry) {
        const now = Date.now()
        const isRefreshTokenExpired = session.refreshTokenExpiry - now < 0

        if (isRefreshTokenExpired) {
            session.destroy()
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    if (session.refreshToken && session.tokenExpiry) {
        const now = Date.now()
        // Refresh token 5 minutes before it expires
        const shouldRefresh = session.tokenExpiry - now < 5 * 60 * 1000

        if (shouldRefresh) {
            try {
                await refreshToken()
            } catch (error) {
                console.error('Error refreshing token:', error)
                // If refresh fails, redirect to login
                session.destroy()
                return NextResponse.redirect(new URL('/login', request.url))
            }
        }
    }

    if (!session.user || !session.user.role) {
        await updateUserSession()
    }

    if (isRootPath) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
