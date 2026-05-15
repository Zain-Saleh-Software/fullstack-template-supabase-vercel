from pydantic import field_validator
from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    app_name: str = "fullstack-template"
    app_version: str = "1.0.0"
    debug: bool = False
    environment: str = "production"
    allowed_hosts: str = "localhost,127.0.0.1"

    backend_port: int = 8000
    backend_host: str = "0.0.0.0"
    backend_workers: int = 4
    backend_cors_origins: str = "http://localhost:5173"

    # ─── Database ────────────────────────────────────────────────────────
    db_type: str = "postgres"
    database_url: str = "postgresql://postgres:password@localhost:5432/postgres"
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_db_url: str = ""

    # ─── JWT ─────────────────────────────────────────────────────────────
    secret_key: Optional[str] = None
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30
    jwt_refresh_token_expire_days: int = 7

    # ─── Password Reset ──────────────────────────────────────────────────
    password_reset_base_url: str = "http://localhost:5173/reset-password"
    password_reset_token_expire_minutes: int = 60

    # ─── Pool ─────────────────────────────────────────────────────────────
    db_pool_min_size: int = 2
    db_pool_max_size: int = 10
    db_ssl: str = "require"

    # ─── Redis ────────────────────────────────────────────────────────────
    redis_url: str = "redis://localhost:6379"

    # ─── Error Tracking ──────────────────────────────────────────────────
    sentry_dsn: Optional[str] = None

    # ─── Observability ───────────────────────────────────────────────────
    log_level: str = "INFO"
    enable_metrics: bool = True

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.backend_cors_origins.split(",")]

    @property
    def allowed_hosts_list(self) -> List[str]:
        return [h.strip() for h in self.allowed_hosts.split(",")]

    @field_validator("jwt_secret")
    @classmethod
    def reject_default_jwt_secret(cls, v, info):
        if v == "change-me" and info.data.get("environment") != "development":
            if info.data.get("secret_key"):
                return info.data["secret_key"]
            raise ValueError("Default JWT secret 'change-me' is not allowed in production")
        return v

    model_config = {"env_file": ".env", "case_sensitive": False}


settings = Settings()
