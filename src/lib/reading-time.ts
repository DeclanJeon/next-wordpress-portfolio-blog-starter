const KOREAN_CJK_READING_CHARS_PER_MINUTE = 550
const LATIN_WORDS_PER_MINUTE = 220
const CODE_LINES_PER_MINUTE = 20

type ReadingTimeFormat = "compact" | "meta"

type NormalizedMarkdown = {
  readonly text: string
  readonly codeLineCount: number
}

function countMatches(text: string, pattern: RegExp): number {
  return text.match(pattern)?.length ?? 0
}

function normalizeMarkdownForReading(content: string): NormalizedMarkdown {
  let codeLineCount = 0
  const withoutCodeBlocks = content.replace(/```[\s\S]*?```/g, (block) => {
    const lines = block.split(/\r?\n/)
    codeLineCount += Math.max(0, lines.length - 2)
    return " "
  })

  const text = withoutCodeBlocks
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[`*_~>#|\-[\]()!]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  return { text, codeLineCount }
}

export function estimateReadingTime(content: string): number {
  const { text, codeLineCount } = normalizeMarkdownForReading(content)
  const koreanCjkCharacterCount = countMatches(
    text,
    /[\u1100-\u11ff\u3130-\u318f\ua960-\ua97f\uac00-\ud7af\ud7b0-\ud7ff\u3040-\u30ff\u4e00-\u9fff]/g,
  )
  const latinWordCount = countMatches(text, /\b[A-Za-z][A-Za-z0-9'’.-]*\b/g)
  const estimatedMinutes =
    koreanCjkCharacterCount / KOREAN_CJK_READING_CHARS_PER_MINUTE +
    latinWordCount / LATIN_WORDS_PER_MINUTE +
    codeLineCount / CODE_LINES_PER_MINUTE

  return Math.max(1, Math.ceil(estimatedMinutes))
}

export function formatReadingTime(minutes: number, format: ReadingTimeFormat = "compact"): string {
  const safeMinutes = Math.max(1, Math.ceil(minutes))
  if (format === "meta") return `읽는 시간 ${safeMinutes}분`
  return `${safeMinutes}분 읽기`
}
