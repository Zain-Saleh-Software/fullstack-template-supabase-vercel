import uuid
from typing import Optional

from app.models.account import Account


class AccountFactory:
    _counter = 0

    @classmethod
    def _next_name(cls) -> str:
        cls._counter += 1
        return f"Test Company {cls._counter}"

    @classmethod
    def build(
        cls,
        name: Optional[str] = None,
        account_type: str = "customer",
        status: str = "active",
        owner_id: Optional[str] = None,
        **kwargs,
    ) -> Account:
        name = name or cls._next_name()
        return Account(
            id=str(uuid.uuid4()),
            name=name,
            account_type=account_type,
            status=status,
            owner_id=owner_id or str(uuid.uuid4()),
            **kwargs,
        )

    @classmethod
    def build_dict(cls, **kwargs) -> dict:
        account = cls.build(**kwargs)
        return account.model_dump()

    @classmethod
    def prospect(cls) -> Account:
        return cls.build(account_type="prospect")

    @classmethod
    def vendor(cls) -> Account:
        return cls.build(account_type="vendor")
