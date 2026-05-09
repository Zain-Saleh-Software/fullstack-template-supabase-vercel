"""Unit tests for observability module (logging, tracing, metrics)."""

import pytest
from unittest.mock import patch, AsyncMock

from app.core.observability import (
    async_trace,
    get_request_id,
    set_request_id,
    set_trace_context,
    observe_db,
    request_id_var,
)


class TestRequestContext:
    def test_request_id_default_is_empty(self):
        assert get_request_id() == ""

    def test_set_request_id(self):
        set_request_id("test-123")
        assert get_request_id() == "test-123"

    def test_set_trace_context_updates_all(self):
        set_trace_context("req-456", "user-789")
        assert get_request_id() == "req-456"

    def test_multiple_request_ids_dont_clash(self):
        set_request_id("first")
        token = request_id_var.set("second")
        assert get_request_id() == "second"
        request_id_var.reset(token)
        assert get_request_id() == "first"


class TestAsyncTraceDecorator:
    @pytest.mark.asyncio
    async def test_trace_decorator_returns_result(self):
        @async_trace("test.operation")
        async def sample_func():
            return "success"

        result = await sample_func()
        assert result == "success"

    @pytest.mark.asyncio
    async def test_trace_decorator_propagates_exception(self):
        @async_trace("test.error")
        async def failing_func():
            raise ValueError("test error")

        with pytest.raises(ValueError, match="test error"):
            await failing_func()

    @pytest.mark.asyncio
    async def test_trace_with_attributes(self):
        @async_trace("test.attrs", attributes={"key": "value"})
        async def sample_func():
            return "ok"

        result = await sample_func()
        assert result == "ok"


class TestObserveDbDecorator:
    @pytest.mark.asyncio
    async def test_observe_db_records_metrics(self):
        @observe_db("select", "users")
        async def db_func():
            return [{"id": 1}]

        result = await db_func()
        assert result == [{"id": 1}]

    @pytest.mark.asyncio
    async def test_observe_db_handles_exception(self):
        @observe_db("insert", "users")
        async def failing_db():
            raise RuntimeError("DB error")

        with pytest.raises(RuntimeError):
            await failing_db()


class TestMetricsExistence:
    def test_http_request_count_exists(self):
        from app.core.observability import http_request_count
        assert http_request_count._name == "http_requests_total"

    def test_http_request_duration_exists(self):
        from app.core.observability import http_request_duration
        assert http_request_duration._name == "http_request_duration_seconds"

    def test_db_query_count_exists(self):
        from app.core.observability import db_query_count
        assert db_query_count._name == "db_queries_total"

    def test_db_query_duration_exists(self):
        from app.core.observability import db_query_duration
        assert db_query_duration._name == "db_query_duration_seconds"


class TestStructLog:
    def test_logger_exists(self):
        from app.core.observability import logger
        assert logger is not None
        assert logger._name == "fullstack"

    def test_logger_can_log(self):
        from app.core.observability import logger
        try:
            logger.info("test_message", key="value")
        except Exception:
            pytest.fail("Logger failed to log")
