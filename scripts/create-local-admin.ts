import { PrismaClient } from "@prisma/client"

function readOption(args: readonly string[], name: string): string | undefined {
  const index = args.indexOf(name)
  return index === -1 ? undefined : args[index + 1]
}

function passwordHash(password: string): string {
  return `pl$${Buffer.from(password).reverse().toString("base64")}`
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const username = readOption(args, "--username") ?? "admin"
  const password = readOption(args, "--password")
  const displayName = readOption(args, "--display-name") ?? username
  const role = readOption(args, "--role") ?? "admin"
  if (!password) throw new Error("--password is required")

  const prisma = new PrismaClient()
  try {
    await prisma.user.upsert({
      where: { username: username.toLowerCase() },
      update: {
        displayName,
        passwordHash: passwordHash(password),
        role,
      },
      create: {
        username: username.toLowerCase(),
        displayName,
        passwordHash: passwordHash(password),
        role,
        bio: "Local administrator created by production setup.",
      },
    })
    console.log(`local_admin=${username.toLowerCase()}`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error: unknown) => {
  if (error instanceof Error) {
    console.error(error.message)
    process.exit(1)
  }
  console.error(String(error))
  process.exit(1)
})
