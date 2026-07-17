/* eslint-disable no-console -- CLI script: console output is the intended UX */
/**
 * Development seed — minimal boilerplate.
 *
 * Run: yarn seed (or `npx tsx prisma/seed.ts`)
 *
 * Creates a single demo user so you can sign in immediately after wiring up
 * the database:
 *
 *   · email:    demo@example.com
 *   · password: Demo1234!
 *
 * The password is hashed with bcrypt (SALT_ROUNDS = 10) at seed time — the
 * same algorithm the runtime `BcryptHashProvider` uses — so the demo
 * credentials work through the normal sign-in flow. The seed is idempotent:
 * it upserts on the unique `email`.
 */
import "dotenv/config";
import * as bcrypt from "bcrypt";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEMO_EMAIL = "demo@example.com";
const DEMO_PASSWORD = "Demo1234!";

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      name: "Demo User",
      email: DEMO_EMAIL,
      password: passwordHash,
      status: "ACTIVE",
      email_verified: true,
      language: "pt-BR",
    },
  });

  console.log(`Seeded demo user: ${user.email} (password: ${DEMO_PASSWORD})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
