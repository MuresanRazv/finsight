import * as z from 'zod'

export const loginSchema = z.object({
    email: z.email({
        message: 'Please enter a valid email address.',
    }),
    password: z.string().min(1, {
        message: 'Password is required.',
    }),
})

export const registerSchema = z.object({
    firstname: z.string().min(2, {
        message: 'First name must be at least 2 characters.',
    }),
    lastname: z.string().min(2, {
        message: 'Last name must be at least 2 characters.',
    }),
    email: z.email({
        message: 'Please enter a valid email address.',
    }),
    password: z.string().min(8, {
        message: 'Password must be at least 8 characters.',
    }),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
