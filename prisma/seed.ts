import { db } from "../src/lib/db"

async function main() {
  // Clean existing data
  await db.post.deleteMany()
  await db.project.deleteMany()

  // Seed Projects (portfolio case studies)
  const projects = [
    {
      title: "Tidefield",
      slug: "tidefield",
      summary: "A meditative daily journaling app built around the rhythm of the ocean.",
      description:
        "Tidefield reimagines the journaling app as a quiet ritual. Instead of blank pages and streak counters, it surfaces gentle prompts tied to the local tide cycle, turning reflection into something that feels less like a task and more like watching the water. I led product design end-to-end — from the typographic system and motion language to the onboarding flow that teaches the metaphor without ever naming it.",
      year: "2025",
      role: "Product Design Lead",
      client: "Tidefield Labs",
      category: "Digital Product",
      url: "",
      accent: "#b45309",
      featured: true,
      order: 1,
    },
    {
      title: "Halcyon Press",
      slug: "halcyon-press",
      summary: "Editorial identity for an independent publishing house focused on slow journalism.",
      description:
        "Halcyon Press needed a visual language that felt as unhurried as the stories it tells. The wordmark draws on mid-century newspaper mastheads, set tight and confident. A flexible grid system carries long-form essays, photo essays, and a quarterly print issue — the same columns, re-arranged. The palette is paper, ink, and a single muted ochre that anchors the masthead.",
      year: "2024",
      role: "Brand & Editorial Design",
      client: "Halcyon Press",
      category: "Brand Identity",
      url: "",
      accent: "#3f6212",
      featured: true,
      order: 2,
    },
    {
      title: "Field Notes Atlas",
      slug: "field-notes-atlas",
      summary: "An interactive cartography tool for naturalists recording seasonal change.",
      description:
        "Field Notes Atlas gives amateur naturalists a way to log phenology observations and watch a personal map of the seasons accumulate over years. I designed the data-entry flow to feel like writing in a notebook — typed entries, a soft paper texture, a hand-drawn pin for every sighting. The map underneath is deliberately understated, so the observations stay the protagonist.",
      year: "2024",
      role: "Lead Designer",
      client: "Mycelia Collective",
      category: "Digital Product",
      url: "",
      accent: "#0f766e",
      featured: true,
      order: 3,
    },
    {
      title: "Slow Cinema Club",
      slug: "slow-cinema-club",
      summary: "Identity and poster system for a community cinema focused on long-form film.",
      description:
        "Slow Cinema Club programs films that ask you to sit with them. The identity is built on a single rule: every poster holds one still, one line, and a lot of air. The typeface is a custom revival of a 1970s cinema marquee, drawn loose enough to feel hand-cut. Posters are screen-printed in two passes — ink, then a translucent fog.",
      year: "2023",
      role: "Creative Direction",
      client: "Slow Cinema Club",
      category: "Brand Identity",
      url: "",
      accent: "#7c2d12",
      featured: true,
      order: 4,
    },
    {
      title: "Greenhouse OS",
      slug: "greenhouse-os",
      summary: "Operating dashboard for a network of urban community greenhouses.",
      description:
        "Greenhouse OS lets volunteer teams monitor climate, water, and harvest logs across a dozen rooftop sites from one calm screen. I designed the dashboard around a single principle: a first-time volunteer should understand the whole system in under a minute. Sensors, alerts, and tasks share one visual grammar, and the colour for 'needs attention' is the only saturated thing on the page.",
      year: "2023",
      role: "Product Designer",
      client: "Common Soil",
      category: "Digital Product",
      url: "",
      accent: "#a16207",
      featured: false,
      order: 5,
    },
  ]

  for (const p of projects) {
    await db.project.create({ data: p })
  }

  // Seed Posts (blog / writing)
  const posts = [
    {
      slug: "designing-for-quiet",
      title: "Designing for quiet",
      excerpt:
        "Most interfaces shout. What would it take to make software that whispers — and still gets the job done?",
      category: "Essay",
      tags: "design,attention,craft",
      coverColor: "#1c1917",
      readingTime: 6,
      publishedAt: new Date("2025-09-12T09:00:00Z"),
      content: `# Designing for quiet

Most interfaces shout. Buttons beg for clicks, badges count upward, red dots bloom in the corner of your eye. The dominant assumption is that attention is something to be captured — and once captured, held.

I have been trying to design the opposite. Not minimalist for its own sake, but **quiet**: software that waits for you, that speaks once, that trusts you to come back.

## What quiet is not

Quiet is not emptiness. A blank screen is loud in its own way — it demands that you decide what to do next, with nothing to hold onto. Quiet interfaces have plenty of content; they just don't compete for it.

Quiet is also not slow. A well-designed quiet app responds instantly. The calm is in the hierarchy, not the latency.

## Three small rules

After a few years of trying, I keep coming back to three rules:

1. **One thing asks for attention at a time.** If two elements both want the eye, one of them has to lose. Decide which, and make it lose gracefully.
2. **Colour is a promise, not a decoration.** A saturated colour means "this matters." Use it once per screen, and mean it.
3. **Motion explains, it doesn't perform.** Animations should clarify where something came from or where it went. If an animation exists only to be admired, cut it.

## The hard part

The hard part isn't the rules. It's the discipline of applying them when a stakeholder asks for "just one more badge" or "a little more pop." Quiet design is a series of small refusals, strung together until the thing finally breathes.

When it works, nobody notices. That is, more or less, the point.`,
    },
    {
      slug: "the-grid-is-a-feeling",
      title: "The grid is a feeling",
      excerpt:
        "A grid system is less a set of measurements than it is a mood. A note on why I start every layout with rhythm, not columns.",
      category: "Essay",
      tags: "typography,layout,craft",
      coverColor: "#3f6212",
      readingTime: 5,
      publishedAt: new Date("2025-07-30T09:00:00Z"),
      content: `# The grid is a feeling

When designers talk about grids, they usually talk about columns. Twelve of them, eight of them, sometimes a cheeky five. But the grid that matters — the one a reader actually feels — is made of rhythm, not columns.

## Rhythm before columns

Before I open a layout tool, I pick a baseline. Usually 8px. Everything vertical is a multiple of that baseline: line-height, padding, margins, the gap between a headline and its deck. The eye doesn't count columns. The eye reads down the page, and down the page, rhythm is everything.

Columns are the easy part. You can snap anything to a column. Rhythm is harder because it has to hold across every component, every state, every breakpoint.

## The feeling

A page with good rhythm feels *settled*. You can't point to why. A page with bad rhythm feels restless, slightly off, like a song drifting from the beat. Readers won't name it. They'll just stay longer on the settled one.

That is the feeling I'm chasing. Not the grid you can draw, but the grid you can feel.`,
    },
    {
      slug: "notes-on-restraint",
      title: "Notes on restraint",
      excerpt:
        "Restraint is the most misunderstood design value. It's not about doing less — it's about doing only what the work needs.",
      category: "Notes",
      tags: "design,process",
      coverColor: "#b45309",
      readingTime: 4,
      publishedAt: new Date("2025-05-18T09:00:00Z"),
      content: `# Notes on restraint

Restraint gets a bad reputation. It sounds like deprivation — like a diet for designers. But restraint, as I mean it, isn't about doing less. It's about doing only what the work needs, and nothing it doesn't.

## The wrong kind of restraint

A common failure mode: a designer "restrains" themselves by removing everything interesting, then calls the result elegant. But a blank page isn't restrained. It's just blank. Restraint without intention is just timidity.

## The right kind

Real restraint sounds like this: "This screen needs a headline, a single action, and a way out. Anything else is noise." Then you build exactly that — and the headline can be enormous, the action can be a saturated colour, the way out can be a hand-drawn arrow. Restraint didn't make it smaller. It made it *legible*.

Restraint is editing, not erasure.`,
    },
    {
      slug: "on-working-by-hand",
      title: "On working by hand",
      excerpt:
        "Why I still sketch every interface in a notebook before I touch a pixel. A defence of the slow first draft.",
      category: "Process",
      tags: "process,sketching,craft",
      coverColor: "#0f766e",
      readingTime: 5,
      publishedAt: new Date("2025-03-04T09:00:00Z"),
      content: `# On working by hand

Every interface I design starts in a dot-grid notebook, with a cheap fountain pen, on a page I will throw away.

## Why paper first

Paper is slow, and that is the point. When I draw in Figma, the software rewards me for finishing — components snap, colours fill, the screen looks "real" before the idea is ready. Paper refuses to flatter me. A bad idea looks bad on paper, and it looks bad quickly, which means I throw it away before I've invested in it.

## The first draft is for throwing away

I tell myself the first page is allowed to be wrong. I sketch the obvious version first — the one everyone would draw — just to get it out of my system. The second page is where the actual idea starts, now that the obvious one isn't hovering over my shoulder.

By the time I open Figma, I know what the screen is for. The software becomes a tool for finishing the thought, not for having it.`,
    },
    {
      slug: "the-case-for-boring-tools",
      title: "The case for boring tools",
      excerpt:
        "The most creative years of my career began when I stopped chasing new software and learned three tools deeply.",
      category: "Essay",
      tags: "tools,process,craft",
      coverColor: "#7c2d12",
      readingTime: 6,
      publishedAt: new Date("2024-11-21T09:00:00Z"),
      content: `# The case for boring tools

For a few years I chased tools. New design apps, new prototypers, new note systems — each one promised to unlock some latent creativity. None of them did. The work stayed roughly the same; only the file extensions changed.

## Fluency beats novelty

The breakthrough came when I stopped. I picked three tools — a notebook, a vector editor, and a code editor — and decided to learn them *deeply*. Not to master them, exactly. Just to stop having to think about them.

The strange thing about deep fluency is that the tool disappears. When you don't have to remember where the button is, you can think about the thing you're actually making. Boring tools, learned well, become invisible — and invisible tools are the only kind that lets the work come through.

## What I kept

I still try new things. But I no longer expect them to change the work. New tools are for new *capabilities*, not for new motivation. If a tool won't let me do something I literally couldn't do before, I leave it alone.`,
    },
    {
      slug: "reading-list-2025",
      title: "Reading list, 2025",
      excerpt:
        "Six books that shaped how I think about design, attention, and making things this year — with the one idea I took from each.",
      category: "Reading",
      tags: "books,reading,2025",
      coverColor: "#a16207",
      readingTime: 7,
      publishedAt: new Date("2025-10-02T09:00:00Z"),
      content: `# Reading list, 2025

A running list of the books that stuck this year. I won't review them — I'll just give you the one idea I carried out of each.

## The Timeless Way of Building — Christopher Alexander
That places have a "quality without a name," and that you know it when you're in it. Design is the search for that quality, not for novelty.

## How to Do Nothing — Jenny Odell
That attention is the most basic form of love, and that a culture which monetises attention is, structurally, anti-love. I think about this every time I add a notification.

## The Shape of Design — Frank Chimero
That craft is a relationship between the maker and the made, and that the relationship matters more than the artefact.

## The Prisoner of Gender — ... no, scratch that. Let me give you the real ones.

A short, honest list is better than a long, performative one. The three above are the ones that actually changed how I work this year. The rest were good, but these are the ones I keep returning to.

If you read one, read *How to Do Nothing*. Then go outside.`,
    },
  ]

  for (const p of posts) {
    await db.post.create({ data: p })
  }

  console.log("Seed complete:", projects.length, "projects,", posts.length, "posts")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
