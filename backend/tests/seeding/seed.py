"""Seed test data into the mock ORM for integration tests."""

from app.models.user import User
from app.models.role import Role
from app.models.event import Event
from tests.factories.user_factory import UserFactory
from tests.factories.role_factory import RoleFactory


class TestSeeder:
    """Seeds test data for various test scenarios.

    Contexts:
        - basic: admin + customer users
        - full: all roles + events
        - empty: no data
    """

    def __init__(self, orm):
        self.orm = orm
        self.users: list[User] = []
        self.roles: list[Role] = []
        self.events: list[Event] = []

    async def seed_basic(self):
        """Seeds basic users (admin + customer)."""
        self.users = [
            UserFactory.admin(),
            UserFactory.customer(),
        ]
        for u in self.users:
            await self.orm.create(User, u.model_dump())

    async def seed_full(self, count: int = 5):
        """Seeds full test data with all roles and events."""
        role_builders = [RoleFactory.admin, RoleFactory.technician, RoleFactory.member, RoleFactory.customer]
        for builder in role_builders:
            role = builder()
            self.roles.append(role)
            await self.orm.create(Role, role.model_dump())

        user_builders = [
            UserFactory.admin,
            UserFactory.technician,
            UserFactory.member,
            UserFactory.customer,
        ]
        for builder in user_builders:
            for _ in range(count):
                user = builder()
                self.users.append(user)
                await self.orm.create(User, user.model_dump())

        from tests.factories.event_factory import EventFactory
        for _ in range(count * 2):
            event = EventFactory.build()
            self.events.append(event)
            await self.orm.create(Event, event.model_dump())

    async def seed_empty(self):
        """Seeds nothing — empty database state."""
        pass

    async def clear(self):
        """Clears all seeded data."""
        self.orm._stores.clear()
        self.users = []
        self.roles = []
        self.events = []
