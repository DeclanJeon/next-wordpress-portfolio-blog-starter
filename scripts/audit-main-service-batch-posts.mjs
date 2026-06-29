import { PrismaClient } from '@prisma/client'
import fs from 'node:fs'
import path from 'node:path'

const prisma = new PrismaClient()
const slugs = [
  '2026-06-29-main-ponslink-01-room-not-call',
  '2026-06-29-main-ponslink-02-mesh-limits',
  '2026-06-29-main-ponslink-03-state-resync',
  '2026-06-29-main-ponswarp-01-server-does-not-own-file',
  '2026-06-29-main-ponswarp-02-signaling-is-matchmaker',
  '2026-06-29-main-ponswarp-03-backpressure-before-speed',
  '2026-06-29-main-docuflow-01-tools-to-flow',
  '2026-06-29-main-docuflow-02-korean-document-context',
  '2026-06-29-main-docuflow-03-local-security-boundary',
  '2026-06-29-main-ruminate-01-ai-should-not-answer-too-fast',
  '2026-06-29-main-ruminate-02-classic-text-as-question',
  '2026-06-29-main-fatemirror-01-mirror-not-fortune',
]

function estimateReadingTime(content) {
  let codeLineCount = 0
  const withoutCodeBlocks = content.replace(/```[\s\S]*?```/g, (block) => {
    const lines = block.split(/\r?\n/)
    codeLineCount += Math.max(0, lines.length - 2)
    return ' '
  })
  const text = withoutCodeBlocks
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[`*_~>#|\-[\]()!]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const korean = (text.match(/[\u1100-\u11ff\u3130-\u318f\ua960-\ua97f\uac00-\ud7af\ud7b0-\ud7ff\u3040-\u30ff\u4e00-\u9fff]/g) || []).length
  const latin = (text.match(/\b[A-Za-z][A-Za-z0-9'’.-]*\b/g) || []).length
  return Math.max(1, Math.ceil(korean / 550 + latin / 220 + codeLineCount / 20))
}

function relToPublicFile(src) {
  return path.join(process.cwd(), 'public', src.replace(/^\//, ''))
}

function splitTags(tags) {
  return tags.split(',').map((tag) => tag.trim()).filter(Boolean)
}

function projectOf(post) {
  const tags = splitTags(post.tags)
  if (post.category === 'PonsLink' || tags.includes('PonsLink')) return 'ponslink'
  if (post.category === 'PonsWarp' || tags.includes('PonsWarp')) return 'ponswarp'
  if (['Document Automation', '문서 자동화'].includes(post.category) || tags.some((t) => ['DocuFlow', 'PDF마스터', 'PDF Master', '문서 자동화'].includes(t))) return 'document-automation-suite'
  if (['Ruminate', 'FateMirror', '명경'].includes(post.category) || tags.some((t) => ['Ruminate', '명경', 'FateMirror', '사주', '고전'].includes(t))) return 'ruminate-fatemirror'
  return 'unknown'
}

const honorific = /(합니다|했습니다|됩니다|되었습니다|있습니다|없습니다|입니다|드립니다|주세요|하십시오|됩니다\.)/
const commitLike = /\b[0-9a-f]{7,40}\b/i
const functionLike = /\b[A-Za-z_$][A-Za-z0-9_$]*\s*\(/g

async function main() {
  const posts = await prisma.post.findMany({ where: { slug: { in: slugs } }, orderBy: { publishedAt: 'asc' } })
  const errors = []
  if (posts.length !== slugs.length) errors.push(`expected ${slugs.length} posts, found ${posts.length}`)
  const titleSet = new Set()
  const introSet = new Set()
  const featuredSet = new Set()
  const byProject = {}
  for (const post of posts) {
    if (post.status !== 'published') errors.push(`${post.slug}: not published`)
    if (titleSet.has(post.title)) errors.push(`${post.slug}: duplicate title`)
    titleSet.add(post.title)
    const intro = post.content.split(/\n\n/)[0]?.trim()
    if (!intro) errors.push(`${post.slug}: missing intro`)
    if (introSet.has(intro)) errors.push(`${post.slug}: duplicate intro`)
    introSet.add(intro)
    if (honorific.test(post.content)) errors.push(`${post.slug}: honorific style detected`)
    if (commitLike.test(post.content)) errors.push(`${post.slug}: commit-like hash detected`)
    const fnMatches = post.content.match(functionLike) || []
    if (fnMatches.length) errors.push(`${post.slug}: function-like text detected ${fnMatches.join(', ')}`)
    const expectedReadingTime = estimateReadingTime(post.content)
    if (post.readingTime !== expectedReadingTime) errors.push(`${post.slug}: readingTime ${post.readingTime} != computed ${expectedReadingTime}`)
    if (!post.featuredImage) errors.push(`${post.slug}: missing featuredImage`)
    if (featuredSet.has(post.featuredImage)) errors.push(`${post.slug}: duplicate featuredImage`)
    featuredSet.add(post.featuredImage)
    if (post.content.includes(post.featuredImage)) errors.push(`${post.slug}: featuredImage duplicated in content`)
    if (post.featuredImage && !fs.existsSync(relToPublicFile(post.featuredImage))) errors.push(`${post.slug}: featuredImage file missing ${post.featuredImage}`)
    const bodyImages = [...post.content.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map((m) => m[1])
    for (const img of bodyImages) {
      if (!fs.existsSync(relToPublicFile(img))) errors.push(`${post.slug}: body image missing ${img}`)
    }
    const project = projectOf(post)
    byProject[project] = (byProject[project] || 0) + 1
  }
  const totalByProject = {}
  for (const project of ['ponslink', 'ponswarp', 'document-automation-suite', 'ruminate-fatemirror']) totalByProject[project] = 0
  const all = await prisma.post.findMany({ where: { status: 'published' }, select: { category: true, tags: true, title: true, excerpt: true } })
  for (const post of all) {
    const p = projectOf({ ...post, content: '' })
    if (p in totalByProject) totalByProject[p] += 1
  }
  const result = { ok: errors.length === 0, errors, insertedCount: posts.length, byProject, totalByProject, readingTimes: posts.map((p) => ({ slug: p.slug, readingTime: p.readingTime })) }
  console.log(JSON.stringify(result, null, 2))
  if (errors.length) process.exit(1)
}

main().finally(async () => prisma.$disconnect())
