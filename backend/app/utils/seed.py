import asyncio
import uuid
from app.core.security import hash_password
from app.orm import get_orm, close_orm

async def seed_data():
    print("Seeding initial data...")
    orm = get_orm()
    
    # Create default admin if not exists
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
            """
            INSERT INTO users (id, email, hashed_password, full_name, role, is_active, is_superuser)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            """,
            {
                "1": admin_id,
                "2": admin_email,
                "3": hash_password("AdminPass123!"),
                "4": "System Administrator",
                "5": "admin",
                "6": True,
                "7": True
            },
            reason="Seed default admin user"
        )
        print("Admin user created successfully.")
    else:
        print("Admin user already exists.")

    # Create default test user if not exists
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
            """
            INSERT INTO users (id, email, hashed_password, full_name, role, is_active)
            VALUES ($1, $2, $3, $4, $5, $6)
            """,
            {
                "1": user_id,
                "2": user_email,
                "3": hash_password("TestPass123!"),
                "4": "Test User",
                "5": "member",
                "6": True
            },
            reason="Seed default test user"
        )
        print("Test user created successfully.")
    else:
        print("Test user already exists.")

    print("Seeding complete.")

async def main():
    try:
        await seed_data()
    finally:
        await close_orm()

if __name__ == "__main__":
    asyncio.run(main())
