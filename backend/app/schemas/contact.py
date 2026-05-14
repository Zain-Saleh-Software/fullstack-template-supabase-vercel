from typing import Optional, Any
from pydantic import BaseModel, field_validator
from datetime import datetime


def _validate_optional_string(v: Any, field_name: str) -> Optional[str]:
    if v is None:
        return None
    if isinstance(v, bool):
        raise ValueError(f'{field_name} cannot be a boolean')
    result = str(v).strip()
    if not result:
        return None
    return result


class ContactCreate(BaseModel):
    model_config = {"coerce_numbers_to_str": True}

    account_id: str
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    mobile_phone: Optional[str] = None
    mobile_phone_2: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    is_primary: bool = False
    owner_id: Optional[str] = None

    @field_validator('account_id')
    @classmethod
    def validate_account_id(cls, v: Any) -> str:
        if v is None:
            raise ValueError('account_id cannot be empty')
        if isinstance(v, bool):
            raise ValueError('account_id cannot be a boolean')
        result = str(v).strip()
        if not result:
            raise ValueError('account_id cannot be empty')
        return result

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: Any) -> Optional[str]:
        return _validate_optional_string(v, 'Phone')

    @field_validator('mobile_phone')
    @classmethod
    def validate_mobile_phone(cls, v: Any) -> Optional[str]:
        return _validate_optional_string(v, 'Mobile phone')

    @field_validator('mobile_phone_2')
    @classmethod
    def validate_mobile_phone_2(cls, v: Any) -> Optional[str]:
        return _validate_optional_string(v, 'Mobile phone 2')

    @field_validator('owner_id')
    @classmethod
    def validate_owner_id(cls, v: Any) -> Optional[str]:
        if v is None:
            return None
        if isinstance(v, bool):
            raise ValueError('owner_id cannot be a boolean')
        result = str(v).strip()
        if not result:
            return None
        return result


class ContactUpdate(BaseModel):
    model_config = {"coerce_numbers_to_str": True}

    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    mobile_phone: Optional[str] = None
    mobile_phone_2: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    is_primary: Optional[bool] = None
    owner_id: Optional[str] = None

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: Any) -> Optional[str]:
        return _validate_optional_string(v, 'Phone')

    @field_validator('mobile_phone')
    @classmethod
    def validate_mobile_phone(cls, v: Any) -> Optional[str]:
        return _validate_optional_string(v, 'Mobile phone')

    @field_validator('mobile_phone_2')
    @classmethod
    def validate_mobile_phone_2(cls, v: Any) -> Optional[str]:
        return _validate_optional_string(v, 'Mobile phone 2')


class ContactResponse(BaseModel):
    id: str
    account_id: str
    first_name: str
    last_name: str
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    mobile_phone: Optional[str] = None
    mobile_phone_2: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    is_primary: bool
    owner_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
