'use client'

import { useEffect, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/PageHeader'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { TagInput } from '@/components/ui/tag-input'
import { Button } from '@/components/ui/button'
import {
    userProfileSchema,
    changePasswordSchema,
    userSettingsSchema,
    UserProfileValues,
    ChangePasswordValues,
    UserSettingsValues,
} from '@/lib/validations'
import {
    getUserProfile,
    getUserSettings,
    updateUserProfile,
    changePassword,
    updateUserSettings,
} from '@/app/actions/settings'
import { updateUserSession } from '@/app/actions/auth'

export default function SettingsPage() {
    const [isPending, startTransition] = useTransition()

    // User Profile Form
    const profileForm = useForm<UserProfileValues>({
        resolver: zodResolver(userProfileSchema),
        defaultValues: {
            firstname: '',
            lastname: '',
            email: '',
        },
    })

    // Change Password Form
    const passwordForm = useForm<ChangePasswordValues>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: {
            newPassword: '',
        },
    })

    // User Settings Form (Watchlist)
    const settingsForm = useForm<UserSettingsValues>({
        resolver: zodResolver(userSettingsSchema),
        defaultValues: {
            tickers: [],
        },
    })

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [userData, settingsData] = await Promise.all([
                    getUserProfile(),
                    getUserSettings(),
                ])

                if (userData) {
                    profileForm.reset({
                        firstname: userData.firstname,
                        lastname: userData.lastname,
                        email: userData.email,
                    })
                }

                if (settingsData) {
                    settingsForm.reset({
                        tickers: settingsData.tickers || [],
                    })
                }
            } catch (error) {
                console.error('Failed to fetch settings data', error)
                toast.error('Failed to load settings', {
                    description:
                        'There was an error fetching your current settings. Please refresh the page.',
                })
            }
        }

        fetchData()
    }, [profileForm, settingsForm])

    const onProfileSubmit = (data: UserProfileValues) => {
        startTransition(async () => {
            try {
                await updateUserProfile(data)
                await updateUserSession()
                toast.success('Profile updated', {
                    description:
                        'Your profile information has been updated successfully.',
                })
            } catch {
                toast.error('Error updating profile', {
                    description: 'Failed to update profile. Please try again.',
                })
            }
        })
    }

    const onPasswordSubmit = (data: ChangePasswordValues) => {
        startTransition(async () => {
            try {
                await changePassword(data)
                toast.success('Password changed', {
                    description: 'Your password has been updated successfully.',
                })
                passwordForm.reset()
            } catch {
                toast.error('Error changing password', {
                    description: 'Failed to change password. Please try again.',
                })
            }
        })
    }

    const onSettingsSubmit = (data: UserSettingsValues) => {
        startTransition(async () => {
            try {
                await updateUserSettings(data)
                toast.success('Settings updated', {
                    description:
                        'Your watchlist has been updated successfully.',
                })
            } catch {
                toast.error('Error updating settings', {
                    description: 'Failed to update settings. Please try again.',
                })
            }
        })
    }

    return (
        <div className='dark space-y-6'>
            <PageHeader
                title='Settings'
                description='Manage your account settings and preferences.'
            />

            <div className='grid gap-6'>
                {/* Profile Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                        <CardDescription>
                            Update your personal details.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...profileForm}>
                            <form
                                onSubmit={profileForm.handleSubmit(
                                    onProfileSubmit,
                                )}
                                className='space-y-4'
                            >
                                <div className='grid grid-cols-2 gap-4'>
                                    <FormField
                                        control={profileForm.control}
                                        name='firstname'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    First Name
                                                </FormLabel>
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
                                        control={profileForm.control}
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
                                    control={profileForm.control}
                                    name='email'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder='john.doe@example.com'
                                                    {...field}
                                                    disabled={isPending}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type='submit' disabled={isPending}>
                                    Save Profile
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                {/* Watchlist Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Watchlist Configuration</CardTitle>
                        <CardDescription>
                            Manage the tickers in your watchlist.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...settingsForm}>
                            <form
                                onSubmit={settingsForm.handleSubmit(
                                    onSettingsSubmit,
                                )}
                                className='space-y-4'
                            >
                                <FormField
                                    control={settingsForm.control}
                                    name='tickers'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tickers</FormLabel>
                                            <FormControl>
                                                <TagInput
                                                    placeholder='Add ticker (e.g., AAPL)...'
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    disabled={isPending}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Type a ticker and press Enter,
                                                comma, or space to add it.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type='submit' disabled={isPending}>
                                    Update Watchlist
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                {/* Change Password */}
                <Card>
                    <CardHeader>
                        <CardTitle>Change Password</CardTitle>
                        <CardDescription>
                            Update your account password.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...passwordForm}>
                            <form
                                onSubmit={passwordForm.handleSubmit(
                                    onPasswordSubmit,
                                )}
                                className='space-y-4'
                            >
                                <FormField
                                    control={passwordForm.control}
                                    name='newPassword'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>New Password</FormLabel>
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
                                <Button type='submit' disabled={isPending}>
                                    Change Password
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                {/* Onboarding & Help */}
                <Card>
                    <CardHeader>
                        <CardTitle>Platform Walkthrough</CardTitle>
                        <CardDescription>
                            Need a refresher on how to navigate or use FinSight?
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            variant='outline'
                            type='button'
                            onClick={() => {
                                window.dispatchEvent(new CustomEvent('finsight_restart_onboarding'))
                                toast.success('Launching introduction walkthrough...')
                            }}
                        >
                            Restart Onboarding Tour
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
