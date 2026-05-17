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
  { name: "Manager", permissions: ["account:read", "account:create", "account:update", "contact:read", "contact:create", "contact:update", "user:read"] },
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
    ...Array.from({ length: 98 }).map((_, i) => ({
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
        .set({ roleId: u.role, isSuperuser: u.isSuperuser })
        .where(eq(users.id, authUser.user.id))
        .returning();
      
      if (dbUser) dbUsers.push(dbUser);
    }
  }

  // 3. Accounts & Contacts
  if (dbUsers.length > 0) {
    const ownerId = dbUsers[0].id;
    for (let i = 0; i < 50; i++) {
      const [account] = await db
        .insert(accounts)
        .values({
          name: `Company ${i + 1}`,
          accountType: i % 5 === 0 ? "partner" : "customer",
          ownerId,
        })
        .returning();

      if (account) {
        await db.insert(contacts).values([
          { accountId: account.id, firstName: "Alice", lastName: `Contact ${i}`, email: `alice${i}@example.com`, ownerId },
          { accountId: account.id, firstName: "Bob", lastName: `Contact ${i}`, email: `bob${i}@example.com`, ownerId },
          { accountId: account.id, firstName: "Charlie", lastName: `Contact ${i}`, email: `charlie${i}@example.com`, ownerId },
        ]);
      }
    }
  }

  console.log("✅ Seeding complete!");
}

seed().catch((e) => {
  console.error("Seeding failed", e);
  process.exit(1);
});
