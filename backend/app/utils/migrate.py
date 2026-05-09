import asyncio
import os
from glob import glob

from app.core.config import settings
from app.orm import get_orm, close_orm

async def run_migrations():
    print(f"Running migrations for environment: {settings.environment}")
    orm = get_orm()
    
    # Simple migrations table to track applied migrations
    await orm.execute_raw("""
        CREATE TABLE IF NOT EXISTS _migrations (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL,
            applied_at TIMESTAMPTZ DEFAULT NOW()
        );
    """, reason="Initialize migrations table")
    
    # Get applied migrations
    applied = await orm.execute_raw("SELECT name FROM _migrations", reason="Check applied migrations")
    applied_names = {row["name"] for row in applied}
    
    migrations_dir = os.path.join(os.path.dirname(__file__), "../../migrations")
    migration_files = sorted(glob(os.path.join(migrations_dir, "*.sql")))
    
    if not migration_files:
        print(f"No SQL files found in {migrations_dir}")
        return
        
    for filepath in migration_files:
        filename = os.path.basename(filepath)
        if filename in applied_names:
            print(f"Skipping {filename} (already applied)")
            continue
            
        print(f"Applying {filename}...")
        with open(filepath, "r", encoding="utf-8") as f:
            sql = f.read()
            
        try:
            await orm.execute_script(sql, reason=f"Migration {filename}")
            await orm.execute_raw(
                "INSERT INTO _migrations (name) VALUES ($1)",
                {"name": filename},
                reason=f"Record migration {filename}"
            )
            print(f"Successfully applied {filename}")
        except Exception as e:
            print(f"Error applying {filename}: {e}")
            raise
            
    print("Migrations complete.")

async def main():
    try:
        await run_migrations()
    finally:
        await close_orm()

if __name__ == "__main__":
    asyncio.run(main())
