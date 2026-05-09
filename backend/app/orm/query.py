from typing import Any


class QueryBuilder:
    def __init__(self, table: str):
        self._table = table
        self._select = "*"
        self._filters: list[tuple[str, str, Any]] = []
        self._order_by: str | None = None
        self._order_direction: str = "asc"
        self._limit: int | None = None
        self._offset: int | None = None
        self._range_start: int | None = None
        self._range_end: int | None = None

    def select(self, columns: str) -> "QueryBuilder":
        self._select = columns
        return self

    def eq(self, column: str, value: Any) -> "QueryBuilder":
        self._filters.append(("eq", column, value))
        return self

    def neq(self, column: str, value: Any) -> "QueryBuilder":
        self._filters.append(("neq", column, value))
        return self

    def gt(self, column: str, value: Any) -> "QueryBuilder":
        self._filters.append(("gt", column, value))
        return self

    def gte(self, column: str, value: Any) -> "QueryBuilder":
        self._filters.append(("gte", column, value))
        return self

    def lt(self, column: str, value: Any) -> "QueryBuilder":
        self._filters.append(("lt", column, value))
        return self

    def lte(self, column: str, value: Any) -> "QueryBuilder":
        self._filters.append(("lte", column, value))
        return self

    def like(self, column: str, pattern: str) -> "QueryBuilder":
        self._filters.append(("like", column, pattern))
        return self

    def ilike(self, column: str, pattern: str) -> "QueryBuilder":
        self._filters.append(("ilike", column, pattern))
        return self

    def is_null(self, column: str) -> "QueryBuilder":
        self._filters.append(("is", column, None))
        return self

    def is_not_null(self, column: str) -> "QueryBuilder":
        self._filters.append(("is", column, "not.null"))
        return self

    def in_(self, column: str, values: list[Any]) -> "QueryBuilder":
        if not values:
            return self
        self._filters.append(("in", column, values))
        return self

    def order(self, column: str, direction: str = "asc") -> "QueryBuilder":
        self._order_by = column
        self._order_direction = direction
        return self

    def limit(self, limit: int) -> "QueryBuilder":
        self._limit = limit
        return self

    def offset(self, offset: int) -> "QueryBuilder":
        self._offset = offset
        return self

    def range(self, start: int, end: int) -> "QueryBuilder":
        self._range_start = start
        self._range_end = end
        return self

    @property
    def table(self) -> str:
        return self._table

    @property
    def select_clause(self) -> str:
        return self._select

    @property
    def filters(self) -> list[tuple[str, str, Any]]:
        return self._filters

    @property
    def range_start(self) -> int | None:
        return self._range_start

    @property
    def range_end(self) -> int | None:
        return self._range_end

    @property
    def order_by(self) -> str | None:
        return self._order_by

    @property
    def order_direction(self) -> str:
        return self._order_direction

    @property
    def limit_val(self) -> int | None:
        return self._limit

    @property
    def offset_val(self) -> int | None:
        return self._offset

    def __repr__(self) -> str:
        return f"QueryBuilder(table={self._table}, filters={len(self._filters)})"
