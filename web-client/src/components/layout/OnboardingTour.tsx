'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { SessionUser } from '@/lib/session'
import { X, ChevronRight, ChevronLeft, Sparkles, Loader2 } from 'lucide-react'
import { useSidebar } from '@/components/providers/SidebarProvider'

// Define the shape of a tour step
interface TourStep {
    title: string
    content: string
    target?: string // CSS selector
    path?: string   // Route path where the target is located
    isAdminOnly?: boolean
}

// All defined steps for the onboarding tour
const tourSteps: TourStep[] = [
    {
        title: 'Welcome to FinSight! 🚀',
        content: 'FinSight is your AI-powered financial intelligence platform. Let\'s take a quick 1-minute tour to see how to navigate and make the most of the tools available here.',
        path: '/dashboard',
    },
    {
        title: 'Market Intelligence Hub 📊',
        content: 'This is your central dashboard. Analyze market sentiment, track your monitored stock tickers, explore trending mentions, and review latest articles all in one place through interactive live charts.',
        path: '/dashboard',
        target: '[data-tour="dashboard-content"]',
    },
    {
        title: 'Top Navigation Controls ⚙️',
        content: 'Use the top bar to inspect system notification alerts, configure your account settings, or log out securely from your session.',
        path: '/dashboard',
        target: '[data-tour="top-controls"]',
    },
    {
        title: 'Global Navigation Sidebar 🧭',
        content: 'Easily navigate the platform using the sidebar. Switch between the semantic search engine, AI chat, manual ingestion console, and configuration tools.',
        path: '/dashboard',
        target: '[data-tour="sidebar-nav"]',
    },
    {
        title: 'Semantic Search Engine 🔍',
        content: 'Search news using natural language queries like "how are chip shortages affecting auto makers?". FinSight understands the context, going beyond simple keyword matching.',
        path: '/search',
        target: '[data-tour="search-input"]',
    },
    {
        title: 'Start Instantly with Suggestions 💡',
        content: 'Not sure what to search for? Click any of the pre-configured financial search suggestions to load live market datasets instantly.',
        path: '/search',
        target: '[data-tour="search-suggestions"]',
    },
    {
        title: 'Chat with AI Financial Analyst 🤖',
        content: 'Ask complex analysis questions, request news summaries, or check market forecasts. The AI assistant retrieves relevant indexed sources in real-time using RAG.',
        path: '/chat',
        target: '[data-tour="chat-input"]',
    },
    {
        title: 'Manual Article Ingestion 📥',
        content: 'Found a new market article? Paste the URL or raw text here. FinSight will scrape it, run NER to extract tickers, perform sentiment inference, and index it within seconds.',
        path: '/ingestion',
        target: '[data-tour="ingest-form"]',
    },
    {
        title: 'Manage Automated RSS Feeds 📡',
        content: 'Configure, test, and schedule custom RSS or Atom feed targets to automatically crawl financial websites in the background.',
        path: '/sources',
        target: '[data-tour="sources-content"]',
        isAdminOnly: true,
    },
    {
        title: 'Observability & Metrics 📈',
        content: 'Monitor system latencies, scraping operations, and ML processing durations (FinBERT sentiment, embeddings, NER) in real-time.',
        path: '/metrics',
        target: '[data-tour="observability-metrics"]',
        isAdminOnly: true,
    },
]

export function OnboardingTour({ session }: { session?: SessionUser }) {
    const router = useRouter()
    const pathname = usePathname()
    const { setIsOpen: setSidebarOpen } = useSidebar()

    const [isOpen, setIsOpen] = useState(false)
    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
    const [isNavigating, setIsNavigating] = useState(false)
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

    // Filter steps based on user's role
    const filteredSteps = useMemo(() => {
        return tourSteps.filter(step => !step.isAdminOnly || session?.role === 'ADMIN')
    }, [session])

    // Get current step
    const currentStep = filteredSteps[currentStepIndex]

    // Set initial window size and check onboarding completion status
    useEffect(() => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight })
        
        const isCompleted = localStorage.getItem('finsight_onboarding_completed')
        if (!isCompleted) {
            // Give the app some time to load before launching the tour
            const timer = setTimeout(() => {
                setIsOpen(true)
            }, 1500)
            return () => clearTimeout(timer)
        }
    }, [])

    // Recalculate target element position on step change, route change, or resize
    useEffect(() => {
        if (!isOpen) return

        if (!currentStep) return

        // Manage sidebar drawer open/close automatically on mobile viewports
        const isMobile = window.innerWidth < 768
        const needsSidebarOpen = isMobile && currentStep.target === '[data-tour="sidebar-nav"]'
        if (isMobile) {
            if (currentStep.target === '[data-tour="sidebar-nav"]') {
                setSidebarOpen(true)
            } else {
                setSidebarOpen(false)
            }
        }

        // If path does not match, trigger Next.js page navigation
        if (currentStep.path && pathname !== currentStep.path) {
            setIsNavigating(true)
            setTargetRect(null)
            router.push(currentStep.path)
            return
        }

        // Poll for target element inside the DOM
        let attempts = 0
        const maxAttempts = 40 // 4 seconds max polling
        let scrolled = false
        
        const checkElement = () => {
            if (!currentStep.target) {
                setTargetRect(null)
                setIsNavigating(false)
                return
            }
            
            const el = document.querySelector(currentStep.target)
            if (el) {
                const rect = el.getBoundingClientRect()
                if (rect.width > 0 && rect.height > 0) {
                    if (!scrolled) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        scrolled = true
                    }
                    setTargetRect(rect)
                    setIsNavigating(false)
                    return
                }
            }
            
            attempts++
            if (attempts < maxAttempts) {
                setTimeout(checkElement, 100)
            } else {
                setTargetRect(null)
                setIsNavigating(false)
            }
        }

        const delay = needsSidebarOpen ? 350 : 150

        // Add a slight delay to allow rendering transition to settle
        const delayTimer = setTimeout(() => {
            checkElement()
        }, delay)

        return () => clearTimeout(delayTimer)
    }, [currentStepIndex, pathname, isOpen, currentStep, router, setSidebarOpen])

    // Update target bounds on window resizing, scrolling, or layout shifts
    useEffect(() => {
        if (!isOpen || !targetRect) return

        const handleResizeOrScroll = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight })
            if (currentStep && currentStep.target) {
                const el = document.querySelector(currentStep.target)
                if (el) {
                    setTargetRect(el.getBoundingClientRect())
                }
            }
        }

        window.addEventListener('resize', handleResizeOrScroll)
        window.addEventListener('scroll', handleResizeOrScroll, { passive: true })

        // Check for layout shifts every 150ms for 1.5 seconds after step mount/update
        let count = 0
        const interval = setInterval(() => {
            if (currentStep && currentStep.target) {
                const el = document.querySelector(currentStep.target)
                if (el) {
                    const newRect = el.getBoundingClientRect()
                    setTargetRect((prev) => {
                        if (!prev) return newRect
                        const diffX = Math.abs(prev.left - newRect.left)
                        const diffY = Math.abs(prev.top - newRect.top)
                        const diffW = Math.abs(prev.width - newRect.width)
                        const diffH = Math.abs(prev.height - newRect.height)
                        // Only update state if position/size shifted by more than 1px
                        if (diffX > 1 || diffY > 1 || diffW > 1 || diffH > 1) {
                            return newRect
                        }
                        return prev
                    })
                }
            }
            count++
            if (count > 10) clearInterval(interval)
        }, 150)

        return () => {
            window.removeEventListener('resize', handleResizeOrScroll)
            window.removeEventListener('scroll', handleResizeOrScroll)
            clearInterval(interval)
        }
    }, [isOpen, currentStep, targetRect])

    const handleNext = () => {
        if (currentStepIndex < filteredSteps.length - 1) {
            setCurrentStepIndex(prev => prev + 1)
        } else {
            handleComplete()
        }
    }

    const handleBack = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1)
        }
    }

    const handleComplete = () => {
        localStorage.setItem('finsight_onboarding_completed', 'true')
        setIsOpen(false)
        setSidebarOpen(false)
    }

    // Expose a public trigger to restart the tour (useful in settings/profile)
    useEffect(() => {
        const handleRestartEvent = () => {
            setCurrentStepIndex(0)
            setIsOpen(true)
        }
        window.addEventListener('finsight_restart_onboarding', handleRestartEvent)
        return () => window.removeEventListener('finsight_restart_onboarding', handleRestartEvent)
    }, [])

    if (!isOpen || !currentStep) return null

    // Calculate dynamic tooltip card styling
    const getCardStyle = (): React.CSSProperties => {
        const margin = 16
        const cardWidth = 360
        // Approximate height based on content density
        const estimatedHeight = 220 

        if (!targetRect) {
            // Render centered modal if no target element exists
            return {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: `${cardWidth}px`,
                zIndex: 9999,
            }
        }

        // Try placing below the highlighted target
        let top = targetRect.bottom + margin
        let left = targetRect.left + (targetRect.width - cardWidth) / 2

        // Keep card within viewport bounds
        left = Math.max(margin, Math.min(windowSize.width - cardWidth - margin, left))

        // If placing below exceeds screen height, flip it above the target
        if (top + estimatedHeight > windowSize.height) {
            top = targetRect.top - estimatedHeight - margin
        }

        // Clamp top bounds just in case
        top = Math.max(margin, Math.min(windowSize.height - estimatedHeight - margin, top))

        return {
            position: 'fixed',
            top: `${top}px`,
            left: `${left}px`,
            width: `${cardWidth}px`,
            zIndex: 9999,
            transition: 'all 0.45s cubic-bezier(0.25, 1, 0.5, 1)',
        }
    }

    const padding = 8
    const cutout = targetRect ? {
        x: targetRect.left - padding,
        y: targetRect.top - padding,
        width: targetRect.width + padding * 2,
        height: targetRect.height + padding * 2,
        rx: 12,
    } : null

    return (
        <div className="fixed inset-0 z-[9998] overflow-hidden select-none">
            {/* Full screen pointer events blocker to prevent clicking elements on the page */}
            <div className="fixed inset-0 z-[9996] pointer-events-auto" />

            {/* Backdrop and highlighted area */}
            {!cutout ? (
                // Step 1 or during transition: render a solid full screen overlay
                <div
                    className="fixed inset-0 bg-slate-950/65 backdrop-blur-[1.5px] z-[9997]"
                    style={{
                        transition: 'all 0.45s cubic-bezier(0.25, 1, 0.5, 1)',
                    }}
                />
            ) : (
                // Step with highlighted element: render the single cutout overlay div with a massive box-shadow
                <div
                    className="fixed border-2 border-primary/60 pointer-events-none z-[9997]"
                    style={{
                        left: `${cutout.x}px`,
                        top: `${cutout.y}px`,
                        width: `${cutout.width}px`,
                        height: `${cutout.height}px`,
                        borderRadius: `${cutout.rx}px`,
                        boxShadow: '0 0 0 9999px rgba(8, 13, 24, 0.65), 0 0 15px rgba(59, 130, 246, 0.35)',
                        transition: 'all 0.45s cubic-bezier(0.25, 1, 0.5, 1)',
                    }}
                />
            )}

            {/* Tooltip Card */}
            <div
                style={getCardStyle()}
                className="bg-slate-900/90 border-slate-700/80 shadow-2xl rounded-2xl border p-5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200"
            >
                {/* Accent Top Bar */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#3B82F6] via-[#a4c9ff] to-[#3B82F6] rounded-t-2xl" />

                {/* Card Header */}
                <div className="flex items-start justify-between mb-3">
                    <h4 className="text-white text-base font-bold flex items-center gap-1.5 leading-snug">
                        {currentStepIndex === 0 && <Sparkles className="h-4 w-4 text-blue-400 shrink-0 animate-bounce" />}
                        {currentStep.title}
                    </h4>
                    <button
                        onClick={handleComplete}
                        className="text-slate-400 hover:text-white transition-colors cursor-pointer p-0.5 rounded-lg hover:bg-slate-800"
                        title="Skip Tour"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Loading / Navigating indicator */}
                {isNavigating ? (
                    <div className="h-20 flex flex-col items-center justify-center text-slate-400 gap-2">
                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                        <span className="text-xs">Loading page element...</span>
                    </div>
                ) : (
                    /* Card Content */
                    <p className="text-slate-300 text-xs leading-relaxed mb-6 font-medium">
                        {currentStep.content}
                    </p>
                )}

                {/* Card Actions Footer */}
                <div className="flex items-center justify-between border-t border-slate-800/80 pt-4 mt-auto">
                    {/* Progress Indicator */}
                    <div className="flex flex-col gap-1">
                        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                            Step {currentStepIndex + 1} of {filteredSteps.length}
                        </span>
                        <div className="flex gap-1">
                            {filteredSteps.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`h-1 rounded-full transition-all duration-300 ${
                                        idx === currentStepIndex
                                            ? 'w-4 bg-primary'
                                            : idx < currentStepIndex
                                            ? 'w-1 bg-slate-600'
                                            : 'w-1 bg-slate-800'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Nav Action Buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleComplete}
                            className="text-slate-400 hover:text-white text-xs font-semibold cursor-pointer px-2 py-1.5 transition-colors"
                        >
                            Skip
                        </button>

                        {currentStepIndex > 0 && (
                            <button
                                onClick={handleBack}
                                disabled={isNavigating}
                                className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700/60 p-1.5 rounded-lg transition-all active:scale-95 cursor-pointer flex items-center"
                                title="Previous Step"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                        )}

                        <button
                            onClick={handleNext}
                            disabled={isNavigating}
                            className="bg-primary hover:bg-blue-600 disabled:opacity-50 text-primary-foreground font-semibold text-xs py-1.5 px-3.5 rounded-lg shadow-lg shadow-blue-500/10 flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                        >
                            <span>
                                {currentStepIndex === filteredSteps.length - 1 ? 'Finish' : 'Next'}
                            </span>
                            {currentStepIndex < filteredSteps.length - 1 && <ChevronRight className="h-3.5 w-3.5" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
