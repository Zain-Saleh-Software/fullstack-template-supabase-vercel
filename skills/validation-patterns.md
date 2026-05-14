# Validation Pattern for Input Components

**MANDATORY PATTERN** - All input fields MUST follow this validation approach across all three layers (database, backend, frontend).

---

## 0. Frontend Validation — MUST Reject Invalid Data at Frontend

**Golden Rule:** Invalid entities should NOT be sent to backend if they can be rejected from frontend. Frontend validation is the first line of defense against bad data.

### Frontend Validation Requirements

1. **Validate BEFORE Submission**
   - Call validation function in `handleSubmit()` before sending data to backend
   - Only submit if `validateForm()` returns no errors

2. **Friendly Error Messages**
   - Return human-readable error messages (not technical)
   - Example: "Email must be a valid email address" not "invalid email format"
   - Use field-specific messages for clarity

3. **Type Safety**
   - Validate types at input (boolean vs string, number vs string, etc.)
   - Prevent type mismatches before they reach backend
   - Example: `phone` field should NOT accept boolean `true`

4. **Real-time Feedback**
   - Show error immediately when validation fails
   - Clear error when user starts typing/interaction
   - Example: `onBlur={() => clearError('email')}` clears error on focus

5. **Visual Feedback**
   - Red border on invalid fields
   - Red text for error messages
   - Disabled submit button when form is invalid

6. **Accessibility**
   - All error messages MUST have `role="alert"`
   - All invalid inputs MUST have `aria-invalid="true"`
   - Error message MUST have `aria-describedby` linking to the input

7. **Required vs Optional Fields**
   - **Required:** Must have value AND pass validation
   - **Optional:** Can be empty, but if provided must pass validation
   - Example: Email is optional but if provided must be valid format

### Frontend Validation Pattern (React Components)

```tsx
// ErrorState interface for tracking field-specific errors
interface ErrorState {
  field1?: string
  field2?: string
  general?: string
}

// Validate form before submission
const validateForm = (): ErrorState => {
  const newErrors: ErrorState = {}

  // Validate required fields
  const firstNameError = validateFirstName(form.first_name)
  if (firstNameError) newErrors.first_name = firstNameError

  // Validate optional fields
  const emailError = validateEmail(form.email)
  if (emailError) newErrors.email = emailError

  return newErrors
}

// Clear error when user starts typing
const update = (field: keyof FormState, value: string | boolean) => {
  setForm((f) => ({ ...f, [field]: value }))
  setErrors((prev) => ({ ...prev, [field]: undefined })) // Clear error
}

// Clear error on blur (when focus leaves field)
const clearError = (field: keyof ErrorState) => {
  setErrors((prev) => ({ ...prev, [field]: undefined }))
}

// Submit button disabled when form has errors
<button
  type="submit"
  disabled={Object.keys(errors).length > 0 || isLoading}
  className="rounded-md bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-600 dark:hover:bg-blue-700"
>
  {isLoading ? 'Loading...' : 'Save'}
</button>
```

### Example Input with Validation

```tsx
<div>
  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
    Email
  </label>
  <input
    id="email"
    type="email"
    value={form.email}
    onChange={(e) => update('email', e.target.value)}
    onBlur={() => clearError('email')}
    className={`mt-1 w-full rounded-md border px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 ${
      errors.email ? 'border-red-500 bg-red-50 dark:border-red-400 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600'
    }`}
    placeholder="Enter email address"
  />
  {errors.email && (
    <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
      {errors.email}
    </p>
  )}
</div>
```

---

## 1. Database Layer Validation

### Add Check Constraints

For every string field that should have validation, add check constraints:

```sql
-- Example for phone field
ALTER TABLE table_name ADD CONSTRAINT chk_phone_not_empty_if_provided
    CHECK (phone IS NULL OR phone != '');

-- Example for phone to ensure numeric-only
ALTER TABLE table_name ADD CONSTRAINT chk_phone_numeric
    CHECK (phone IS NULL OR phone ~ '^[0-9+]+$');

-- Example for email format
ALTER TABLE table_name ADD CONSTRAINT chk_email_format
    CHECK (email IS NULL OR email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
```

**Rule:** String fields should always have `NULL` allowed but check constraints ensure non-empty if provided.

---

## 2. Backend Layer Validation

### Pydantic Models with Type Coercion and Custom Validators

#### Basic Pattern for all schemas:

```python
from typing import Optional, Any
from pydantic import BaseModel, field_validator
from datetime import datetime

class ModelNameCreate(BaseModel):
    model_config = {"coerce_numbers_to_str": True}  # MUST have for string fields

    id: str
    name: Optional[str] = None
    email: Optional[str] = None  # Use plain str - EmailStr validates automatically
    phone: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = False

    @field_validator('name')
    @classmethod
    def validate_name(cls, v: Any) -> Optional[str]:
        """Ensure name is converted to string if not None"""
        if v is None:
            return None
        if isinstance(v, bool):
            raise ValueError('Name cannot be a boolean')
        return str(v).strip()

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: Any) -> Optional[str]:
        """Ensure phone is converted to string and properly formatted"""
        if v is None:
            return None
        if isinstance(v, bool):
            raise ValueError('Phone cannot be a boolean')
        result = str(v).strip()
        # Remove non-numeric characters except +
        cleaned = result.replace(/[^\d+]/g, '')
        # Ensure valid format (at least 7 digits or starts with +)
        if cleaned.length < 7 and !cleaned.startswith('+'):
            raise ValueError(f'Invalid phone number: {result}')
        return cleaned

    @field_validator('email')
    @classmethod
    def validate_email(cls, v: Any) -> Optional[str]:
        """Ensure email is valid if provided"""
        if v is None:
            return None
        # EmailStr validates automatically in Pydantic v2
        # No need to call EmailStr.validate(v)
        return str(v).strip()
```

#### Update Pattern for Update Schemas:

```python
class ModelNameUpdate(BaseModel):
    model_config = {"coerce_numbers_to_str": True}  # MUST have for string fields

    name: Optional[str] = None
    email: Optional[str] = None  # Use plain str - EmailStr validates automatically
    phone: Optional[str] = None

    @field_validator('name')
    @classmethod
    def validate_name(cls, v: Any) -> Optional[str]:
        if v is None:
            return None
        if isinstance(v, bool):
            raise ValueError('Name cannot be a boolean')
        return str(v).strip()

    @field_validator('email')
    @classmethod
    def validate_email(cls, v: Any) -> Optional[str]:
        if v is None:
            return None
        # EmailStr validates automatically in Pydantic v2
        return str(v).strip()
```

**Rule:** All update schemas should NOT require `id` field - use path parameter for ID.

### Model Base Class Pattern

```python
from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class BaseModelName(BaseModel):
    model_config = {"coerce_numbers_to_str": True}  # MUST have for all string fields

    id: str
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @property
    def computed_property(self) -> str:
        """Example computed property"""
        return f"{self.name} - {self.email}"

    @staticmethod
    def _table() -> str:
        return "model_name"
```

---

## 3. Frontend Layer Validation

### Type Guards and Validators

```typescript
// Type guards for validating input types
export function ensureString(value: unknown, fieldName: string): string | null {
    if (value === null || value === undefined) {
        return null
    }
    if (typeof value === 'string') {
        const trimmed = value.trim()
        return trimmed === '' ? null : trimmed
    }
    if (typeof value === 'number') {
        return String(value)
    }
    if (typeof value === 'boolean') {
        throw new TypeError(`${fieldName} cannot be a boolean, received ${typeof value}`)
    }
    if (Array.isArray(value)) {
        throw new TypeError(`${fieldName} cannot be an array, received ${Array.isArray(value)}`)
    }
    if (typeof value === 'object') {
        throw new TypeError(`${fieldName} cannot be an object, received ${typeof value}`)
    }
    return String(value)
}

export function ensureEmail(value: unknown): string | null {
    if (value === null || value === undefined) {
        return null
    }
    const str = ensureString(value, 'email')
    if (!str) return null

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(str)) {
        throw new TypeError(`Invalid email format: ${str}`)
    }
    return str
}

export function ensurePhoneNumber(value: unknown): string | null {
    if (value === null || value === undefined) {
        return null
    }

    if (value === '') {
        return ''
    }

    const str = ensureString(value, 'phone')
    if (!str) return null

    const cleaned = str.replace(/[^\d+]/g, '')

    if (cleaned.length < 7 && !cleaned.startsWith('+')) {
        throw new TypeError(`Phone number ${str} is too short (must have at least 7 digits or start with +)`)
    }

    return cleaned
}
```

### Schema Validators

```typescript
export interface ModelNameCreate {
    id: string
    name: string
    email?: string | null
    phone?: string | null
    is_active?: boolean
}

export interface ModelNameUpdate {
    name?: string | null
    email?: string | null
    phone?: string | null
    is_active?: boolean
}

// Validate ModelNameCreate input
export function validateModelNameCreate(data: unknown): ModelNameCreate {
    if (typeof data !== 'object' || data === null) {
        throw new TypeError('ModelNameCreate must be an object')
    }

    const obj = data as Record<string, unknown>

    const validated: ModelNameCreate = {
        id: ensureString(obj.id, 'id')!,
        name: ensureString(obj.name, 'name')!,
        email: obj.email !== undefined ? ensureEmail(obj.email) : undefined,
        phone: obj.phone !== undefined ? ensurePhoneNumber(obj.phone) : undefined,
        is_active: obj.is_active === true || obj.is_active === false ? obj.is_active : false,
    }

    return validated
}

// Validate ModelNameUpdate input
export function validateModelNameUpdate(data: unknown): ModelNameUpdate {
    if (typeof data !== 'object' || data === null) {
        throw new TypeError('ModelNameUpdate must be an object')
    }

    const obj = data as Record<string, unknown>

    const validated: ModelNameUpdate = {
        name: obj.name !== undefined ? ensureString(obj.name, 'name') : undefined,
        email: obj.email !== undefined ? ensureEmail(obj.email) : undefined,
        phone: obj.phone !== undefined ? ensurePhoneNumber(obj.phone) : undefined,
        is_active: obj.is_active !== undefined ? obj.is_active : undefined,
    }

    return validated
}
```

---

## 11. Frontend Validation Testing Requirements

### Testing Frontend Validation Functions

Every validation function MUST be tested for:
1. **Happy Path:** Valid inputs return `null` (no error)
2. **Required Field Validation:** Empty values return appropriate error
3. **Type Validation:** Invalid types (boolean, array, object) return errors
4. **Format Validation:** Invalid formats (email, phone) return appropriate errors
5. **Length Validation:** Values too short/long return appropriate errors
6. **Optional Field Validation:** Empty values return `null` for optional fields
7. **Edge Cases:** Null, undefined, special characters

### Example Test Suite

```typescript
describe('validateEmail', () => {
  it('should return null for valid email', () => {
    expect(validateEmail('test@example.com')).toBeNull()
  })

  it('should return error for invalid email', () => {
    expect(validateEmail('invalid-email')).toBe('Invalid email format')
  })

  it('should return error for empty email', () => {
    expect(validateEmail('')).toBeNull() // Optional field
  })

  it('should return error for boolean', () => {
    expect(validateEmail(true)).toBe('Invalid email format')
  })
})

describe('validatePhoneNumber', () => {
  it('should return null for valid phone', () => {
    expect(validatePhoneNumber('+1234567890')).toBeNull()
  })

  it('should return error for phone with only digits (too short)', () => {
    expect(validatePhoneNumber('123')).toBe('Phone number must have at least 7 digits or start with +')
  })

  it('should return error for phone with non-digits only', () => {
    expect(validatePhoneNumber('abc')).toBe('Phone number must have at least 7 digits or start with +')
  })

  it('should return null for empty phone (optional field)', () => {
    expect(validatePhoneNumber('')).toBeNull()
  })
})

describe('validateContactCreateData', () => {
  it('should return array of errors for invalid data', () => {
    const result = validateContactCreateData({
      account_id: '',
      first_name: '',
      last_name: 'Valid'
    })

    expect(result).toBeInstanceOf(Array)
    expect(result.length).toBeGreaterThan(0)
    expect(result.some((e) => e.field === 'account_id')).toBe(true)
    expect(result.some((e) => e.field === 'first_name')).toBe(true)
  })

  it('should return null for valid data', () => {
    const result = validateContactCreateData({
      account_id: '123',
      first_name: 'John',
      last_name: 'Doe',
      email: 'test@example.com'
    })

    expect(result).toBeNull()
  })

  it('should include error message for each field', () => {
    const result = validateContactCreateData({
      account_id: '',
      first_name: '',
      last_name: ''
    })

    expect(result.length).toBe(3)
    expect(result[0].field).toBe('account_id')
    expect(result[0].message).toContain('is required')
  })
})
```

### Frontend Component Testing

```typescript
describe('ContactForm', () => {
  it('should show error for invalid submit', () => {
    render(<ContactForm />)
    // Type invalid data
    fireEvent.change(screen.getByLabelText(/account id/i), {
      target: { value: '' }
    })
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: '' }
    })
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: 'Valid' }
    })
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'invalid' }
    })
    fireEvent.change(screen.getByLabelText(/phone/i), {
      target: { value: '123' }
    })

    // Submit button should be disabled
    const submitButton = screen.getByRole('button', { name: /save/i })
    expect(submitButton).toBeDisabled()

    // Submit should not happen
    fireEvent.submit(screen.getByRole('form'))
    // Verify no API call was made
  })

  it('should show error message under invalid field', () => {
    render(<ContactForm />)
    fireEvent.change(screen.getByLabelText(/account id/i), {
      target: { value: '' }
    })
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'Valid' }
    })

    // Error message should appear
    expect(screen.getByText(/account id is required/i)).toBeInTheDocument()
  })

  it('should clear error when user starts typing', () => {
    render(<ContactForm />)
    fireEvent.change(screen.getByLabelText(/account id/i), {
      target: { value: '' }
    })
    expect(screen.getByText(/account id is required/i)).toBeInTheDocument()

    // Type in the field
    fireEvent.change(screen.getByLabelText(/account id/i), {
      target: { value: '123' }
    })

    // Error should clear
    expect(screen.queryByText(/account id is required/i)).not.toBeInTheDocument()
  })

  it('should disable submit button when form has errors', () => {
    render(<ContactForm />)
    const submitButton = screen.getByRole('button', { name: /save/i })

    // Initially disabled
    expect(submitButton).toBeDisabled()

    // After filling all required fields, enabled
    fireEvent.change(screen.getByLabelText(/account id/i), {
      target: { value: '123' }
    })
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'John' }
    })
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: 'Doe' }
    })

    expect(submitButton).toBeEnabled()
  })
})
```

---

## 4. Input Component Pattern

### React Input Components with Validation

```typescript
interface TextInputProps {
    label: string
    value: string
    onChange: (value: string) => void
    error?: string
    type?: 'text' | 'email' | 'tel' | 'number'
    required?: boolean
    placeholder?: string
}

export function TextInput({ label, value, onChange, error, type = 'text', required, placeholder }: TextInputProps) {
    const [localValue, setLocalValue] = React.useState<string>(value)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value
        setLocalValue(newValue)
        onChange(newValue)
    }

    const getDisplayValue = (): string => {
        return localValue || ''
    }

    return (
        <div className="form-group">
            <label htmlFor={label.toLowerCase()}>
                {label}
                {required && <span className="required">*</span>}
            </label>
            <input
                id={label.toLowerCase()}
                type={type}
                value={getDisplayValue()}
                onChange={handleChange}
                placeholder={placeholder}
                className={error ? 'error' : ''}
            />
            {error && <span className="error-message">{error}</span>}
        </div>
    )
}
```

### Input with Email Validation

```typescript
export function EmailInput({ value, onChange, error }: EmailInputProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value)
    }

    const validateEmail = (email: string): boolean => {
        if (!email) return true  // Empty is valid for optional field
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }

    const [isValid, setIsValid] = React.useState(() => validateEmail(value))

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value
        onChange(newValue)
        setIsValid(validateEmail(newValue))
    }

    return (
        <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
                id="email"
                type="email"
                value={value}
                onChange={handleChange}
                className={error || !isValid ? 'error' : ''}
            />
            {!isValid && <span className="error-message">Invalid email format</span>}
            {error && <span className="error-message">{error}</span>}
        </div>
    )
}
```

### Input with Phone Validation

```typescript
export function PhoneInput({ value, onChange, error }: PhoneInputProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value
        onChange(newValue)
    }

    const validatePhone = (phone: string): boolean => {
        if (!phone) return true  // Empty is valid for optional field
        const cleaned = phone.replace(/[^\d+]/g, '')
        if (cleaned.length < 7 && !cleaned.startsWith('+')) {
            return false
        }
        return true
    }

    const [isValid, setIsValid] = React.useState(() => validatePhone(value))

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value
        onChange(newValue)
        setIsValid(validatePhone(newValue))
    }

    const formatPhoneNumber = (phone: string): string => {
        if (!phone) return ''
        // Remove non-numeric except +
        const cleaned = phone.replace(/[^\d+]/g, '')

        // If starts with +, keep as is
        if (cleaned.startsWith('+')) {
            return cleaned
        }

        // Format US numbers
        if (cleaned.length > 10) {
            // International format: +XXX XXX-XXX-XXXX
            const area = cleaned.slice(0, 3)
            const prefix = cleaned.slice(3, 6)
            const line = cleaned.slice(6, 10)
            return `${cleaned.slice(0, 1)}${area} ${prefix}-${line}`
        } else if (cleaned.length === 10) {
            // US format: XXX-XXX-XXXX
            const area = cleaned.slice(0, 3)
            const prefix = cleaned.slice(3, 6)
            const line = cleaned.slice(6, 10)
            return `${area}-${prefix}-${line}`
        }

        return cleaned
    }

    return (
        <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
                id="phone"
                type="tel"
                value={formatPhoneNumber(value)}
                onChange={handleChange}
                placeholder="(XXX) XXX-XXXX"
                className={error || !isValid ? 'error' : ''}
            />
            {!isValid && <span className="error-message">Invalid phone number (must have at least 7 digits)</span>}
            {error && <span className="error-message">{error}</span>}
        </div>
    )
}
```

---

## 5. Common Validation Patterns

### String Fields (name, title, description, etc.)

```typescript
export function ensureString(value: unknown, fieldName: string): string | null {
    if (value === null || value === undefined) return null
    if (typeof value === 'string') return value.trim() || null
    if (typeof value === 'number') return String(value)
    if (typeof value === 'boolean') throw new TypeError(`${fieldName} cannot be a boolean`)
    return String(value)
}
```

### Boolean Fields (is_active, is_primary, is_deleted)

```python
class MyModel(BaseModel):
    model_config = {"coerce_numbers_to_str": True}

    is_active: bool = False
    is_primary: bool = False

    @field_validator('is_active')
    @classmethod
    def validate_boolean(cls, v: Any) -> bool:
        if isinstance(v, bool):
            return v
        if isinstance(v, (int, float)):
            return v == 1
        raise ValueError('is_active must be a boolean')
```

### Number Fields (age, count, etc.)

```python
class MyModel(BaseModel):
    model_config = {"coerce_numbers_to_str": True}

    age: Optional[int] = None

    @field_validator('age')
    @classmethod
    def validate_age(cls, v: Any) -> Optional[int]:
        if v is None:
            return None
        if isinstance(v, (int, float)):
            num = int(v)
            if num < 0:
                raise ValueError('Age cannot be negative')
            return num
        raise ValueError('Age must be a number')
```

### URL Fields (avatar_url, website_url)

```python
from pydantic import field_validator

class MyModel(BaseModel):
    model_config = {"coerce_numbers_to_str": True}

    website_url: Optional[str] = None

    @field_validator('website_url')
    @classmethod
    def validate_url(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == '':
            return None
        v = str(v).strip()
        if not (v.startswith('http://') or v.startswith('https://')):
            v = f'https://{v}'
        return v
```

---

## 6. Testing Requirements

### Backend Tests

```python
# Test type coercion
def test_phone_number_type_coercion():
    # Should work with int, float, and string
    contact = ContactCreate(phone=123)  # int
    assert contact.phone == "123"

    contact = ContactCreate(phone="123")  # string
    assert contact.phone == "123"

    # Should throw error with boolean
    with pytest.raises(ValidationError):
        ContactCreate(phone=True)
```

### Frontend Tests

```typescript
// Test type guards
describe('ensureString', () => {
    it('should convert number to string', () => {
        expect(ensureString(123, 'test')).toBe('123')
    })

    it('should trim and return string', () => {
        expect(ensureString('  hello  ', 'test')).toBe('hello')
    })

    it('should return null for empty string', () => {
        expect(ensureString('', 'test')).toBe(null)
    })

    it('should throw for boolean', () => {
        expect(() => ensureString(true, 'test')).toThrow()
    })
})
```

---

## 7. Quick Reference Checklist

For each new input field, ensure:

- [ ] Database: Check constraint or appropriate data type
- [ ] Backend Model: `coerce_numbers_to_str: True` in model_config
- [ ] Backend Schema: Custom validators for string fields
- [ ] Frontend Types: Type guards for all input types
- [ ] Frontend Input: Type attribute and validation
- [ ] Frontend: Format/validate on input or blur
- [ ] Tests: Type coercion tests

---

## 8. Why This Pattern Exists

1. **Type Safety**: JavaScript/TypeScript runtime values can be any type, but databases expect specific types
2. **Data Integrity**: Pydantic schemas validate input before it reaches the database
3. **User Experience**: Frontend validation provides immediate feedback
4. **Defense in Depth**: Errors caught at multiple layers are caught earlier and fail faster
5. **Consistency**: All developers follow the same patterns

---

## 9. Examples of Fields That Need Validation

- **Strings**: name, title, description, address, city, country
- **Email**: email, contact_email
- **Phone**: phone, mobile_phone, work_phone, fax
- **URL**: website, avatar_url, profile_picture
- **Numbers**: age, count, quantity, price (with decimal support)
- **Booleans**: is_active, is_verified, is_deleted

---

## 10. Required vs Optional Fields

### REQUIRED Fields (cannot be empty)

```python
class ModelCreate(BaseModel):
    model_config = {"coerce_numbers_to_str": True}
    
    account_id: str  # REQUIRED - Must have a valid value
    name: str        # REQUIRED - Must have a valid value
    email: str       # REQUIRED - Must have a valid value
    
    @field_validator('account_id')
    @classmethod
    def validate_account_id(cls, v: Any) -> str:
        """Ensure account_id is not empty"""
        if v is None:
            raise ValueError('account_id cannot be empty')
        if isinstance(v, bool):
            raise ValueError('account_id cannot be a boolean')
        result = str(v).strip()
        if not result:
            raise ValueError('account_id cannot be empty')
        return result
```

### OPTIONAL Fields (can be null or empty)

```python
class ModelUpdate(BaseModel):
    model_config = {"coerce_numbers_to_str": True}
    
    account_id: Optional[str] = None  # OPTIONAL - Can be empty
    name: Optional[str] = None        # OPTIONAL - Can be empty
    email: Optional[str] = None       # OPTIONAL - Can be empty
    
    @field_validator('account_id')
    @classmethod
    def validate_account_id(cls, v: Any) -> Optional[str]:
        """Ensure account_id is valid if provided"""
        if v is None:
            return None
        if isinstance(v, bool):
            raise ValueError('account_id cannot be a boolean')
        result = str(v).strip()
        if not result:
            return None  # Empty string is allowed for optional fields
        return result
```

### Database Constraints

```sql
-- For REQUIRED fields (not null, not empty)
ALTER TABLE table_name ADD CONSTRAINT chk_field_not_empty
    CHECK (field != '');

-- For OPTIONAL fields (null or non-empty)
ALTER TABLE table_name ADD CONSTRAINT chk_field_not_empty_if_provided
    CHECK (field IS NULL OR field != '');
```
- **Dates**: created_at, updated_at, birth_date (with range validation)
