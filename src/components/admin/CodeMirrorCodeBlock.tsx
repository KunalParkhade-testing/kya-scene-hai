'use client'

import CodeMirror from '@uiw/react-codemirror'
import { StreamLanguage, indentUnit } from '@codemirror/language'
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { json } from '@codemirror/lang-json'
import { sql } from '@codemirror/lang-sql'
import { shell } from '@codemirror/legacy-modes/mode/shell'
import { yaml } from '@codemirror/lang-yaml'
import { markdown } from '@codemirror/lang-markdown'
import { cpp } from '@codemirror/lang-cpp'
import { java } from '@codemirror/lang-java'
import { go } from '@codemirror/lang-go'
import { rust } from '@codemirror/lang-rust'
import { swift } from '@codemirror/legacy-modes/mode/swift'
import { csharp } from '@replit/codemirror-lang-csharp'
import { insertNewlineAndIndent } from '@codemirror/commands'
import { keymap } from '@codemirror/view'
import { Prec } from '@codemirror/state'

function languageExtension(language: string) {
  switch (language) {
    case 'javascript':
    case 'jsx':
      return javascript({ jsx: true })
    case 'typescript':
    case 'tsx':
      return javascript({ jsx: language === 'tsx', typescript: true })
    case 'python':
      return python()
    case 'html':
      return html()
    case 'css':
      return css()
    case 'json':
      return json()
    case 'sql':
      return sql()
    case 'bash':
    case 'shell':
      return StreamLanguage.define(shell)
    case 'yaml':
      return yaml()
    case 'markdown':
      // Highlight Markdown syntax, but keep it as literal source in the editor and article.
      return markdown()
    case 'c':
    case 'cpp':
      return cpp()
    case 'csharp':
      return csharp()
    case 'java':
      return java()
    case 'go':
      return go()
    case 'rust':
      return rust()
    case 'swift':
      return StreamLanguage.define(swift)
    default:
      return []
  }
}

export default function CodeMirrorCodeBlock({ node, editor, getPos, updateAttributes }: NodeViewProps) {
  const language = String(node.attrs.language || 'text')
  const code = node.textContent

  function updateCode(value: string) {
    const position = getPos()
    if (typeof position !== 'number') return
    // Keep the CodeMirror document and Tiptap's canonical text content in sync.
    // Tiptap continues to own persistence, undo history, and article serialization.
    const from = position + 1
    const to = position + node.nodeSize - 1
    if (value !== node.textContent) {
      editor.view.dispatch(editor.state.tr.insertText(value, from, to))
    }
  }

  return (
    <NodeViewWrapper className="cm-code-block-node" data-language={language}>
      <div className="cm-code-block-label">{language === 'text' ? 'Plain text' : language.toUpperCase()}</div>
      <CodeMirror
        value={code}
        height="auto"
        minHeight="72px"
        extensions={[languageExtension(language),
          indentUnit.of('  '),
          Prec.high(
            keymap.of([
              {
                key: 'Enter',
                run: insertNewlineAndIndent,
              },
            ])
          ),
        ]}
        onChange={updateCode}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: true,
          highlightActiveLineGutter: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          indentOnInput: true,
          tabSize: 2,
        }}
        indentWithTab
        aria-label={language + ' code editor'}
      />
    </NodeViewWrapper>
  )
}
