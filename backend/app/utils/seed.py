import asyncio
import uuid
from app.core.security import hash_password
from app.orm import get_orm, close_orm

async def seed_data():
    print("Seeding initial data...")
    orm = get_orm()

    admin_email = "admin@example.com"
    existing = await orm.execute_raw(
        "SELECT id FROM users WHERE email = $1", 
        {"email": admin_email},
        reason="Check for existing admin"
    )

    if not existing:
        print(f"Creating default admin: {admin_email}")
        admin_id = str(uuid.uuid4())
        await orm.execute_raw(
            """INSERT INTO users (id, email, hashed_password, full_name, role, is_active, is_superuser) VALUES ($1, $2, $3, $4, $5, $6, $7)""",
            {"1": admin_id, "2": admin_email, "3": hash_password("AdminPass123!"), "4": "System Administrator", "5": "admin", "6": True, "7": True},
            reason="Seed default admin user"
        )
        print("Admin user created successfully.")
    else:
        print("Admin user already exists.")

    await seed_roles_and_permissions()
    
    user_email = "test@example.com"
    existing_user = await orm.execute_raw(
        "SELECT id FROM users WHERE email = $1", 
        {"email": user_email},
        reason="Check for existing test user"
    )

    if not existing_user:
        print(f"Creating default test user: {user_email}")
        user_id = str(uuid.uuid4())
        await orm.execute_raw(
            """INSERT INTO users (id, email, hashed_password, full_name, role, is_active) VALUES ($1, $2, $3, $4, $5, $6)""",
            {"1": user_id, "2": user_email, "3": hash_password("TestPass123!"), "4": "Test User", "5": "member", "6": True},
            reason="Seed default test user"
        )
        print("Test user created successfully.")
    else:
        print("Test user already exists.")

    await seed_crm_demo()
    print("Seeding complete.")

async def seed_roles_and_permissions():
    """Seed roles and permissions tables to match in-memory ROLE_PERMISSIONS."""
    print("Seeding roles and permissions...")
    orm = get_orm()

    from app.core.rbac import RoleType, ROLE_PERMISSIONS

    role_map = {}
    for role_type in RoleType:
        existing = await orm.execute_raw(
            "SELECT id FROM roles WHERE name = $1",
            {"1": role_type.value},
            reason="Check for existing role"
        )
        if existing:
            role_map[role_type] = existing[0]["id"]
            continue

        role_id = str(uuid.uuid4())
        await orm.execute_raw(
            "INSERT INTO roles (id, name, description, is_system) VALUES ($1, $2, $3, $4)",
            {"1": role_id, "2": role_type.value, "3": f"{role_type.value} role", "4": True},
            reason="Seed default role"
        )
        role_map[role_type] = role_id

    # Upsert permissions for each role from ROLE_PERMISSIONS
    for role_type, perm_types in ROLE_PERMISSIONS.items():
        role_id = role_map[role_type]
        await orm.execute_raw(
            "DELETE FROM permissions WHERE role_id = $1",
            {"1": role_id},
            reason="Refresh permissions for role"
        )
        for perm in perm_types:
            resource, action = perm.value.split(":", 1)
            perm_id = str(uuid.uuid4())
            await orm.execute_raw(
                "INSERT INTO permissions (id, role_id, action, resource) VALUES ($1, $2, $3, $4)",
                {"1": perm_id, "2": role_id, "3": action, "4": resource},
                reason="Seed default permission"
            )

    print("Roles and permissions seeded successfully.")


async def seed_crm_demo():
    print("Seeding CRM demo data...")
    orm = get_orm()

    from app.models.account import Account
    from app.models.contact import Contact

    existing = await orm.execute_raw("SELECT id FROM accounts LIMIT 1", {}, reason="Check for existing accounts")
    if existing:
        print("CRM data already exists, skipping.")
        return

    admin_user = await orm.execute_raw("SELECT id FROM users WHERE role = 'admin' LIMIT 1", {}, reason="Get admin for owner")
    admin_id = admin_user[0]["id"] if admin_user else None

    account = await orm.create(Account, {
        "name": "Acme Corporation", "account_type": "customer", "status": "active", "owner_id": admin_id,
    })

    await orm.create(Contact, {
        "account_id": account.id, "first_name": "John", "last_name": "Smith",
        "email": "john@acme.com", "job_title": "CEO", "is_primary": True, "owner_id": admin_id,
    })
    await orm.create(Contact, {
        "account_id": account.id, "first_name": "Jane", "last_name": "Doe",
        "email": "jane@acme.com", "job_title": "CTO", "owner_id": admin_id,
    })

    print("CRM demo data created successfully.")

async def main():
    try:
        await seed_data()
    finally:
        await close_orm()

if __name__ == "__main__":
    asyncio.run(main())
