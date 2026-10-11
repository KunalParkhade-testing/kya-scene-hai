'use client'

import { useEffect, useMemo } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Highlight from '@tiptap/extension-highlight'

type Props = { value: string; onChange: (value: string) => void; placeholder?: string }
const PREFIX = '__TIPTAP_JSON__:'
const colors = [
  { name: 'Yellow', value: '#ffe36a' },
  { name: 'Green', value: '#bce8c4' },
  { name: 'Blue', value: '#c7dcff' },
  { name: 'Pink', value: '#ffc7df' },
  { name: 'Orange', value: '#ffd0a3' },
  { name: 'Red', value: '#ffb5ad' },
]
const colorNames: Record<string, string> = Object.fromEntries(colors.map(c => [c.value, c.name.toLowerCase()]))

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}
function legacyInline(value: string) {
  let s = escapeHtml(value)
  s = s.replace(/==(yellow|green|blue|pink|orange|red)\|([\s\S]+?)==/g, (_, color, text) => '<mark data-color="' + color + '">' + text + '</mark>')
  s = s.replace(/==([\s\S]+?)==/g, '<mark data-color="yellow">$1</mark>')
  s = s.replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/~~([\s\S]+?)~~/g, '<s>$1</s>')
  s = s.replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
  s = s.replace(/&lt;u&gt;([\s\S]+?)&lt;\/u&gt;/g, '<u>$1</u>')
  s = s.replace(/\x60([^\x60\n]+)\x60/g, '<code>$1</code>')
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
  return s
}
function legacyHtml(value: string) {
  return value.split('\n').map(line => {
    const bullet = line.match(/^\s*[•*-]\s+(.+)$/)
    const numbered = line.match(/^\s*\d+[.)]\s+(.+)$/)
    if (bullet) return '<ul><li>' + legacyInline(bullet[1]) + '</li></ul>'
    if (numbered) return '<ol><li>' + legacyInline(numbered[1]) + '</li></ol>'
    return line.trim() ? '<p>' + legacyInline(line) + '</p>' : '<p></p>'
  }).join('')
}
function readValue(value: string) {
  if (value.startsWith(PREFIX)) {
    try { return JSON.parse(value.slice(PREFIX.length)) } catch { /* fall through to legacy text */ }
  }
  return legacyHtml(value)
}
export default function RichTextEditor({ value, onChange, placeholder = 'Write your text…' }: Props) {
  const extensions = useMemo(() => [
    StarterKit.configure({ link: { openOnClick: false, autolink: false } }),
    Highlight.configure({
      multicolor: true,
      HTMLAttributes: { class: 'editor-highlight' },
    }).extend({
      addAttributes() {
        return {
          color: {
            default: null,
            parseHTML: element => element.getAttribute('data-color') || element.getAttribute('data-highlight') || element.style.backgroundColor || null,
            renderHTML: attributes => {
              const raw = typeof attributes.color === 'string' ? attributes.color : ''
              const color = colorNames[raw.toLowerCase()] || raw.toLowerCase()
              return color ? { 'data-color': color, style: raw.startsWith('#') ? 'background-color: ' + raw : undefined } : {}
            },
          },
        }
      },
    }),
  ], [])
  const editor = useEditor({
    extensions,
    content: readValue(value),
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        class: 'rich-editable',
        role: 'textbox',
        'aria-multiline': 'true',
        'data-placeholder': placeholder,
      },
      transformPastedText: text => text,
    },
    onUpdate: ({ editor: current }) => {
      onChange(PREFIX + JSON.stringify(current.getJSON()))
    },
  })

  useEffect(() => {
    if (!editor) return
    const current = editor.getJSON()
    const serialized = PREFIX + JSON.stringify(current)
    if (value.startsWith(PREFIX) && value === serialized) return
    // Parent changes and article switches should update the editor, but never
    // replace the active document with its own last emitted value.
    const incoming = readValue(value)
    const currentText = editor.getText()
    const incomingText = typeof incoming === 'string' ? incoming : ''
    if (value.startsWith(PREFIX)) {
      if (JSON.stringify(current) !== value.slice(PREFIX.length)) {
        try {
          const parsed = JSON.parse(value.slice(PREFIX.length))
          if (JSON.stringify(parsed) !== JSON.stringify(current)) editor.commands.setContent(parsed, { emitUpdate: false })
        } catch { /* keep current document if a stored value is malformed */ }
      }
    } else if (currentText !== incomingText && !editor.isFocused) {
      editor.commands.setContent(incoming, { emitUpdate: false })
    }
  }, [editor, value])

  const command = (action: () => void) => { if (editor) { action(); editor.commands.focus() } }
  const setLink = () => {
    const url = window.prompt('Paste the full https:// link')
    if (url && /^https?:\/\//i.test(url)) editor?.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank', rel: 'noreferrer' }).run()
  }
  const toggleHighlight = (color: string) => command(() => {
    if (!editor) return
    const active = editor.isActive('highlight', { color })
    if (active) editor.chain().focus().unsetHighlight().run()
    else editor.chain().focus().setHighlight({ color }).run()
  })

  return <div className="rich-editor">
    <div className="rich-toolbar" role="toolbar" aria-label="Text formatting">
      <div className="rich-toolgroup">
        <button type="button" title="Bold" aria-label="Bold" aria-pressed={!!editor?.isActive('bold')} onMouseDown={e => e.preventDefault()} onClick={() => command(() => editor?.chain().focus().toggleBold().run())}><strong>B</strong></button>
        <button type="button" title="Italic" aria-label="Italic" aria-pressed={!!editor?.isActive('italic')} onMouseDown={e => e.preventDefault()} onClick={() => command(() => editor?.chain().focus().toggleItalic().run())}><em>I</em></button>
        <button type="button" title="Underline" aria-label="Underline" aria-pressed={!!editor?.isActive('underline')} onMouseDown={e => e.preventDefault()} onClick={() => command(() => editor?.chain().focus().toggleUnderline().run())}><u>U</u></button>
        <button type="button" title="Strikethrough" aria-label="Strikethrough" aria-pressed={!!editor?.isActive('strike')} onMouseDown={e => e.preventDefault()} onClick={() => command(() => editor?.chain().focus().toggleStrike().run())}><s>S</s></button>
      </div>
      <span className="rich-toolbar-divider" />
      <div className="rich-toolgroup highlight-swatches" role="group" aria-label="Highlight colour">
        {colors.map(c => <button key={c.name} type="button" title={c.name + ' highlight (click again to remove)'} aria-label={c.name + ' highlight'} aria-pressed={!!editor?.isActive('highlight', { color: c.value })} className="highlight-swatch" onMouseDown={e => e.preventDefault()} onClick={() => toggleHighlight(c.value)}><span style={{ backgroundColor: c.value }} /></button>)}
        <button type="button" title="Remove highlight" onMouseDown={e => e.preventDefault()} onClick={() => command(() => editor?.chain().focus().unsetHighlight().run())}>Clear</button>
      </div>
      <span className="rich-toolbar-divider" />
      <div className="rich-toolgroup">
        <button type="button" title="Bulleted list" onMouseDown={e => e.preventDefault()} onClick={() => command(() => editor?.chain().focus().toggleBulletList().run())}>• List</button>
        <button type="button" title="Numbered list" onMouseDown={e => e.preventDefault()} onClick={() => command(() => editor?.chain().focus().toggleOrderedList().run())}>1. List</button>
        <button type="button" title="Insert link" onMouseDown={e => e.preventDefault()} onClick={setLink}>Link</button>
        <button type="button" title="Inline code" onMouseDown={e => e.preventDefault()} onClick={() => command(() => editor?.chain().focus().toggleCode().run())}>Code</button>
      </div>
    </div>
    <EditorContent editor={editor} />
  </div>
}
