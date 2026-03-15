import * as z from 'zod'

export const userProfileSchema = z.object({
    firstname: z.string().min(2, 'First name must be at least 2 characters'),
    lastname: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
})

export const changePasswordSchema = z.object({
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
})

export const userSettingsSchema = z.object({
    tickers: z.string().optional(),
})

export type UserProfileValues = z.infer<typeof userProfileSchema>
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>
export type UserSettingsValues = z.infer<typeof userSettingsSchema>
