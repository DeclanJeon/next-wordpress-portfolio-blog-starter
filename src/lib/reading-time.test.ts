import { describe, expect, it } from "bun:test"
import { estimateReadingTime, formatReadingTime } from "./reading-time"

describe("estimateReadingTime", () => {
  it("returns a ceiling-based estimate when Korean text crosses one minute", () => {
    // Given: a Korean article body just over one 550-character reading minute.
    const content = "가".repeat(551)

    // When: estimating reading time.
    const minutes = estimateReadingTime(content)

    // Then: the result is rounded up, not down.
    expect(minutes).toBe(2)
  })

  it("combines Korean characters, Latin words, and code blocks", () => {
    // Given: a mixed technical article with Korean prose, English terms, and a code sample.
    const korean = "나".repeat(550)
    const english = Array.from({ length: 220 }, (_, index) => `word${index}`).join(" ")
    const code = `\n\n\`\`\`ts\n${Array.from({ length: 20 }, () => "const ok = true").join("\n")}\n\`\`\``

    // When: estimating reading time.
    const minutes = estimateReadingTime(`${korean}\n\n${english}${code}`)

    // Then: each content class contributes to the total.
    expect(minutes).toBe(3)
  })

  it("ignores markdown image URLs while preserving link text", () => {
    // Given: visible text wrapped in markdown plus a long image URL that should not be read.
    const content = `![architecture](https://example.com/${"path/".repeat(200)}image.png)\n\n[직접 요청 흐름](https://example.com/docs) ${"다".repeat(530)}`

    // When: estimating reading time.
    const minutes = estimateReadingTime(content)

    // Then: hidden URLs do not inflate the estimate.
    expect(minutes).toBe(1)
  })
})

describe("formatReadingTime", () => {
  it("formats list labels in Korean", () => {
    // Given: a persisted reading time value.
    const minutes = 3

    // When: formatting for compact list UI.
    const label = formatReadingTime(minutes, "compact")

    // Then: the label uses the Korean blog convention.
    expect(label).toBe("3분 읽기")
  })

  it("formats article metadata in Korean", () => {
    // Given: a persisted reading time value.
    const minutes = 3

    // When: formatting for article metadata.
    const label = formatReadingTime(minutes, "meta")

    // Then: the label is explicit for the article header.
    expect(label).toBe("읽는 시간 3분")
  })
})
