import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashInvitationCode } from "../src/lib/invitation/code";

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

async function seedRoles() {
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

  console.log("Seeded roles:", roles.map((role) => role.name).join(", "));
}

async function upsertUserWithRole({
  email,
  fullName,
  roleName,
}: {
  email: string;
  fullName: string;
  roleName: string;
}) {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.upsert({
    where: {
      email: normalizedEmail,
    },
    update: {
      status: "ACTIVE",
      profile: {
        upsert: {
          create: {
            fullName,
            profileCompletedAt: new Date(),
          },
          update: {
            fullName,
            profileCompletedAt: new Date(),
          },
        },
      },
    },
    create: {
      email: normalizedEmail,
      status: "ACTIVE",
      profile: {
        create: {
          fullName,
          profileCompletedAt: new Date(),
        },
      },
    },
    select: {
      id: true,
      email: true,
    },
  });

  const role = await prisma.role.findUniqueOrThrow({
    where: {
      name: roleName,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: role.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      roleId: role.id,
    },
  });

  console.log(`Assigned ${roleName} role to ${user.email}`);

  return user;
}

async function seedConfiguredAdminUsers() {
  const superAdminEmail = process.env.SEED_SUPER_ADMIN_EMAIL;
  const superAdminName =
    process.env.SEED_SUPER_ADMIN_NAME ?? "Seed Super Admin";

  const adminProgramEmail = process.env.SEED_ADMIN_PROGRAM_EMAIL;
  const adminProgramName =
    process.env.SEED_ADMIN_PROGRAM_NAME ?? "Seed Admin Program";

  const seededUsers: {
    superAdminUserId?: string;
    adminProgramUserId?: string;
  } = {};

  if (superAdminEmail) {
    const superAdmin = await upsertUserWithRole({
      email: superAdminEmail,
      fullName: superAdminName,
      roleName: "super_admin",
    });

    seededUsers.superAdminUserId = superAdmin.id;
  } else {
    console.log(
      "Skipped super_admin assignment: SEED_SUPER_ADMIN_EMAIL is empty",
    );
  }

  if (adminProgramEmail) {
    const adminProgram = await upsertUserWithRole({
      email: adminProgramEmail,
      fullName: adminProgramName,
      roleName: "admin_program",
    });

    seededUsers.adminProgramUserId = adminProgram.id;
  } else {
    console.log(
      "Skipped admin_program assignment: SEED_ADMIN_PROGRAM_EMAIL is empty",
    );
  }

  return seededUsers;
}

async function seedWorkshopCohortAndSessions() {
  const workshop = await prisma.workshop.upsert({
    where: {
      slug: "basic-web-development",
    },
    update: {
      title: "Basic Web Development",
      description: "Workshop dasar pengembangan web.",
      status: "PUBLISHED",
    },
    create: {
      title: "Basic Web Development",
      slug: "basic-web-development",
      description: "Workshop dasar pengembangan web.",
      status: "PUBLISHED",
    },
  });

  const cohort = await prisma.cohort.upsert({
    where: {
      slug: "basic-web-development-2026-01",
    },
    update: {
      workshopId: workshop.id,
      name: "Cohort 2026 Batch 1",
      status: "ACTIVE",
    },
    create: {
      workshopId: workshop.id,
      name: "Cohort 2026 Batch 1",
      slug: "basic-web-development-2026-01",
      status: "ACTIVE",
    },
  });

  const sessions = [
    {
      meetingNo: 1,
      title: "Introduction to Web Development",
    },
    {
      meetingNo: 2,
      title: "HTML and CSS Fundamentals",
    },
    {
      meetingNo: 3,
      title: "JavaScript Basics",
    },
    {
      meetingNo: 4,
      title: "Final Project Briefing",
    },
  ];

  for (const session of sessions) {
    await prisma.session.upsert({
      where: {
        cohortId_meetingNo: {
          cohortId: cohort.id,
          meetingNo: session.meetingNo,
        },
      },
      update: {
        title: session.title,
      },
      create: {
        cohortId: cohort.id,
        meetingNo: session.meetingNo,
        title: session.title,
        attendanceStatus: "NOT_OPENED",
      },
    });
  }

  console.log("Seeded workshop:", workshop.title);
  console.log("Seeded cohort:", cohort.name);
  console.log(
    "Seeded sessions:",
    sessions.map((session) => `#${session.meetingNo}`).join(", "),
  );

  return {
    workshop,
    cohort,
  };
}

async function upsertInvitationCode({
  plainCode,
  scope,
  targetId,
  createdById,
  maxUses,
}: {
  plainCode: string;
  scope: "WORKSHOP" | "COHORT";
  targetId: string;
  createdById?: string;
  maxUses: number;
}) {
  const codeHash = hashInvitationCode(plainCode);

  await prisma.invitationCode.upsert({
    where: {
      codeHash,
    },
    update: {
      scope,
      targetId,
      status: "ACTIVE",
      maxUses,
      expiresAt: null,
      createdById: createdById ?? null,
    },
    create: {
      codeHash,
      scope,
      targetId,
      status: "ACTIVE",
      maxUses,
      usedCount: 0,
      expiresAt: null,
      createdById: createdById ?? null,
    },
  });

  console.log(`Seeded ${scope} invitation code: ${plainCode}`);
  console.log(`Target ID: ${targetId}`);
}

async function seedInvitationCodes({
  workshopId,
  cohortId,
  createdById,
}: {
  workshopId: string;
  cohortId: string;
  createdById?: string;
}) {
  const shouldSeedInvitationCodes =
    process.env.SEED_INVITATION_CODES === "true";

  if (!shouldSeedInvitationCodes) {
    console.log(
      "Skipped invitation code seeding: SEED_INVITATION_CODES is not true",
    );
    return;
  }

  const workshopInvitationCode =
    process.env.SEED_WORKSHOP_INVITATION_CODE || "LMS-DEV-WORKSHOP";

  const cohortInvitationCode =
    process.env.SEED_COHORT_INVITATION_CODE || "LMS-DEV-COHORT";

  await upsertInvitationCode({
    plainCode: workshopInvitationCode,
    scope: "WORKSHOP",
    targetId: workshopId,
    createdById,
    maxUses: 50,
  });

  await upsertInvitationCode({
    plainCode: cohortInvitationCode,
    scope: "COHORT",
    targetId: cohortId,
    createdById,
    maxUses: 50,
  });

  console.log(
    "Plain invitation codes are printed for development only and are not stored in the database.",
  );
}

async function main() {
  await seedRoles();

  const seededUsers = await seedConfiguredAdminUsers();

  const { workshop, cohort } = await seedWorkshopCohortAndSessions();

  await seedInvitationCodes({
    workshopId: workshop.id,
    cohortId: cohort.id,
    createdById: seededUsers.superAdminUserId,
  });

  console.log("Database seed completed.");
}

main()
  .catch((error) => {
    console.error("Failed to seed database:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
