'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { SearchResultItem } from '@/lib/types/search'
import { ChatResponse } from '@/lib/types/chat'

interface SearchState {
    // Semantic Search State
    searchQuery: string
    setSearchQuery: (query: string) => void
    searchResult: SearchResultItem[] | null
    setSearchResult: (results: SearchResultItem[] | null) => void
    searchHasSearched: boolean
    setSearchHasSearched: (hasSearched: boolean) => void
    resetSearchState: () => void

    // AI Chat State
    chatQuery: string
    setChatQuery: (query: string) => void
    chatResult: ChatResponse | null
    setChatResult: (result: ChatResponse | null) => void
    chatHasSearched: boolean
    setChatHasSearched: (hasSearched: boolean) => void
    resetChatState: () => void
}

const SearchContext = createContext<SearchState | undefined>(undefined)

export function SearchStateProvider({ children }: { children: ReactNode }) {
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResult, setSearchResult] = useState<SearchResultItem[] | null>(
        null,
    )
    const [searchHasSearched, setSearchHasSearched] = useState(false)

    const [chatQuery, setChatQuery] = useState('')
    const [chatResult, setChatResult] = useState<ChatResponse | null>(null)
    const [chatHasSearched, setChatHasSearched] = useState(false)

    const resetSearchState = () => {
        setSearchQuery('')
        setSearchResult(null)
        setSearchHasSearched(false)
        // Future filters state will be cleared here too
    }

    const resetChatState = () => {
        setChatQuery('')
        setChatResult(null)
        setChatHasSearched(false)
        // Future chat options/filters state will be cleared here too
    }

    return (
        <SearchContext.Provider
            value={{
                searchQuery,
                setSearchQuery,
                searchResult,
                setSearchResult,
                searchHasSearched,
                setSearchHasSearched,
                resetSearchState,

                chatQuery,
                setChatQuery,
                chatResult,
                setChatResult,
                chatHasSearched,
                setChatHasSearched,
                resetChatState,
            }}
        >
            {children}
        </SearchContext.Provider>
    )
}

export function useSearchState() {
    const context = useContext(SearchContext)
    if (context === undefined) {
        throw new Error(
            'useSearchState must be used within a SearchStateProvider',
        )
    }
    return context
}
