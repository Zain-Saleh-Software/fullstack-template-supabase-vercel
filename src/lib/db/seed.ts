import { db } from "./index";
import { roles, permissions, users, accounts, contacts } from "./schema";
import { createClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ROLES = [
  { name: "Admin", permissions: ["*:*"] },
  { name: "Manager", permissions: ["account:read", "account:create", "account:update", "account:delete", "contact:read", "contact:create", "contact:update", "contact:delete", "user:read"] },
  { name: "Employee", permissions: ["account:read", "contact:read"] },
];

async function seed() {
  console.log("🌱 Seeding database...");

  // 1. Roles & Permissions
  for (const roleData of ROLES) {
    const [role] = await db
      .insert(roles)
      .values({ name: roleData.name })
      .onConflictDoNothing()
      .returning();

    if (role) {
      const perms = roleData.permissions.map((p) => {
        const [resource, action] = p.split(":");
        return { roleId: role.id, resource, action };
      });
      await db.insert(permissions).values(perms).onConflictDoNothing();
    }
  }

  // Fetch roles to get IDs
  const allRoles = await db.select().from(roles);
  const adminRole = allRoles.find((r) => r.name === "Admin");
  const managerRole = allRoles.find((r) => r.name === "Manager");
  const employeeRole = allRoles.find((r) => r.name === "Employee");

  // 2. Users (Supabase Auth + Public Schema)
  const mockUsers = [
    { email: "admin@example.com", fullName: "Admin User", role: adminRole?.id, isSuperuser: true },
    { email: "manager@example.com", fullName: "Manager User", role: managerRole?.id, isSuperuser: false },
    ...Array.from({ length: 10 }).map((_, i) => ({
      email: `employee${i + 1}@example.com`,
      fullName: `Employee ${i + 1}`,
      role: employeeRole?.id,
      isSuperuser: false,
    })),
  ];

  const dbUsers = [];
  for (const u of mockUsers) {
    const { data: authUser, error } = await supabaseAdmin.auth.admin.createUser({
      email: u.email,
      password: "password123",
      email_confirm: true,
      user_metadata: { full_name: u.fullName },
    });

    if (error) {
      console.warn(`User ${u.email} already exists or error:`, error.message);
      continue;
    }

    if (authUser.user) {
      const [dbUser] = await db
        .update(users)
        .set({ roleId: u.role, isSuperuser: u.isSuperuser, fullName: u.fullName })
        .where(eq(users.id, authUser.user.id))
        .returning();

      if (dbUser) dbUsers.push(dbUser);
    }
  }

  // 3. Accounts & Contacts
  if (dbUsers.length > 0) {
    const ownerId = dbUsers[0].id;
    // Realistic company names for demo
    const companyNames = [
      "Acme Corporation", "Globex Industries", "Initech Solutions", "Umbrella Corp",
      "Wayne Enterprises", "Stark Industries", "Cyberdyne Systems", "Tyrell Corp",
      "Wonka Industries", "Soylent Corp", "Massive Dynamic", "Hooli Ventures",
      "Pied Piper Inc", "Dunder Mifflin", "Vandelay Industries", "Oceanic Airlines",
      "Weyland-Yutani", "Buy n Large", "Genco Pura Olive Oil", "Kwik-E-Mart"
    ];

    for (let i = 0; i < Math.min(companyNames.length, 20); i++) {
      const [account] = await db
        .insert(accounts)
        .values({
          name: companyNames[i],
          accountType: i % 5 === 0 ? "partner" : i % 7 === 0 ? "vendor" : "customer",
          ownerId: dbUsers[i % dbUsers.length].id,
        })
        .returning();

      if (account) {
        const contactsToInsert = [
          { firstName: "Alice", lastName: `Smith`, email: `alice${i}@example.com`, ownerId },
          { firstName: "Bob", lastName: `Jones`, email: `bob${i}@example.com`, ownerId },
        ];
        await db.insert(contacts).values(
          contactsToInsert.map(c => ({ ...c, accountId: account.id }))
        );
      }
    }
  }

  console.log("✅ Seeding complete!");
}

seed().catch((e) => {
  console.error("Seeding failed", e);
  process.exit(1);
});