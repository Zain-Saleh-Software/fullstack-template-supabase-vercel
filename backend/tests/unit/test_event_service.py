import pytest
from unittest.mock import AsyncMock, patch

from app.services.event_service import event_service


@pytest.mark.asyncio
class TestEventService:
    async def test_count_events_with_filters(self, mock_orm):
        mock_orm.count = AsyncMock(return_value=3)
        result = await event_service.count_events(entity_type="user")
        assert result == 3
        args, _ = mock_orm.count.call_args
        assert args[1] is not None

    async def test_count_events_no_filters(self, mock_orm):
        mock_orm.count = AsyncMock(return_value=10)
        result = await event_service.count_events()
        assert result == 10
        mock_orm.count.assert_called_once()

    async def test_record_creates_event(self, mock_orm):
        result = await event_service.record(
            event_type="test.event",
            entity_type="test",
        )
        assert result is not None
        assert result.event_type == "test.event"
