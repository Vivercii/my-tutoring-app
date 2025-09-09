'use client'

import React, { useEffect, useRef } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

interface KatexRendererProps {
  content: string
  className?: string
}

export default function KatexRenderer({ content, className = '' }: KatexRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Process the content to render LaTeX
    let processedHtml = content

    // Create a temporary element to decode HTML entities
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = content
    processedHtml = tempDiv.innerHTML

    // Replace $ ... $ for inline math (common LaTeX notation)
    processedHtml = processedHtml.replace(
      /\$([^\$]+)\$/g,
      (match, latex) => {
        try {
          return katex.renderToString(latex, {
            throwOnError: false,
            displayMode: false
          })
        } catch (e) {
          console.error('KaTeX error:', e)
          return `<span class="text-red-500">${match}</span>`
        }
      }
    )

    // Replace inline math \(...\)
    processedHtml = processedHtml.replace(
      /\\\(([^\\]+)\\\)/g,
      (match, latex) => {
        try {
          return katex.renderToString(latex, {
            throwOnError: false,
            displayMode: false
          })
        } catch (e) {
          console.error('KaTeX error:', e)
          return `<span class="text-red-500">${match}</span>`
        }
      }
    )

    // Replace display math \[...\]
    processedHtml = processedHtml.replace(
      /\\\[([^\\]+)\\\]/g,
      (match, latex) => {
        try {
          return katex.renderToString(latex, {
            throwOnError: false,
            displayMode: true
          })
        } catch (e) {
          console.error('KaTeX error:', e)
          return `<span class="text-red-500">${match}</span>`
        }
      }
    )

    // Set the processed HTML - the browser will handle HTML entities properly
    containerRef.current.innerHTML = processedHtml
  }, [content])

  return (
    <div 
      ref={containerRef}
      className={`${className} 
        [&_table]:border-collapse [&_table]:border [&_table]:border-gray-300
        [&_th]:border [&_th]:border-gray-300 [&_th]:px-3 [&_th]:py-2 [&_th]:bg-gray-50 [&_th]:font-medium [&_th]:text-sm
        [&_td]:border [&_td]:border-gray-300 [&_td]:px-3 [&_td]:py-2 [&_td]:text-center [&_td]:text-sm
        [&_table]:mx-auto [&_table]:my-2
      `}
    />
  )
}