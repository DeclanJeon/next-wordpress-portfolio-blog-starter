import { db } from "../src/lib/db"

const LOCKED_PASSWORD_HASH = "disabled"

async function main() {
  await db.post.deleteMany()
  await db.user.deleteMany()

  const contentAuthor = await db.user.create({
    data: {
      username: "ponslink",
      displayName: "PonsLink",
      passwordHash: LOCKED_PASSWORD_HASH,
      role: "writer",
      bio: "PonsLink editorial account. Local password login is intentionally disabled.",
    },
  })

  const posts = [
    {
      slug: "bridges-between-disciplines",
      title: "Bridges between disciplines",
      excerpt:
        "The most interesting work happens at the seams. A note on why I keep crossing them.",
      category: "Essays",
      tags: "craft,interdisciplinary,thinking",
      coverColor: "#b45309",
      status: "published",
      readingTime: 6,
      authorId: contentAuthor.id,
      authorName: contentAuthor.displayName,
      publishedAt: new Date("2025-10-12T09:00:00Z"),
      content: `# Bridges between disciplines

The most interesting work I've done happened at the seams between fields — where a designer learns enough engineering to ask a better question, where a programmer reads enough poetry to name a function well.

## Why the seams matter

Disciplines are efficient. They let us go deep without re-deriving first principles every morning. But efficiency is not the same as insight. Insight tends to live where one field's assumption is another field's open question.

When I cross a seam, I usually feel stupid for a while. That's the signal. It means I've left the place where my training protects me.

## A small practice

I keep a rule: once a month, read something outside my field, slowly, until I can explain one idea from it to a friend. Not to become an expert. Just to stay in the habit of crossing.

The bridges are not the disciplines. The bridges are the people willing to walk between them.`,
    },
    {
      slug: "writing-as-thinking",
      title: "Writing is thinking, not recording",
      excerpt:
        "I don't write to remember what I thought. I write to find out what I think.",
      category: "Essays",
      tags: "writing,process",
      coverColor: "#3f6212",
      status: "published",
      readingTime: 4,
      authorId: contentAuthor.id,
      authorName: contentAuthor.displayName,
      publishedAt: new Date("2025-09-28T09:00:00Z"),
      content: `# Writing is thinking, not recording

For years I believed writing was the last step — the tidy record of a thought already finished in my head. I was wrong. The thought isn't finished until I've wrestled it into a sentence.

## The draft that teaches you

Every first draft surprises me. I sit down sure of what I want to say, and by the third paragraph I've discovered I was sure of something else entirely. The sentence I struggled over was never the sentence I planned. It was the sentence I needed.

## Implications

If writing is thinking, then the people who say "I'll write it up once I've figured it out" have the order backwards. You figure it out *by* writing it up. The messy draft isn't a failure of process. It is the process.

Keep the draft. Trust the struggle. The clarity comes after, not before.`,
    },
    {
      slug: "small-tools-long-projects",
      title: "Small tools, long projects",
      excerpt:
        "The tools that lasted me a decade are the boring ones. A defence of the unsexy spreadsheet.",
      category: "Notes",
      tags: "tools,process",
      coverColor: "#0f766e",
      status: "published",
      readingTime: 5,
      authorId: contentAuthor.id,
      authorName: contentAuthor.displayName,
      publishedAt: new Date("2025-09-14T09:00:00Z"),
      content: `# Small tools, long projects

The tools that have lasted me a decade are the boring ones. A plain text editor. A spreadsheet. A notebook. The flashy app I bought in 2019 is gone; the spreadsheet is still here, and it still does exactly what I ask.

## What boring tools give you

Boring tools are legible. In five years you'll still be able to open the file. The data is yours. The workflow is yours. Nobody is going to ship a redesign that moves your buttons.

## When to reach for more

Sometimes a project genuinely needs more — a database, a script, a real editor. The test I use: will this tool still exist, and will my work still open, in ten years? If yes, use it. If no, ask whether the extra power is worth the fragility.

Most of the time, for most projects, it isn't.`,
    },
    {
      slug: "a-week-of-slow-internet",
      title: "A week of slow internet",
      excerpt:
        "I throttled my connection for a week to see what my habits actually were. Here's what I learned.",
      category: "Field Notes",
      tags: "attention,experiment",
      coverColor: "#7c2d12",
      status: "published",
      readingTime: 7,
      authorId: contentAuthor.id,
      authorName: contentAuthor.displayName,
      publishedAt: new Date("2025-08-30T09:00:00Z"),
      content: `# A week of slow internet

I throttled my connection to 1 Mbps for a week. I wanted to see what my habits looked like when every page cost a few seconds of patience.

## Day one: withdrawal

The first day was embarrassing. I reached for my phone the way you reach for a light switch — automatically, dozens of times. Half the time the page didn't load before I'd already lost interest and closed it. That was the lesson, in miniature: most of my reaching wasn't for anything I actually wanted.

## Day three: selection

By the third day I'd stopped opening things reflexively. When a page took ten seconds, I asked myself whether I'd meant to open it at all. Often the answer was no.

## Day seven: what stayed

What survived the week was the small set of things I genuinely read — a long article, a friend's post, a chapter of a book. The rest had been filler, served fast enough that I'd never noticed it was empty.

I'm back on fast internet now. But I still ask, before I open a tab: is this reaching, or wanting?`,
    },
    {
      slug: "on-naming-things",
      title: "On naming things",
      excerpt:
        "A name is a promise. Most names are promises the thing can't keep. A short field guide.",
      category: "Essays",
      tags: "craft,language",
      coverColor: "#a16207",
      status: "published",
      readingTime: 4,
      authorId: contentAuthor.id,
      authorName: contentAuthor.displayName,
      publishedAt: new Date("2025-08-11T09:00:00Z"),
      content: `# On naming things

A name is a promise. Most names are promises the thing can't keep — "smart", "ultimate", "pro". The best names are modest. They describe what the thing does, and then they get out of the way.

## Three rules

1. **Name the verb, not the virtue.** A thing called "Sync" tells you what it does. A thing called "Harmony" tells you how to feel about it. One of those ages well.
2. **Shorter is almost always better**, but never at the cost of clarity. "Docs" beats "Documentation". "Docs" does not beat "Dox".
3. **Say it out loud.** If you can't say it in a sentence without wincing, the name is wrong, not the sentence.

## The test

The test is simple: would a stranger, hearing the name once, guess roughly what the thing is? If yes, good. If they'd guess something else entirely, the name is lying. Fix the name, not the stranger.`,
    },
    {
      slug: "the-quiet-protocol",
      title: "The quiet protocol",
      excerpt:
        "What if a chat app had a 'quiet' mode by default, and 'loud' was the opt-in? A design thought experiment.",
      category: "Field Notes",
      tags: "design,attention",
      coverColor: "#1c1917",
      status: "draft",
      readingTime: 5,
      authorId: contentAuthor.id,
      authorName: contentAuthor.displayName,
      publishedAt: new Date("2025-10-20T09:00:00Z"),
      content: `# The quiet protocol

A thought experiment: what if a chat app were quiet by default, and loud was the opt-in?

## The default

Notifications off. Read receipts off. The badge doesn't count. To make a message push, you hold a "this matters" button for two seconds — long enough to mean it.

## What changes

Most messages would wait until you opened the app. That's the point. The messages that truly mattered would arrive with the weight they deserve, and the rest would sit patiently in a list, the way email used to.

This is a draft. I'm still thinking.`,
    },
  ]

  for (const p of posts) {
    await db.post.create({ data: p })
  }

  console.log("Seed complete:", 1, "locked content account,", posts.length, "posts")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
