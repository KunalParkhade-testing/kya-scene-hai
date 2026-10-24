'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import type { Article, ArticleBlock, Category } from '@/lib/types'
import type { User } from '@supabase/supabase-js'
import RichTextEditor from '@/components/admin/RichTextEditor'
import ArticlePreview from '@/components/admin/ArticlePreview'

type Block = { id: string; type: 'paragraph' | 'heading' | 'callout' | 'image'; text: string; url?: string; alt?: string }
  | { id: string; type: 'quote'; text: string; attribution?: string; url?: string; alt?: string }
type Source = { title: string; url: string; publisher: string; verified: boolean }
type EditorForm = {
  title: string
  slug: string
  dek: string
  seo_title: string
  seo_description: string
  editorial_note: string
  hero_text: string
  hero_image: string
  media_folder: string
  is_featured: boolean
  category_id: string
  reading_minutes: string
  status: 'draft' | 'published' | 'archived'
  published_at: string | null
  body: Block[]
  sources: Source[]
}
type Panel = 'settings' | 'toc' | 'sources' | 'seo'
type StoryFilter = 'all' | 'draft' | 'published' | 'archived'
type JsonNode = { type?: string; text?: string; content?: JsonNode[] }

function newBlockId() {
  return globalThis.crypto?.randomUUID?.() ?? `block-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function makeBlock(type: Block['type']): Block {
  return {
    id: newBlockId(),
    type,
    text: '',
    ...(type === 'image' ? { url: '', alt: '' } : {}),
    ...(type === 'quote' ? { attribution: '' } : {}),
  }
}

function serializeBlock(block: Block): Exclude<ArticleBlock, { type: 'source' }> {
  if (block.type === 'quote') return { type: block.type, text: block.text, ...(block.attribution ? { attribution: block.attribution } : {}) }
  if (block.type === 'image') return { type: block.type, text: block.text, url: block.url, alt: block.alt }
  return { type: block.type, text: block.text }
}

function createEmptyForm(): EditorForm {
  return {
  title: '',
  slug: '',
  dek: '',
  seo_title: '',
  seo_description: '',
  editorial_note: '',
  hero_text: '',
  hero_image: '',
  media_folder: '',
  is_featured: false,
  category_id: '',
  reading_minutes: '8',
  status: 'draft',
  published_at: null,
  body: [makeBlock('paragraph')],
  sources: [],
  }
}
const tiptapPrefix = '__TIPTAP_JSON__:'
const blockTypes: { type: Block['type']; label: string }[] = [
  { type: 'paragraph', label: 'Paragraph' },
  { type: 'heading', label: 'Heading' },
  { type: 'quote', label: 'Quote' },
  { type: 'callout', label: 'Callout' },
  { type: 'image', label: 'Image' },
]

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function headingTexts(value: string): string[] {
  if (!value.startsWith(tiptapPrefix)) return []
  try {
    const visit = (node: JsonNode): string[] => {
      if (node.type === 'heading') {
        const text = (node.content ?? []).map(child => child.text ?? '').join('').trim()
        return text ? [text] : []
      }
      return (node.content ?? []).flatMap(visit)
    }
    return visit(JSON.parse(value.slice(tiptapPrefix.length)) as JsonNode)
  } catch {
    return []
  }
}

function getBlockText(block: Block) {
  if (block.type === 'heading' && block.text.trim()) return [block.text.trim()]
  return headingTexts(block.text)
}

export default function AdminStudio() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [auth, setAuth] = useState({ email: '', password: '' })
  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState<EditorForm>(createEmptyForm)
  const [editing, setEditing] = useState<number | null>(null)
  const [editorOpen, setEditorOpen] = useState(true)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadNames, setUploadNames] = useState<Record<string, string>>({})
  const [panel, setPanel] = useState<Panel>('settings')
  const [storyFilter, setStoryFilter] = useState<StoryFilter>('all')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<{ id: string; position: 'before' | 'after' } | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const pointerDrag = useRef<{ id: string; pointerId: number; startX: number; startY: number; active: boolean } | null>(null)
  const closePreview = useCallback(() => setPreviewOpen(false), [])

  const loadContent = useCallback(async () => {
    const [{ data: articleData, error: articlesError }, { data: categoryData, error: categoriesError }] = await Promise.all([
      supabase.from('articles').select('*,categories(name,slug)').order('updated_at', { ascending: false }),
      supabase.from('categories').select('*').order('name'),
    ])
    if (articlesError || categoriesError) {
      setMessage(articlesError?.message || categoriesError?.message || 'Could not load editorial content.')
      return
    }
    setArticles((articleData ?? []) as Article[])
    setCategories((categoryData ?? []) as Category[])
  }, [supabase])

  const load = useCallback(async () => {
    const { data: { user: currentUser }, error } = await supabase.auth.getUser()
    if (error) {
      setMessage(error.message)
      return
    }
    setUser(currentUser)
    if (currentUser) await loadContent()
    else {
      setArticles([])
      setCategories([])
    }
  }, [loadContent, supabase])

  useEffect(() => {
    let active = true
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null
      setUser(nextUser)
      if (nextUser) {
        window.setTimeout(() => {
          if (active) void loadContent()
        }, 0)
      } else {
        setArticles([])
        setCategories([])
      }
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [loadContent, supabase])

  const admin = user?.app_metadata?.role === 'admin'
  const filteredArticles = storyFilter === 'all' ? articles : articles.filter(article => article.status === storyFilter)
  const outline = form.body.flatMap((block, blockIndex) =>
    getBlockText(block).map((text, headingIndex) => ({
      id: `story-block-${blockIndex}`,
      key: `story-block-${blockIndex}-${headingIndex}`,
      text,
      blockIndex,
    })),
  )

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    const { error } = await supabase.auth.signInWithPassword(auth)
    setMessage(error?.message || 'Signed in.')
    setBusy(false)
    if (!error) await load()
  }

  function updateBlock(index: number, patch: Partial<Block>) {
    setForm(current => ({ ...current, body: current.body.map((block, blockIndex) => blockIndex === index ? { ...block, ...patch } : block) }))
  }

  function updateSource(index: number, patch: Partial<Source>) {
    setForm(current => ({ ...current, sources: current.sources.map((source, sourceIndex) => sourceIndex === index ? { ...source, ...patch } : source) }))
  }

  function addSource() {
    setForm(current => ({ ...current, sources: [...current.sources, { title: '', url: '', publisher: '', verified: false }] }))
  }

  function removeSource(index: number) {
    setForm(current => ({ ...current, sources: current.sources.filter((_, sourceIndex) => sourceIndex !== index) }))
  }

  function addBlock(type: Block['type'], afterIndex = form.body.length - 1) {
    const block = makeBlock(type)
    setForm(current => ({
      ...current,
      body: [...current.body.slice(0, afterIndex + 1), block, ...current.body.slice(afterIndex + 1)],
    }))
    setMessage('')
  }

  function removeBlock(index: number) {
    setForm(current => ({ ...current, body: current.body.filter((_, blockIndex) => blockIndex !== index) }))
  }

  function moveBlock(index: number, direction: -1 | 1) {
    setForm(current => {
      const target = index + direction
      if (target < 0 || target >= current.body.length) return current
      const body = [...current.body]
      ;[body[index], body[target]] = [body[target], body[index]]
      return { ...current, body }
    })
  }

  function duplicateBlock(index: number) {
    setForm(current => ({
      ...current,
      body: [...current.body.slice(0, index + 1), { ...current.body[index], id: newBlockId() }, ...current.body.slice(index + 1)],
    }))
  }

  function reorderBlock(blockId: string, targetId: string, position: 'before' | 'after') {
    setForm(current => {
      const fromIndex = current.body.findIndex(block => block.id === blockId)
      const targetIndex = current.body.findIndex(block => block.id === targetId)
      if (fromIndex < 0 || targetIndex < 0 || fromIndex === targetIndex) return current
      const insertionIndex = targetIndex + (position === 'after' ? 1 : 0)
      const toIndex = fromIndex < insertionIndex ? insertionIndex - 1 : insertionIndex
      if (toIndex === fromIndex) return current
      const body = [...current.body]
      const [block] = body.splice(fromIndex, 1)
      body.splice(toIndex, 0, block)
      return { ...current, body }
    })
  }

  function handleBlockPointerDown(event: ReactPointerEvent<HTMLDivElement>, blockId: string) {
    if (!event.isPrimary || event.button !== 0) return
    pointerDrag.current = { id: blockId, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, active: false }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handleBlockPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const current = pointerDrag.current
    if (!current || current.pointerId !== event.pointerId) return
    if (!current.active) {
      if (Math.hypot(event.clientX - current.startX, event.clientY - current.startY) < 6) return
      current.active = true
      setDraggingBlockId(current.id)
    }

    const targetElement = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-block-id]')
    const targetId = targetElement?.dataset.blockId
    if (!targetElement || !targetId || targetId === current.id) {
      setDropTarget(null)
      return
    }
    const rect = targetElement.getBoundingClientRect()
    const position = event.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
    setDropTarget({ id: targetId, position })
    reorderBlock(current.id, targetId, position)
  }

  function endBlockPointerDrag(pointerId: number) {
    if (pointerDrag.current?.pointerId !== pointerId) return
    pointerDrag.current = null
    setDraggingBlockId(null)
    setDropTarget(null)
  }

  async function upload(file: File, target: 'hero' | { blockId: string }, requestedName: string) {
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) {
      setMessage('Use PNG, JPG, WEBP or GIF.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setMessage('Image must be 10 MB or smaller.')
      return
    }
    const folder = slugify(form.media_folder || form.slug || form.title)
    if (!folder) {
      setMessage('Add an article title or folder name before uploading an image.')
      return
    }
    const extensionByType: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/webp': 'webp',
      'image/gif': 'gif',
    }
    const customName = requestedName.trim()
    const normalizedName = customName ? slugify(customName) : ''
    if (customName && !normalizedName) {
      setMessage('Use letters or numbers for the image filename.')
      return
    }

    setUploading(true)
    setMessage('')
    const { data: existingFiles, error: listError } = await supabase.storage.from('article-media').list(folder, { limit: 1000 })
    if (listError) {
      setMessage(listError.message)
      setUploading(false)
      return
    }
    let baseName = normalizedName
    if (!baseName) {
      const usedNumbers = new Set(
        (existingFiles ?? [])
          .map(item => item.name.match(/^(\d+)\.[^.]+$/)?.[1])
          .filter((name): name is string => !!name)
          .map(Number),
      )
      let nextNumber = 1
      while (usedNumbers.has(nextNumber)) nextNumber += 1
      baseName = String(nextNumber)
    }
    const path = `${folder}/${baseName}.${extensionByType[file.type]}`
    if ((existingFiles ?? []).some(item => item.name === `${baseName}.${extensionByType[file.type]}`)) {
      setMessage(`An image named ${baseName}.${extensionByType[file.type]} already exists in this folder.`)
      setUploading(false)
      return
    }
    const { error } = await supabase.storage.from('article-media').upload(path, file, { contentType: file.type, upsert: false })
    if (error) {
      setMessage(error.message)
      setUploading(false)
      return
    }
    const { data } = supabase.storage.from('article-media').getPublicUrl(path)
    setForm(current => ({
      ...current,
      media_folder: folder,
      ...(target === 'hero'
        ? { hero_image: data.publicUrl }
        : { body: current.body.map(block => block.id === target.blockId ? { ...block, url: data.publicUrl } : block) }),
    }))
    const targetKey = target === 'hero' ? 'hero' : target.blockId
    setUploadNames(current => ({ ...current, [targetKey]: '' }))
    setMessage(`Image uploaded to ${path}.`)
    setUploading(false)
  }

  async function save(exitAfterSave = false, statusOverride?: EditorForm['status']) {
    if (!formRef.current?.reportValidity()) return
    if (!form.category_id) {
      setPanel('settings')
      setMessage('Choose a category before saving.')
      return
    }
    const mediaFolder = slugify(form.media_folder || form.slug || form.title)
    if (!mediaFolder) {
      setPanel('settings')
      setMessage('Enter an image folder name using letters or numbers.')
      return
    }
    setBusy(true)
    setMessage('')
    const status = statusOverride ?? form.status
    const publishedAt = form.published_at || (status === 'published' ? new Date().toISOString() : null)
    const payload = {
      title: form.title,
      slug: form.slug || slugify(form.title),
      dek: form.dek,
      seo_title: form.seo_title.trim() || null,
      seo_description: form.seo_description.trim() || null,
      editorial_note: form.editorial_note.trim() || null,
      hero_text: form.hero_text,
      hero_image: form.hero_image || null,
      media_folder: mediaFolder,
      is_featured: form.is_featured,
      category_id: form.category_id ? Number(form.category_id) : null,
      reading_minutes: Number(form.reading_minutes) || null,
      status,
      body: [
        ...form.body.filter(block => block.type !== 'image' || block.url || block.text).map(serializeBlock),
        ...form.sources.filter(source => source.title.trim() && source.url.trim()).map(source => ({ type: 'source', ...source })),
      ],
      published_at: publishedAt,
      updated_at: new Date().toISOString(),
    }
    let savedId = editing
    let errorMessage: string | null = null
    if (editing) {
      const result = await supabase.from('articles').update(payload).eq('id', editing)
      errorMessage = result.error?.message ?? null
    } else {
      const result = await supabase.from('articles').insert(payload).select('id').single()
      errorMessage = result.error?.message ?? null
      if (!errorMessage && result.data) savedId = result.data.id
      else if (!errorMessage) errorMessage = 'The story was saved, but its ID could not be confirmed. Refresh the story list before saving again.'
    }
    setMessage(errorMessage || (exitAfterSave ? 'Saved. Exiting editor…' : status === 'published' ? 'Published.' : 'Saved.'))
    setBusy(false)
    if (errorMessage) return

    setForm(current => ({
      ...current,
      status,
      published_at: publishedAt,
      media_folder: payload.media_folder || '',
    }))
    await load()
    if (exitAfterSave) {
      setForm(createEmptyForm())
      setUploadNames({})
      setEditing(null)
      setEditorOpen(false)
      setStoryFilter('all')
      window.setTimeout(() => document.getElementById('story-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
    } else {
      setEditing(savedId)
    }
  }

  function edit(article: Article) {
    setEditorOpen(true)
    setPanel('settings')
    setUploadNames({})
    const raw: ArticleBlock[] = Array.isArray(article.body) ? article.body : []
    const sources: Source[] = raw
      .filter((block): block is Extract<ArticleBlock, { type: 'source' }> => typeof block === 'object' && block.type === 'source')
      .map(source => ({ title: source.title || '', url: source.url || '', publisher: source.publisher || '', verified: !!source.verified }))
    const content = raw.filter((block): block is Exclude<ArticleBlock, Extract<ArticleBlock, { type: 'source' }>> => typeof block === 'string' || block.type !== 'source')
    const body: Block[] = content.map(block => typeof block === 'string'
      ? { id: newBlockId(), type: 'paragraph', text: block }
      : { ...block, id: newBlockId() })
    setEditing(article.id)
    setForm({
      title: article.title,
      slug: article.slug,
      dek: article.dek || '',
      seo_title: article.seo_title || '',
      seo_description: article.seo_description || '',
      editorial_note: article.editorial_note || '',
      hero_text: article.hero_text || '',
      hero_image: article.hero_image || '',
      media_folder: article.media_folder || slugify(article.slug),
      is_featured: article.is_featured,
      category_id: article.category_id ? String(article.category_id) : '',
      reading_minutes: String(article.reading_minutes || 8),
      status: article.status,
      published_at: article.published_at || null,
      body: body.length ? body : [makeBlock('paragraph')],
      sources,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function remove(id: number) {
    if (!confirm('Delete this story?')) return
    const { error } = await supabase.from('articles').delete().eq('id', id)
    setMessage(error?.message || 'Deleted.')
    await load()
  }

  function startNewStory() {
    setEditing(null)
    setForm(createEmptyForm())
    setUploadNames({})
    setPanel('settings')
    setEditorOpen(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function blockTools(afterIndex: number) {
    return (
      <details className="studio-add-block-menu">
        <summary>{afterIndex < 0 ? '＋ Add block' : '＋ Add after'}</summary>
        <div className="studio-block-insert" role="group" aria-label="Choose a content block">
          {blockTypes.map(({ type, label }) => (
            <button key={type} type="button" onClick={event => {
              addBlock(type, afterIndex)
              const details = event.currentTarget.closest('details')
              if (details) details.open = false
            }}>{label}</button>
          ))}
        </div>
      </details>
    )
  }

  if (!user) {
    return (
      <div className="adminwrap">
        <div className="adminlogin">
          <div className="kicker">Kya Scene Hai?</div>
          <h1>EDITORIAL<br />STUDIO.</h1>
          <p>Sign in with your Supabase account to manage the newsroom.</p>
          <form onSubmit={login} className="adminform">
            <input type="email" placeholder="Editor email" value={auth.email} onChange={event => setAuth({ ...auth, email: event.target.value })} required />
            <input type="password" placeholder="Password" value={auth.password} onChange={event => setAuth({ ...auth, password: event.target.value })} required />
            <button disabled={busy}>{busy ? 'Signing in…' : 'Enter studio →'}</button>
          </form>
          {message && <p className="adminmsg" role="status">{message}</p>}
        </div>
      </div>
    )
  }

  if (!admin) {
    return (
      <div className="adminwrap">
        <div className="adminlogin">
          <div className="kicker">Signed in</div>
          <h1>NO<br />ACCESS.</h1>
          <p>Your account is authenticated, but it does not have the <b>admin</b> app_metadata role required for the editorial studio.</p>
          <p className="adminhint">In Supabase Auth, set your user&apos;s App Metadata to <code>{`{"role":"admin"}`}</code>, then sign out and back in.</p>
          <button onClick={() => void supabase.auth.signOut()}>Sign out</button>
        </div>
      </div>
    )
  }

  return (
    <div className="adminwrap studio-shell">
      <header className="adminbar studio-topbar">
        <a href="/" className="logo"><span>KYA SCENE HAI?</span></a>
        <span className="studio-brand">EDITORIAL STUDIO</span>
        <div className="studio-top-actions">
          <span className="studio-save-status" role="status">{busy ? 'Saving…' : message}</span>
          <a href="/" className="secondary">View site</a>
          <a href="/admin/guide" className="secondary">Writing guide</a>
          {editorOpen && (
            <>
              <button className="secondary" type="button" disabled={busy || uploading} onClick={() => setPreviewOpen(true)}>Preview</button>
              <button className="secondary" type="button" disabled={busy || uploading} onClick={() => void save(false)}>Save</button>
              <button className="secondary studio-exit-save" type="button" disabled={busy || uploading} onClick={() => void save(true)}>Save &amp; Exit</button>
              <button className="studio-publish" type="button" disabled={busy || uploading} onClick={() => void save(false, 'published')}>Publish</button>
            </>
          )}
          <button type="button" onClick={() => void supabase.auth.signOut()}>Sign out</button>
        </div>
      </header>

      <main className="studio-layout">
        <aside className="studio-rail" aria-label="Editorial workspace">
          <p className="studio-rail-label">WORKSPACE</p>
          <button type="button" className="studio-rail-primary" onClick={startNewStory}>＋ Write new story</button>
          {([
            ['all', 'All stories'],
            ['draft', 'Drafts'],
            ['published', 'Published'],
            ['archived', 'Archive'],
          ] as [StoryFilter, string][]).map(([filter, label]) => (
            <button key={filter} type="button" className={storyFilter === filter ? 'is-current-filter' : ''} onClick={() => {
              setStoryFilter(filter)
              document.getElementById('story-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}>{label}</button>
          ))}
          <p className="studio-rail-label">THIS STORY</p>
          <button type="button" className={panel === 'settings' ? 'is-active' : ''} onClick={() => setPanel('settings')}>Details</button>
          <button type="button" className="studio-rail-content" onClick={() => document.getElementById('story-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Content</button>
          <button type="button" className={panel === 'sources' ? 'is-active' : ''} onClick={() => setPanel('sources')}>Sources ({form.sources.length})</button>
          <button type="button" className={panel === 'seo' ? 'is-active' : ''} onClick={() => setPanel('seo')}>SEO &amp; Preview</button>
        </aside>

        <div className="studio-workspace">
          <div className="studio-heading">
            <div className="studio-heading-title">
              <div className="kicker">{editing ? `${form.status.toUpperCase()} STORY` : 'NEW STORY / DRAFT'}</div>
              <h1>{form.title || 'Untitled story'}</h1>
            </div>
            <button type="button" className="secondary" onClick={startNewStory}>+ New story</button>
          </div>

          {editorOpen && (
            <form
              ref={formRef}
              className="studio-form"
              onSubmit={event => {
                event.preventDefault()
                void save()
              }}
            >
              <section className="studio-canvas" aria-label="Story content">
                <label className="studio-title-field">Article title
                  <input value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} required />
                </label>
                <label className="studio-dek-field">Short description
                  <textarea value={form.dek} onChange={event => setForm({ ...form, dek: event.target.value })} rows={2} />
                </label>

                <div className="studio-content-heading" id="story-content">
                  <div><span className="kicker">STORY BUILDER</span><h2>CONTENT</h2></div>
                  <span>{form.body.length} blocks</span>
                </div>
                <p className="format-help">Select text in a block to format it. Add headings to build the article navigation.</p>
                {blockTools(-1)}

                <div className="studio-block-list">
                  {form.body.map((block, index) => (
                    <section
                      className={`studio-block studio-block-type-${block.type}${draggingBlockId === block.id ? ' is-dragging' : ''}${dropTarget?.id === block.id ? ` drop-${dropTarget.position}` : ''}`}
                      id={`story-block-${index}`}
                      data-block-id={block.id}
                      key={`${editing ?? 'new'}-${block.id}`}
                    >
                      <div
                        className="studio-block-handle"
                        aria-hidden="true"
                        onPointerDown={event => handleBlockPointerDown(event, block.id)}
                        onPointerMove={handleBlockPointerMove}
                        onPointerUp={event => endBlockPointerDrag(event.pointerId)}
                        onPointerCancel={event => endBlockPointerDrag(event.pointerId)}
                        onLostPointerCapture={event => endBlockPointerDrag(event.pointerId)}
                      >
                        <span>⠿</span>
                      </div>
                      <div className="studio-block-content">
                        <div className="studio-block-head">
                          <div className="studio-block-title">
                            <span className="studio-block-kind" aria-hidden="true">
                              {block.type === 'heading' ? 'H2' : block.type === 'image' ? '▧' : block.type === 'callout' ? '✳' : block.type === 'quote' ? '“' : '¶'}
                            </span>
                            <strong>{block.type === 'heading' ? 'Heading' : block.type[0].toUpperCase() + block.type.slice(1)}</strong>
                          </div>
                          <div>
                            <button type="button" aria-label={`Move block ${index + 1} up`} title="Move up" disabled={index === 0} onClick={() => moveBlock(index, -1)}>↑</button>
                            <button type="button" aria-label={`Move block ${index + 1} down`} title="Move down" disabled={index === form.body.length - 1} onClick={() => moveBlock(index, 1)}>↓</button>
                            <button type="button" aria-label={`Duplicate block ${index + 1}`} title="Duplicate" onClick={() => duplicateBlock(index)}>⧉</button>
                            <button type="button" aria-label={`Remove block ${index + 1}`} title="Remove" onClick={() => removeBlock(index)}>×</button>
                          </div>
                        </div>

                        {block.type === 'image' ? (
                          <div className="studio-image-fields">
                            <label>Image URL
                              <input value={block.url || ''} onChange={event => updateBlock(index, { url: event.target.value })} placeholder="Paste a public image URL" />
                            </label>
                            <label>Filename without extension (optional)
                              <input
                                maxLength={100}
                                value={uploadNames[block.id] || ''}
                                onChange={event => setUploadNames(current => ({ ...current, [block.id]: event.target.value }))}
                                placeholder="Automatic: 1, 2, 3…"
                              />
                            </label>
                            <label className="studio-upload">Upload image
                              <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={event => {
                                const file = event.target.files?.[0]
                                if (file) void upload(file, { blockId: block.id }, uploadNames[block.id] || '')
                              }} disabled={uploading} />
                            </label>
                            <label>Alt text
                              <input value={block.alt || ''} onChange={event => updateBlock(index, { alt: event.target.value })} placeholder="Describe the image for readers" />
                            </label>
                            {block.url && <Image className="adminblockimage" src={block.url} alt={block.alt || ''} width={800} height={600} unoptimized />}
                          </div>
                        ) : block.type === 'heading' ? (
                          <input className="studio-heading-input" value={block.text} onChange={event => updateBlock(index, { text: event.target.value })} placeholder="Section heading" />
                        ) : (
                          <>
                            <RichTextEditor
                              key={`${editing ?? 'new'}-${index}-${block.type}`}
                              value={block.text}
                              onChange={value => updateBlock(index, { text: value })}
                              placeholder={block.type === 'quote' ? 'Write your quote…' : block.type === 'callout' ? 'Write a key takeaway…' : 'Write your paragraph…'}
                            />
                            {block.type === 'quote' && (
                              <input aria-label="Quote attribution (optional)" value={block.attribution || ''} onChange={event => updateBlock(index, { attribution: event.target.value })} placeholder="Person who said it (optional)" />
                            )}
                          </>
                        )}
                        {blockTools(index)}
                      </div>
                    </section>
                  ))}
                </div>
                <p className="studio-block-reorder-help" id="studio-block-reorder-help">
                  Drag the six-dot handle to reorder blocks. On touchscreens, drag with a finger. Use each block&apos;s Move up and Move down buttons for keyboard reordering.
                </p>
              </section>
              <button className="studio-form-save" type="submit" disabled={busy || uploading}>Save changes</button>
            </form>
          )}
        </div>

        {editorOpen && (
          <aside className="studio-inspector" aria-label="Story inspector">
            <section className="studio-optimization-note" aria-label="Content optimization suggestions">
              <strong>Optimization note</strong>
              <p>OpenXYZ suggestions for social previews and search results:</p>
              <ul>
                <li>Hero image: 1200 × 630 px and under 1 MB.</li>
                <li>Article title: aim for 60 characters or fewer.</li>
                <li>Description: aim for 125 characters or fewer.</li>
                <li>Page title (SEO title): aim for 60 characters or fewer; Google often truncates longer titles, though display varies.</li>
              </ul>
            </section>
            <div className="studio-tabs" aria-label="Story settings">
              {([
                ['settings', 'Settings'],
                ['toc', 'TOC'],
                ['sources', `Sources (${form.sources.length})`],
                ['seo', 'SEO'],
              ] as [Panel, string][]).map(([id, label]) => (
                <button key={id} type="button" aria-pressed={panel === id} onClick={() => setPanel(id)}>{label}</button>
              ))}
            </div>

            {panel === 'settings' && (
              <div className="studio-panel" role="tabpanel">
                <h2>Basic details</h2>
                <label>Slug
                  <div className="studio-slug-field">
                    <input value={form.slug} onChange={event => setForm({ ...form, slug: event.target.value })} placeholder={slugify(form.title) || 'story-slug'} />
                    <button type="button" className="secondary" onClick={() => setForm({ ...form, slug: slugify(form.title) })}>Generate</button>
                  </div>
                </label>
                <label>Image folder
                  <input
                    maxLength={80}
                    value={form.media_folder}
                    onChange={event => setForm({ ...form, media_folder: event.target.value })}
                    placeholder={slugify(form.slug || form.title) || 'article-folder'}
                  />
                </label>
                <p className="studio-help">Uploads go into this folder. Leave it blank to use the article slug; filenames are numbered automatically unless you enter a custom name.</p>
                <label>Category
                  <select value={form.category_id} onChange={event => setForm({ ...form, category_id: event.target.value })} required>
                    <option value="">Choose…</option>
                    {categories.map(category => <option value={category.id} key={category.id}>{category.name}</option>)}
                  </select>
                </label>
                <label>Reading minutes
                  <input type="number" min="1" value={form.reading_minutes} onChange={event => setForm({ ...form, reading_minutes: event.target.value })} />
                </label>
                <div className="studio-featured-toggle">
                  <label>
                    <input type="checkbox" checked={form.is_featured} onChange={event => setForm({ ...form, is_featured: event.target.checked })} />
                    Feature on homepage
                  </label>
                  <p>Only one published story can be featured. Selecting this for another published story replaces the current feature.</p>
                </div>
                <label>Hero text
                  <input value={form.hero_text} onChange={event => setForm({ ...form, hero_text: event.target.value })} />
                </label>
                <label>Hero image URL
                  <input value={form.hero_image} onChange={event => setForm({ ...form, hero_image: event.target.value })} placeholder="Paste a public URL" />
                </label>
                <label>Hero image filename without extension (optional)
                  <input
                    maxLength={100}
                    value={uploadNames.hero || ''}
                    onChange={event => setUploadNames(current => ({ ...current, hero: event.target.value }))}
                    placeholder="Automatic: 1, 2, 3…"
                  />
                </label>
                <label className="studio-upload">Upload hero image
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={event => {
                    const file = event.target.files?.[0]
                    if (file) void upload(file, 'hero', uploadNames.hero || '')
                  }} disabled={uploading} />
                </label>
                {form.hero_image && <Image className="adminpreview" src={form.hero_image} alt="Hero preview" width={800} height={600} unoptimized />}
                <label>Status
                  <select value={form.status} onChange={event => setForm({ ...form, status: event.target.value as EditorForm['status'] })}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
                <p className="studio-help">Draft stories are not visible on the site.</p>
                <label>Editorial note
                  <textarea value={form.editorial_note} onChange={event => setForm({ ...form, editorial_note: event.target.value })} placeholder="A short note for readers, shown before the article begins." rows={4} />
                </label>
              </div>
            )}

            {panel === 'toc' && (
              <div className="studio-panel" role="tabpanel">
                <h2>Article outline</h2>
                {outline.length ? (
                  <ol className="studio-outline">
                    {outline.map((entry, index) => (
                      <li key={entry.key}>
                        <a href={`#${entry.id}`} onClick={event => {
                          event.preventDefault()
                          document.getElementById(entry.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        }}>
                          <span>{String(index + 1).padStart(2, '0')}</span>{entry.text}
                        </a>
                      </li>
                    ))}
                  </ol>
                ) : <p className="studio-empty">Add a heading block or format a text block with a heading level to build the article outline.</p>}
              </div>
            )}

            {panel === 'sources' && (
              <div className="studio-panel" role="tabpanel">
                <h2>Verified sources</h2>
                <p className="studio-help">Only sources with a title and URL are saved.</p>
                {form.sources.map((source, index) => (
                  <div className="studio-source" key={index}>
                    <div className="studio-source-head">
                      <strong>Source {index + 1}</strong>
                      <button type="button" onClick={() => removeSource(index)}>Remove</button>
                    </div>
                    <label>Title<input value={source.title} onChange={event => updateSource(index, { title: event.target.value })} placeholder="Source title" /></label>
                    <label>URL<input type="url" value={source.url} onChange={event => updateSource(index, { url: event.target.value })} placeholder="https://" /></label>
                    <label>Publisher<input value={source.publisher} onChange={event => updateSource(index, { publisher: event.target.value })} placeholder="Optional" /></label>
                    <label className="studio-verify"><input type="checkbox" checked={source.verified} onChange={event => updateSource(index, { verified: event.target.checked })} /> I checked this source directly</label>
                  </div>
                ))}
                <button type="button" className="secondary" onClick={addSource}>+ Add source</button>
              </div>
            )}

            {panel === 'seo' && (
              <div className="studio-panel" role="tabpanel">
                <h2>Search appearance</h2>
                <label>SEO title
                  <input maxLength={70} value={form.seo_title} onChange={event => setForm({ ...form, seo_title: event.target.value })} placeholder={form.title || 'Search result title'} />
                  <small>{form.seo_title.length}/70 characters</small>
                </label>
                <label>SEO description
                  <textarea maxLength={160} rows={4} value={form.seo_description} onChange={event => setForm({ ...form, seo_description: event.target.value })} placeholder={form.dek || 'Describe the article for search results.'} />
                  <small>{form.seo_description.length}/160 characters</small>
                </label>
                <div className="studio-search-preview">
                  <span>kya-scene-hai</span>
                  <strong>{form.seo_title || form.title || 'Article title'}</strong>
                  <p>{form.seo_description || form.dek || 'Article description will appear here.'}</p>
                </div>
              </div>
            )}
          </aside>
        )}
      </main>

      <section className="adminmain storytable" id="story-list">
        <div className="kicker">Newsroom</div>
        <h2>STORIES</h2>
        {filteredArticles.map(article => (
          <div className="storyrow" key={article.id}>
            <div><strong>{article.title}</strong><small>{article.categories?.name || 'Uncategorized'} · {article.status}</small></div>
            <div>
              <button type="button" className="secondary" onClick={() => edit(article)}>Edit</button>
              <button type="button" className="danger" onClick={() => void remove(article.id)}>Delete</button>
            </div>
          </div>
        ))}
        {filteredArticles.length === 0 && <p className="studio-empty">No {storyFilter === 'all' ? '' : `${storyFilter} `}stories found.</p>}
      </section>
      {previewOpen && (
        <ArticlePreview
          title={form.title}
          dek={form.dek}
          category={categories.find(category => String(category.id) === form.category_id)?.name ?? ''}
          readingMinutes={form.reading_minutes}
          heroText={form.hero_text}
          heroImage={form.hero_image}
          editorialNote={form.editorial_note}
          body={form.body}
          sources={form.sources}
          onClose={closePreview}
        />
      )}
    </div>
  )
}
