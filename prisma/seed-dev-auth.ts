import { createClient } from "@supabase/supabase-js";
import { prisma } from "../src/lib/prisma";

type DevUserConfig = {
  email: string;
  password: string;
  fullName: string;
  roleName: "super_admin" | "participant";
  profile?: {
    nim: string;
    programStudy: string;
    semester: number;
    phone: string;
  };
};

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

function createSupabaseAdminClient() {
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function findAuthUserByEmail(email: string) {
  const supabaseAdmin = createSupabaseAdminClient();

  const { data, error } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) {
    throw error;
  }

  return data.users.find(
    (user) => user.email?.toLowerCase() === email.toLowerCase(),
  );
}

async function upsertSupabaseAuthUser(user: DevUserConfig) {
  const supabaseAdmin = createSupabaseAdminClient();
  const existingAuthUser = await findAuthUserByEmail(user.email);

  if (existingAuthUser) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      existingAuthUser.id,
      {
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.fullName,
        },
      },
    );

    if (error) {
      throw error;
    }

    console.log(`Updated Supabase Auth user: ${user.email}`);
    return;
  }

  const { error } = await supabaseAdmin.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: {
      full_name: user.fullName,
    },
  });

  if (error) {
    throw error;
  }

  console.log(`Created Supabase Auth user: ${user.email}`);
}

async function upsertAppUser(user: DevUserConfig) {
  const appUser = await prisma.user.upsert({
    where: {
      email: user.email,
    },
    update: {
      status: "ACTIVE",
    },
    create: {
      email: user.email,
      status: "ACTIVE",
    },
  });

  const role = await prisma.role.findUnique({
    where: {
      name: user.roleName,
    },
  });

  if (!role) {
    throw new Error(`Role not found: ${user.roleName}`);
  }

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: appUser.id,
        roleId: role.id,
      },
    },
    update: {},
    create: {
      userId: appUser.id,
      roleId: role.id,
    },
  });

  await prisma.userProfile.upsert({
    where: {
      userId: appUser.id,
    },
    update: {
      fullName: user.fullName,
      nim: user.profile?.nim ?? null,
      programStudy: user.profile?.programStudy ?? null,
      semester: user.profile?.semester ?? null,
      phone: user.profile?.phone ?? null,
      profileCompletedAt: new Date(),
    },
    create: {
      userId: appUser.id,
      fullName: user.fullName,
      nim: user.profile?.nim ?? null,
      programStudy: user.profile?.programStudy ?? null,
      semester: user.profile?.semester ?? null,
      phone: user.profile?.phone ?? null,
      profileCompletedAt: new Date(),
    },
  });

  console.log(`Seeded app user: ${user.email}`);

  return appUser;
}

async function approveParticipantInDefaultCohort(userId: string) {
  const cohort = await prisma.cohort.findFirst({
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!cohort) {
    console.log("Skipped participant enrollment: no cohort found");
    return;
  }

  const existingEnrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      cohortId: cohort.id,
    },
  });

  if (existingEnrollment) {
    await prisma.enrollment.update({
      where: {
        id: existingEnrollment.id,
      },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        cohortId: cohort.id,
      },
    });

    console.log("Updated participant approved enrollment");
    return;
  }

  await prisma.enrollment.create({
    data: {
      userId,
      scope: "COHORT",
      targetId: cohort.id,
      cohortId: cohort.id,
      status: "APPROVED",
      approvedAt: new Date(),
    },
  });

  console.log("Created participant approved enrollment");
}

async function main() {
  const devUsers: DevUserConfig[] = [
    {
      email: requireEnv("SEED_SUPER_ADMIN_EMAIL").toLowerCase(),
      password: requireEnv("SEED_SUPER_ADMIN_PASSWORD"),
      fullName: "Development Super Admin",
      roleName: "super_admin",
    },
    {
      email: requireEnv("SEED_PARTICIPANT_EMAIL").toLowerCase(),
      password: requireEnv("SEED_PARTICIPANT_PASSWORD"),
      fullName: "Development Participant",
      roleName: "participant",
      profile: {
        nim: "DEV0001",
        programStudy: "Teknologi Informasi",
        semester: 2,
        phone: "080000000001",
      },
    },
  ];

  for (const user of devUsers) {
    await upsertSupabaseAuthUser(user);
    const appUser = await upsertAppUser(user);

    if (user.roleName === "participant") {
      await approveParticipantInDefaultCohort(appUser.id);
    }
  }

  console.log("Development auth users seeded.");
}

main()
  .catch((error) => {
    console.error("Failed to seed development auth users:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
