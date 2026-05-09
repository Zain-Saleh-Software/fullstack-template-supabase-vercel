"""Unit tests for ORM QueryBuilder and MockORM."""

import pytest
from app.orm.query import QueryBuilder


# ─── QueryBuilder Tests ──────────────────────────────────────────────────

class TestQueryBuilderInitialization:
    def test_creates_with_table_name(self):
        qb = QueryBuilder("users")
        assert qb.table == "users"
        assert qb.select_clause == "*"

    def test_default_select_is_star(self):
        qb = QueryBuilder("test")
        assert qb.select_clause == "*"


class TestQueryBuilderFilterMethods:
    def test_eq_adds_filter(self):
        qb = QueryBuilder("users").eq("name", "john")
        assert ("eq", "name", "john") in qb.filters

    def test_neq_adds_filter(self):
        qb = QueryBuilder("users").neq("status", "banned")
        assert ("neq", "status", "banned") in qb.filters

    def test_gt_adds_filter(self):
        qb = QueryBuilder("users").gt("age", 18)
        assert ("gt", "age", 18) in qb.filters

    def test_gte_adds_filter(self):
        qb = QueryBuilder("users").gte("age", 18)
        assert ("gte", "age", 18) in qb.filters

    def test_lt_adds_filter(self):
        qb = QueryBuilder("users").lt("score", 100)
        assert ("lt", "score", 100) in qb.filters

    def test_lte_adds_filter(self):
        qb = QueryBuilder("users").lte("score", 100)
        assert ("lte", "score", 100) in qb.filters

    def test_like_adds_filter(self):
        qb = QueryBuilder("users").like("email", "%@test.com")
        assert ("like", "email", "%@test.com") in qb.filters

    def test_ilike_adds_filter(self):
        qb = QueryBuilder("users").ilike("name", "%john%")
        assert ("ilike", "name", "%john%") in qb.filters

    def test_is_null_adds_filter(self):
        qb = QueryBuilder("users").is_null("deleted_at")
        assert ("is", "deleted_at", None) in qb.filters

    def test_is_not_null_adds_filter(self):
        qb = QueryBuilder("users").is_not_null("email")
        assert ("is", "email", "not.null") in qb.filters

    def test_in_adds_filter(self):
        qb = QueryBuilder("users").in_("role", ["admin", "mod"])
        assert ("in", "role", ["admin", "mod"]) in qb.filters


class TestQueryBuilderChaining:
    def test_chains_multiple_filters(self):
        qb = (
            QueryBuilder("users")
            .eq("active", True)
            .gt("age", 18)
            .like("name", "%a%")
            .limit(10)
            .offset(5)
        )
        assert len(qb.filters) == 3

    def test_select_changes_column(self):
        qb = QueryBuilder("users").select("id, email")
        assert qb.select_clause == "id, email"

    def test_order_sets_direction(self):
        qb = QueryBuilder("users").order("created_at", "desc")
        assert qb._order_by == "created_at"
        assert qb._order_direction == "desc"

    def test_default_order_is_asc(self):
        qb = QueryBuilder("users").order("name")
        assert qb._order_direction == "asc"

    def test_limit_and_offset(self):
        qb = QueryBuilder("users").limit(5).offset(10)
        assert qb._limit == 5
        assert qb._offset == 10

    def test_range_sets_bounds(self):
        qb = QueryBuilder("users").range(0, 9)
        assert qb.range_start == 0
        assert qb.range_end == 9


class TestQueryBuilderRepresentation:
    def test_repr_contains_table(self):
        qb = QueryBuilder("users")
        assert "users" in repr(qb)

    def test_repr_contains_query(self):
        qb = QueryBuilder("users").eq("name", "john")
        assert "name=eq.john" in repr(qb)


# ─── MockORM Tests ───────────────────────────────────────────────────────

@pytest.mark.asyncio
class TestMockORMCrud:
    @property
    def orm(self):
        from tests.conftest import MockORM
        return MockORM()

    async def test_create_and_find_by_id(self):
        from app.models.user import User
        orm = self.orm
        created = await orm.create(User, {"id": "1", "email": "a@b.com", "hashed_password": "pw", "role": "customer"})
        found = await orm.find_by_id(User, "1")
        assert found is not None
        assert found.email == "a@b.com"

    async def test_create_many(self):
        from app.models.user import User
        orm = self.orm
        users = await orm.create_many(User, [
            {"id": "1", "email": "a@b.com", "hashed_password": "pw", "role": "customer"},
            {"id": "2", "email": "b@b.com", "hashed_password": "pw", "role": "admin"},
        ])
        assert len(users) == 2
        all_users = await orm.find_all(User)
        assert len(all_users) == 2

    async def test_find_by_with_eq_filter(self):
        from app.models.user import User
        orm = self.orm
        await orm.create(User, {"id": "1", "email": "a@b.com", "hashed_password": "pw", "role": "customer"})
        await orm.create(User, {"id": "2", "email": "b@b.com", "hashed_password": "pw", "role": "admin"})
        results = await orm.find_by(User, orm.query(User).eq("role", "admin"))
        assert len(results) == 1
        assert results[0].email == "b@b.com"

    async def test_find_one_by_returns_first_match(self):
        from app.models.user import User
        orm = self.orm
        await orm.create(User, {"id": "1", "email": "a@b.com", "hashed_password": "pw", "role": "customer"})
        result = await orm.find_one_by(User, orm.query(User).eq("email", "a@b.com"))
        assert result is not None
        assert result.id == "1"

    async def test_find_one_by_returns_none_if_no_match(self):
        from app.models.user import User
        orm = self.orm
        result = await orm.find_one_by(User, orm.query(User).eq("email", "nonexistent"))
        assert result is None

    async def test_update_modifies_fields(self):
        from app.models.user import User
        orm = self.orm
        await orm.create(User, {"id": "1", "email": "a@b.com", "hashed_password": "pw", "role": "customer"})
        updated = await orm.update(User, "1", {"full_name": "Updated"})
        assert updated.full_name == "Updated"

    async def test_delete_removes_record(self):
        from app.models.user import User
        orm = self.orm
        await orm.create(User, {"id": "1", "email": "a@b.com", "hashed_password": "pw", "role": "customer"})
        deleted = await orm.delete(User, "1")
        assert deleted is True
        found = await orm.find_by_id(User, "1")
        assert found is None

    async def test_delete_returns_false_if_not_found(self):
        from app.models.user import User
        orm = self.orm
        deleted = await orm.delete(User, "nonexistent")
        assert deleted is False

    async def test_count_returns_correct_number(self):
        from app.models.user import User
        orm = self.orm
        await orm.create_many(User, [
            {"id": "1", "email": "a@b.com", "hashed_password": "pw", "role": "customer"},
            {"id": "2", "email": "b@b.com", "hashed_password": "pw", "role": "customer"},
        ])
        count = await orm.count(User)
        assert count == 2

    async def test_count_returns_zero_for_empty(self):
        from app.models.user import User
        orm = self.orm
        count = await orm.count(User)
        assert count == 0

    async def test_delete_by_multiple_records(self):
        from app.models.user import User
        orm = self.orm
        await orm.create_many(User, [
            {"id": "1", "email": "a@b.com", "hashed_password": "pw", "role": "customer"},
            {"id": "2", "email": "b@b.com", "hashed_password": "pw", "role": "customer"},
            {"id": "3", "email": "c@b.com", "hashed_password": "pw", "role": "admin"},
        ])
        await orm.delete_by(User, orm.query(User).eq("role", "customer"))
        remaining = await orm.find_all(User)
        assert len(remaining) == 1

    async def test_update_by_multiple_records(self):
        from app.models.user import User
        orm = self.orm
        await orm.create_many(User, [
            {"id": "1", "email": "a@b.com", "hashed_password": "pw", "role": "customer"},
            {"id": "2", "email": "b@b.com", "hashed_password": "pw", "role": "customer"},
        ])
        await orm.update_by(User, orm.query(User).eq("role", "customer"), {"role": "member"})
        all_users = await orm.find_all(User)
        assert all(u.role == "member" for u in all_users)

    async def test_update_by_requires_filters(self):
        from app.models.user import User
        from app.orm.query import QueryBuilder
        orm = self.orm
        with pytest.raises(ValueError, match="requires at least one filter"):
            await orm.update_by(User, QueryBuilder("users"), {"role": "admin"})

    async def test_delete_by_requires_filters(self):
        from app.models.user import User
        from app.orm.query import QueryBuilder
        orm = self.orm
        with pytest.raises(ValueError, match="requires at least one filter"):
            await orm.delete_by(User, QueryBuilder("users"))

    async def test_execute_raw_returns_empty(self):
        from app.models.user import User
        orm = self.orm
        result = await orm.execute_raw("SELECT 1", reason="test audit")
        assert result == []

    async def test_close_clears_stores(self):
        orm = self.orm
        from app.models.user import User
        await orm.create(User, {"id": "1", "email": "a@b.com", "hashed_password": "pw", "role": "customer"})
        await orm.close()
        all_users = await orm.find_all(User)
        assert len(all_users) == 0
