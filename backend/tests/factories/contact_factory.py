import uuid
from typing import Optional

from app.models.contact import Contact


class ContactFactory:
    _counter = 0

    @classmethod
    def _next_email(cls) -> str:
        cls._counter += 1
        return f"contact{cls._counter}@test.com"

    @classmethod
    def build(
        cls,
        account_id: Optional[str] = None,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        email: Optional[str] = None,
        owner_id: Optional[str] = None,
        **kwargs,
    ) -> Contact:
        cls._counter += 1
        return Contact(
            id=str(uuid.uuid4()),
            account_id=account_id or str(uuid.uuid4()),
            first_name=first_name or f"John{cls._counter}",
            last_name=last_name or "Doe",
            email=email or cls._next_email(),
            owner_id=owner_id or str(uuid.uuid4()),
            **kwargs,
        )

    @classmethod
    def build_dict(cls, **kwargs) -> dict:
        contact = cls.build(**kwargs)
        return contact.model_dump()

    @classmethod
    def primary(cls, account_id: str) -> Contact:
        return cls.build(account_id=account_id, is_primary=True)
