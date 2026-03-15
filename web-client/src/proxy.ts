import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from '@/lib/session'
import { refreshToken } from '@/app/actions/auth'

export async function proxy(request: NextRequest) {
    const session = await getSession()
    const { pathname } = request.nextUrl

    const isAuthPage =
        pathname.startsWith('/login') || pathname.startsWith('/register')

    // If the user is trying to access dashboard routes (non-auth) without the cookie
    if (!isAuthPage && !session.token) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // If a logged-in user tries to access /login or /register
    if (isAuthPage && session.token) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    const API_URL = process.env.INTERNAL_API_URL || 'http://core-api:8080/api'

    if (session.refreshToken) {
        try {
            const response = await fetch(`${API_URL}/user/me`, {
                headers: {
                    Authorization: `Bearer ${session.token}`,
                },
            })

            if (response.status === 401 || response.status === 403) {
                await refreshToken()
            }
        } catch (error) {
            console.error('Error checking token validity:', error)
        }
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
