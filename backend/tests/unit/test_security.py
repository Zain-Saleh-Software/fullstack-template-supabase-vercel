"""Unit tests for security module (JWT, password hashing)."""

import pytest
from datetime import timedelta
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)


class TestPasswordHashing:
    def test_hash_password_returns_string(self):
        hashed = hash_password("TestPass123!")
        assert isinstance(hashed, str)
        assert len(hashed) > 0

    def test_verify_password_correct(self):
        hashed = hash_password("TestPass123!")
        assert verify_password("TestPass123!", hashed) is True

    def test_verify_password_incorrect(self):
        hashed = hash_password("TestPass123!")
        assert verify_password("WrongPassword", hashed) is False

    def test_same_password_different_hashes(self):
        h1 = hash_password("TestPass123!")
        h2 = hash_password("TestPass123!")
        assert h1 != h2


class TestJWTTokens:
    def test_create_access_token_returns_string(self):
        token = create_access_token({"sub": "user123"})
        assert isinstance(token, str)
        assert len(token.split(".")) == 3

    def test_create_access_token_with_custom_expiry(self):
        token = create_access_token({"sub": "user123"}, expires_delta=timedelta(hours=1))
        payload = decode_token(token)
        assert payload is not None
        assert payload["sub"] == "user123"

    def test_create_refresh_token(self):
        token = create_refresh_token({"sub": "user123"})
        payload = decode_token(token)
        assert payload is not None
        assert payload["type"] == "refresh"

    def test_decode_valid_token(self):
        token = create_access_token({"sub": "user123", "role": "admin"})
        payload = decode_token(token)
        assert payload is not None
        assert payload["sub"] == "user123"
        assert payload["role"] == "admin"

    def test_decode_invalid_token_returns_none(self):
        payload = decode_token("invalid.token.here")
        assert payload is None

    def test_decode_expired_token_returns_none(self):
        token = create_access_token({"sub": "user123"}, expires_delta=timedelta(seconds=-1))
        payload = decode_token(token)
        assert payload is None

    def test_create_and_decode_multiple_tokens(self):
        tokens = [
            create_access_token({"sub": f"user{i}"})
            for i in range(5)
        ]
        for i, token in enumerate(tokens):
            payload = decode_token(token)
            assert payload["sub"] == f"user{i}"
