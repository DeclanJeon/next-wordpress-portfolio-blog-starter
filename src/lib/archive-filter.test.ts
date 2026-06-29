import { describe, expect, test } from "bun:test"
import { archiveFilterCanonicalHref, normalizeArchiveFilter } from "@/lib/archive-filter"

describe("normalizeArchiveFilter", () => {
  test("maps a legacy PonsLink tag request to the PonsLink retrospective taxonomy", () => {
    // Given
    const filter = { category: "", taxonomy: "", tag: "PonsLink", q: "" }

    // When
    const normalized = normalizeArchiveFilter(filter)

    // Then
    expect(normalized).toEqual({ category: "", taxonomy: "dev-retrospective/ponslink", tag: "", q: "" })
  })

  test("maps a legacy PonsWarp tag request to the PonsWarp retrospective taxonomy", () => {
    // Given
    const filter = { category: "", taxonomy: "", tag: "PonsWarp", q: "" }

    // When
    const normalized = normalizeArchiveFilter(filter)

    // Then
    expect(normalized).toEqual({ category: "", taxonomy: "dev-retrospective/ponswarp", tag: "", q: "" })
  })

  test("keeps tag filtering when an explicit taxonomy is already selected", () => {
    // Given
    const filter = { category: "", taxonomy: "dev-retrospective/ponswarp", tag: "PonsLink", q: "" }

    // When
    const normalized = normalizeArchiveFilter(filter)

    // Then
    expect(normalized).toEqual(filter)
  })
})

describe("archiveFilterCanonicalHref", () => {
  test("redirects a legacy project tag to the taxonomy URL without preserving the broad tag", () => {
    // Given
    const filter = { category: "", taxonomy: "", tag: "PonsLink", q: "backpressure" }

    // When
    const href = archiveFilterCanonicalHref(filter, "grid")

    // Then
    expect(href).toBe("/writing?taxonomy=dev-retrospective%2Fponslink&q=backpressure&view=grid")
  })

  test("does not redirect when taxonomy is already explicit", () => {
    // Given
    const filter = { category: "", taxonomy: "dev-retrospective/ponswarp", tag: "PonsLink", q: "" }

    // When
    const href = archiveFilterCanonicalHref(filter, "board")

    // Then
    expect(href).toBeNull()
  })
})
