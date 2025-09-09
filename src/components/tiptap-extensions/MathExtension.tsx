import { Node, mergeAttributes, nodeInputRule } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import katex from 'katex'
import React, { useState, useRef, useEffect } from 'react'
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'

// The Math Node Extension
const MathExtension = Node.create({
  name: 'math',
  group: 'inline',
  inline: true,
  selectable: true,
  atom: true,

  addAttributes() {
    return {
      latex: {
        default: '',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="math"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes({ 'data-type': 'math' }, HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathNodeView)
  },

  addInputRules() {
    return [
      // Trigger math node with $$
      nodeInputRule({
        find: /\$\$([^$]+)\$\$$/,
        type: this.type,
        getAttributes: (match) => {
          const [, latex] = match
          return { latex }
        },
      }),
    ]
  },
})

// React Component for the Math Node
const MathNodeView = ({ node, updateAttributes, deleteNode, selected }: any) => {
  const [isEditing, setIsEditing] = useState(false)
  const [latex, setLatex] = useState(node.attrs.latex || '')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const renderMath = () => {
    try {
      return katex.renderToString(latex || 'x', {
        throwOnError: false,
        displayMode: false,
      })
    } catch (e) {
      return '<span class="text-red-500">Invalid LaTeX</span>'
    }
  }

  const handleSave = () => {
    try {
      // Test if LaTeX is valid
      katex.renderToString(latex, { throwOnError: true })
      updateAttributes({ latex })
      setIsEditing(false)
      setError('')
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      setLatex(node.attrs.latex)
      setIsEditing(false)
      setError('')
    }
  }

  if (isEditing) {
    return (
      <NodeViewWrapper className="inline-block">
        <div className="inline-flex flex-col gap-1">
          <div className="inline-flex items-center gap-2 px-2 py-1 bg-gray-800 border border-blue-500 rounded">
            <span className="text-gray-400 text-xs">LaTeX:</span>
            <input
              ref={inputRef}
              type="text"
              value={latex}
              onChange={(e) => setLatex(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              className="bg-transparent text-white text-sm outline-none min-w-[100px]"
              placeholder="e.g., x^2"
            />
          </div>
          {error && (
            <span className="text-red-400 text-xs">{error}</span>
          )}
        </div>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper className="inline-block">
      <span
        onClick={() => setIsEditing(true)}
        className={`
          inline-block px-2 py-0.5 rounded cursor-pointer transition-all
          ${selected 
            ? 'bg-blue-900 border border-blue-500' 
            : 'bg-gray-800 border border-gray-600 hover:border-gray-500'
          }
        `}
        dangerouslySetInnerHTML={{ __html: renderMath() }}
      />
    </NodeViewWrapper>
  )
}

export default MathExtension