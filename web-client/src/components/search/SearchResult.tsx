"use client"

import ReactMarkdown from "react-markdown"

interface SearchResultProps {
  content: string
}

export function SearchResult({ content }: SearchResultProps) {
  return (
    <div className="prose prose-invert prose-sm max-w-none text-gray-300">
      <ReactMarkdown
        components={{
          h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-4 text-white" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-xl font-semibold mt-6 mb-3 text-gray-100 border-b border-slate-700 pb-2" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-lg font-medium mb-2 text-gray-200" {...props} />,
          p: ({ node, ...props }) => <p className="mb-4 leading-relaxed" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-4 space-y-2" {...props} />,
          li: ({ node, ...props }) => <li className="marker:text-emerald-500" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-semibold text-white" {...props} />,
          a: ({ node, ...props }) => <a className="text-emerald-500 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
          code: ({ node, ...props }) => <code className="bg-slate-800 text-emerald-400 rounded-md px-1.5 py-1 font-mono text-xs" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
