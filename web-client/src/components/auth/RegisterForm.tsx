'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { registerSchema, RegisterInput } from '@/lib/validations/auth'
import { registerUser } from '@/app/actions/auth'

export function RegisterForm() {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    const form = useForm<RegisterInput>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            firstname: '',
            lastname: '',
            email: '',
            password: '',
        },
    })

    function onSubmit(data: RegisterInput) {
        setError(null)
        startTransition(async () => {
            const result = await registerUser(data)
            if (result.success) {
                router.push('/dashboard')
            } else {
                setError(result.message || 'Something went wrong')
            }
        })
    }

    return (
        <Card className='w-[350px]'>
            <CardHeader>
                <CardTitle>Register</CardTitle>
                <CardDescription>
                    Create a new FinSight account.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className='space-y-4'
                    >
                        <div className='grid grid-cols-2 gap-4'>
                            <FormField
                                control={form.control}
                                name='firstname'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>First Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder='John'
                                                {...field}
                                                disabled={isPending}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name='lastname'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Last Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder='Doe'
                                                {...field}
                                                disabled={isPending}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name='email'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder='name@example.com'
                                            {...field}
                                            disabled={isPending}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name='password'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input
                                            type='password'
                                            placeholder='••••••••'
                                            {...field}
                                            disabled={isPending}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {error && (
                            <div className='text-sm font-medium text-red-500'>
                                {error}
                            </div>
                        )}
                        <Button
                            type='submit'
                            className='w-full'
                            disabled={isPending}
                        >
                            {isPending && (
                                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            )}
                            Register
                        </Button>
                    </form>
                </Form>
            </CardContent>
            <CardFooter className='flex justify-center'>
                <div className='text-muted-foreground text-sm'>
                    Already have an account?{' '}
                    <Link
                        href='/login'
                        className='hover:text-primary underline'
                    >
                        Login
                    </Link>
                </div>
            </CardFooter>
        </Card>
    )
}
