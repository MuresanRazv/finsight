"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Search } from "lucide-react"

import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { searchSchema, SearchInput } from "@/lib/validations/search"
import { semanticSearch } from "@/app/actions/search"
import { SearchResult } from "@/components/search/SearchResult"
import { SearchResultItem } from "@/lib/types/search"

export default function SearchPage() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SearchResultItem[] | null>(null)

  const form = useForm<SearchInput>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      query: "",
    },
  })

  function onSubmit(data: SearchInput) {
    setError(null)
    setResult(null)
    startTransition(async () => {
      const response = await semanticSearch(data)
      if (response.success) {
        setResult(response.data ?? null)
      } else {
        setError(response.message || "Something went wrong")
      }
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Semantic Search"
        description="Ask complex financial questions and get AI-powered insights."
      />
      <div className="space-y-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full max-w-2xl items-start space-x-2">
            <FormField
              control={form.control}
              name="query"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel className="sr-only">Search Query</FormLabel>
                  <FormControl>
                    <Input
                      className={"text-white"}
                      placeholder="e.g., 'What were the main drivers of NVIDIA's stock price in the last quarter?'"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-2 hidden sm:inline">Search</span>
            </Button>
          </form>
        </Form>

        {error && (
          <Card className="border-destructive bg-destructive/10">
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {result && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Search Results</h2>
            <SearchResult results={result} />
          </div>
        )}
      </div>
    </div>
  )
}
