import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

config({ path: ".env" });
config({ path: ".env.local", override: true });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

const roles = [
  {
    name: "super_admin",
    description: "Full system administrator access",
  },
  {
    name: "admin_program",
    description: "Program administrator access",
  },
  {
    name: "mentor",
    description: "Mentor access for managing workshop participants",
  },
  {
    name: "participant",
    description: "Workshop participant access",
  },
];

async function main() {
  for (const role of roles) {
    await prisma.role.upsert({
      where: {
        name: role.name,
      },
      update: {
        description: role.description,
      },
      create: role,
    });
  }

  console.log(
    "Seeded default roles:",
    roles.map((role) => role.name).join(", "),
  );
}

main()
  .catch((error) => {
    console.error("Failed to seed database:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
