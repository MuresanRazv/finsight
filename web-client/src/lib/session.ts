import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { cache } from 'react'

export type SessionUser = {
    firstname: string
    lastname: string
    email: string
}

export type SessionData = {
    token: string
    refreshToken: string
    tokenExpiry: number
    refreshTokenExpiry: number
    user?: SessionUser
}

export const sessionOptions = {
    password:
        process.env.SECRET_COOKIE_PASSWORD ||
        'complex_password_at_least_32_characters_long',
    cookieName: 'finsight_session',
    cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'strict' as const,
    },
}

export const getSession = cache(async () => {
    const cookieStore = await cookies()
    return getIronSession<SessionData>(cookieStore, sessionOptions)
})
