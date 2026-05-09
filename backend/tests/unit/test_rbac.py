"""Unit tests for RBAC system."""

import pytest
from app.core.rbac import (
    RBACService,
    PermissionType,
    RoleType,
    ROLE_PERMISSIONS,
)
from app.tests.factories.user_factory import UserFactory


@pytest.fixture
def rbac():
    return RBACService()


class TestRolePermissions:
    def test_admin_has_all_permissions(self, rbac):
        user = UserFactory.admin()
        for perm in PermissionType:
            result = rbac.user_has_permission(user, perm)
            assert result is True

    def test_customer_has_limited_permissions(self, rbac):
        user = UserFactory.customer()
        assert rbac.user_has_permission(user, PermissionType.CONTENT_READ) is True
        assert rbac.user_has_permission(user, PermissionType.USER_CREATE) is False
        assert rbac.user_has_permission(user, PermissionType.SYSTEM_ADMIN) is False

    def test_technician_has_technical_permissions(self, rbac):
        user = UserFactory.technician()
        assert rbac.user_has_permission(user, PermissionType.USER_READ) is True
        assert rbac.user_has_permission(user, PermissionType.EVENT_READ) is True
        assert rbac.user_has_permission(user, PermissionType.ROLE_CREATE) is False
        assert rbac.user_has_permission(user, PermissionType.SYSTEM_ADMIN) is False

    def test_member_has_content_permissions(self, rbac):
        user = UserFactory.member()
        assert rbac.user_has_permission(user, PermissionType.CONTENT_READ) is True
        assert rbac.user_has_permission(user, PermissionType.CONTENT_CREATE) is True
        assert rbac.user_has_permission(user, PermissionType.CONTENT_UPDATE) is True
        assert rbac.user_has_permission(user, PermissionType.CONTENT_DELETE) is False
        assert rbac.user_has_permission(user, PermissionType.USER_CREATE) is False

    def test_inactive_user_still_has_role_permissions(self, rbac):
        user = UserFactory.inactive()
        user.role = "member"
        assert rbac.user_has_permission(user, PermissionType.CONTENT_READ) is True


class TestUserHasRole:
    def test_admin_has_admin_role(self, rbac):
        user = UserFactory.admin()
        result = rbac.user_has_role(user, RoleType.ADMIN)
        assert result is True

    def test_admin_also_passes_other_role_checks(self, rbac):
        user = UserFactory.admin()
        assert rbac.user_has_role(user, RoleType.TECHNICIAN) is True

    def test_customer_does_not_have_admin_role(self, rbac):
        user = UserFactory.customer()
        assert rbac.user_has_role(user, RoleType.ADMIN) is False
        assert rbac.user_has_role(user, RoleType.TECHNICIAN) is False

    def test_technician_has_technician_role(self, rbac):
        user = UserFactory.technician()
        assert rbac.user_has_role(user, RoleType.TECHNICIAN) is True

    def test_member_has_member_role(self, rbac):
        user = UserFactory.member()
        assert rbac.user_has_role(user, RoleType.MEMBER) is True


class TestGetUserPermissions:
    def test_returns_list_of_permission_strings(self, rbac):
        user = UserFactory.admin()
        permissions = rbac.get_user_permissions(user)
        assert isinstance(permissions, list)
        assert len(permissions) == len(list(PermissionType))
        assert all(isinstance(p, str) for p in permissions)

    def test_customer_returns_fewer_permissions(self, rbac):
        user = UserFactory.customer()
        permissions = rbac.get_user_permissions(user)
        assert len(permissions) < len(list(PermissionType))

    def test_unknown_role_falls_back_to_customer(self, rbac):
        user = UserFactory.build(role="nonexistent_role")
        permissions = rbac.get_user_permissions(user)
        expected = [p.value for p in ROLE_PERMISSIONS[RoleType.CUSTOMER]]
        assert permissions == expected


class TestRoleEnum:
    def test_all_roles_have_permissions_defined(self):
        for role in RoleType:
            assert role in ROLE_PERMISSIONS
            assert len(ROLE_PERMISSIONS[role]) > 0

    def test_admin_has_every_permission(self):
        assert len(ROLE_PERMISSIONS[RoleType.ADMIN]) == len(list(PermissionType))

    def test_no_duplicate_permissions_within_role(self):
        for role, perms in ROLE_PERMISSIONS.items():
            assert len(perms) == len(set(perms))
