import * as z from "zod"

export const searchSchema = z.object({
  query: z.string().min(3, {
    message: "Search query must be at least 3 characters.",
  }),
})

export type SearchInput = z.infer<typeof searchSchema>
