from abc import ABC, abstractmethod
from typing import Any, Optional, TypeVar

from app.orm.query import QueryBuilder

T = TypeVar("T")


class BaseORM(ABC):
    @abstractmethod
    async def find_all(self, model_class: type[T], limit: int = 100, offset: int = 0) -> list[T]:
        ...

    @abstractmethod
    async def find_by_id(self, model_class: type[T], id: str) -> Optional[T]:
        ...

    @abstractmethod
    async def find_by(
        self, model_class: type[T], builder: QueryBuilder, limit: int = 100, offset: int = 0
    ) -> list[T]:
        ...

    @abstractmethod
    async def find_one_by(
        self, model_class: type[T], builder: QueryBuilder
    ) -> Optional[T]:
        ...

    @abstractmethod
    async def create(
        self, model_class: type[T], data: dict[str, Any]
    ) -> T:
        ...

    @abstractmethod
    async def create_many(
        self, model_class: type[T], data_list: list[dict[str, Any]]
    ) -> list[T]:
        ...

    @abstractmethod
    async def update(
        self, model_class: type[T], id: str, data: dict[str, Any]
    ) -> T:
        ...

    @abstractmethod
    async def update_by(
        self, model_class: type[T], builder: QueryBuilder, data: dict[str, Any]
    ) -> list[T]:
        ...

    @abstractmethod
    async def delete(self, model_class: type[T], id: str) -> bool:
        ...

    @abstractmethod
    async def delete_by(
        self, model_class: type[T], builder: QueryBuilder
    ) -> bool:
        ...

    @abstractmethod
    async def count(self, model_class: type[T], builder: Optional[QueryBuilder] = None) -> int:
        ...

    @abstractmethod
    async def execute_raw(self, query: str, params: Optional[dict] = None, reason: str = "") -> list[dict]:
        ...

    def query(self, model_class: type[T]) -> QueryBuilder:
        return QueryBuilder(model_class._table())
