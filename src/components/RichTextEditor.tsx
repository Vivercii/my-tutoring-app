'use client'

import React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import MathExtension from './tiptap-extensions/MathExtension'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { 
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, 
  AlignLeft, AlignCenter, AlignRight, Code, Quote, Heading1, 
  Heading2, Heading3, Undo, Redo, Type, Calculator, Eye, Edit3
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
  minHeight?: string
}

export default function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = 'Start typing...', 
  className = '',
  minHeight = '200px'
}: RichTextEditorProps) {
  const [showLatexInput, setShowLatexInput] = useState(false)
  const [latexFormula, setLatexFormula] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [renderedHtml, setRenderedHtml] = useState('')
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Placeholder.configure({
        placeholder
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph']
      }),
      MathExtension
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: `prose prose-invert prose-p:text-white prose-headings:text-white prose-li:text-white max-w-none focus:outline-none min-h-[${minHeight}] text-white ${className}`
      }
    },
    immediatelyRender: false
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])
  
  // Process LaTeX when content changes or preview mode is toggled
  useEffect(() => {
    if (showPreview && editor) {
      const html = getCleanHTML()
      const processedHtml = renderLatexInHtml(html)
      setRenderedHtml(processedHtml)
    }
  }, [showPreview, editor?.getHTML()])

  if (!editor) {
    return null
  }
  
  // Function to get clean HTML from editor
  const getCleanHTML = () => {
    if (!editor) return ''
    return editor.getHTML()
  }
  
  // Function to render LaTeX in HTML using KaTeX
  const renderLatexInHtml = (html: string): string => {
    // Replace inline math delimiters \(...\) with rendered KaTeX
    let processedHtml = html.replace(
      /\\\(([^\\]+)\\\)/g,
      (match, latex) => {
        try {
          return katex.renderToString(latex, {
            throwOnError: false,
            displayMode: false
          })
        } catch (e) {
          console.error('KaTeX error:', e)
          return `<span class="math-error">${match}</span>`
        }
      }
    )
    
    // Replace display math delimiters \[...\] with rendered KaTeX
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
          return `<span class="math-error">${match}</span>`
        }
      }
    )
    
    return processedHtml
  }

  const MenuButton = ({ onClick, isActive, children, title }: any) => (
    <button
      onClick={onClick}
      className={`p-1.5 rounded hover:bg-gray-700 transition-colors ${
        isActive ? 'bg-gray-700 text-white' : 'text-gray-400'
      }`}
      title={title}
    >
      {children}
    </button>
  )

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-gray-700 p-2 flex flex-wrap gap-1">
        <div className={`flex gap-1 pr-2 border-r border-gray-700 ${showPreview ? 'opacity-30 pointer-events-none' : ''}`}>
          <MenuButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="Underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </MenuButton>
        </div>

        <div className={`flex gap-1 px-2 border-r border-gray-700 ${showPreview ? 'opacity-30 pointer-events-none' : ''}`}>
          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().setParagraph().run()}
            isActive={editor.isActive('paragraph')}
            title="Paragraph"
          >
            <Type className="h-4 w-4" />
          </MenuButton>
        </div>

        <div className={`flex gap-1 px-2 border-r border-gray-700 ${showPreview ? 'opacity-30 pointer-events-none' : ''}`}>
          <MenuButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Ordered List"
          >
            <ListOrdered className="h-4 w-4" />
          </MenuButton>
        </div>

        <div className={`flex gap-1 px-2 border-r border-gray-700 ${showPreview ? 'opacity-30 pointer-events-none' : ''}`}>
          <MenuButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </MenuButton>
        </div>

        <div className={`flex gap-1 px-2 border-r border-gray-700 ${showPreview ? 'opacity-30 pointer-events-none' : ''}`}>
          <MenuButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive('code')}
            title="Code"
          >
            <Code className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </MenuButton>
        </div>

        <div className={`flex gap-1 px-2 border-r border-gray-700 ${showPreview ? 'opacity-30 pointer-events-none' : ''}`}>
          <MenuButton
            onClick={() => editor.chain().focus().undo().run()}
            isActive={false}
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().redo().run()}
            isActive={false}
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </MenuButton>
        </div>
        
        <div className={`flex gap-1 px-2 border-r border-gray-700 ${showPreview ? 'opacity-30 pointer-events-none' : ''}`}>
          <MenuButton
            onClick={() => setShowLatexInput(!showLatexInput)}
            isActive={showLatexInput}
            title="Insert Math Formula"
          >
            <Calculator className="h-4 w-4" />
          </MenuButton>
        </div>
        
        <div className="flex gap-1 px-2">
          <MenuButton
            onClick={() => setShowPreview(!showPreview)}
            isActive={showPreview}
            title={showPreview ? "Edit Mode" : "Preview"}
          >
            {showPreview ? <Edit3 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </MenuButton>
        </div>
      </div>
      
      {/* LaTeX Input */}
      {showLatexInput && (
        <div className="border-b border-gray-700 p-2">
          <div className="flex gap-2 mb-1">
          <input
            type="text"
            value={latexFormula}
            onChange={(e) => setLatexFormula(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && latexFormula) {
                e.preventDefault()
                // Insert Math node with LaTeX
                try {
                  editor.chain().focus().insertContent({
                    type: 'math',
                    attrs: {
                      latex: latexFormula
                    }
                  }).run()
                  setLatexFormula('')
                  setShowLatexInput(false)
                } catch (error) {
                  console.error('Error inserting math:', error)
                }
              }
            }}
            placeholder="Enter LaTeX formula (e.g., x^2, \sqrt{x}, \frac{a}{b})"
            className="flex-1 px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-red-500"
          />
          <button
            onClick={() => {
              if (latexFormula) {
                // Insert Math node with LaTeX
                try {
                  editor.chain().focus().insertContent({
                    type: 'math',
                    attrs: {
                      latex: latexFormula
                    }
                  }).run()
                  setLatexFormula('')
                  setShowLatexInput(false)
                } catch (error) {
                  console.error('Error inserting math:', error)
                }
              }
            }}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
          >
            Insert
          </button>
          <button
            onClick={() => {
              setShowLatexInput(false)
              setLatexFormula('')
            }}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
          >
            Cancel
          </button>
          </div>
          <p className="text-xs text-gray-400">Tip: You can also type $$ formula $$ directly in the editor</p>
        </div>
      )}

      {/* Editor or Preview */}
      <div className="p-4 prose-invert">
        {showPreview ? (
          <div className="min-h-[200px]">
            <div className="mb-2 pb-2 border-b border-gray-700">
              <span className="text-xs text-gray-400 uppercase tracking-wider">Preview Mode</span>
            </div>
            <div 
              className="text-white prose prose-invert max-w-none [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_p]:text-white [&_ul]:text-white [&_ol]:text-white [&_li]:text-white [&_blockquote]:text-gray-300 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-600 [&_blockquote]:pl-4 [&_code]:bg-gray-800 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-blue-300 [&_.katex]:text-white"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          </div>
        ) : (
          <EditorContent 
            editor={editor} 
            className="text-white [&_p]:text-white [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_ul]:text-white [&_ol]:text-white [&_li]:text-white [&_blockquote]:text-gray-300" 
          />
        )}
      </div>
    </div>
  )
}