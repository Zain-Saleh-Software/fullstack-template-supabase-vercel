import {
    validateString,
    validateEmail,
    validatePhoneNumber,
    validateAccountId,
    validateContactCreateData,
    validateContactUpdateData,
} from '@/types/contact'
import { formatValidationErrors } from '@/types/contact'

describe('validateString', () => {
    it('should return null for valid string', () => {
        expect(validateString('hello world', 'test')).toBeNull()
    })

    it('should return null for empty string (optional)', () => {
        expect(validateString('', 'test', false)).toBeNull()
    })

    it('should return error for empty string (required)', () => {
        expect(validateString('', 'test', true)).toBe('test is required')
    })

    it('should trim whitespace', () => {
        expect(validateString('  hello  ', 'test')).toBeNull()
    })

    it('should return null for number (auto-converted to string)', () => {
        expect(validateString(123, 'test')).toBeNull()
    })

    it('should throw TypeError for boolean', () => {
        expect(() => validateString(true, 'test')).toThrow(TypeError)
    })

    it('should throw TypeError for arrays', () => {
        expect(() => validateString([1, 2, 3], 'test')).toThrow(TypeError)
    })

    it('should throw TypeError for objects', () => {
        expect(() => validateString({ test: 'value' }, 'test')).toThrow(TypeError)
    })
})

describe('validateEmail', () => {
    it('should return null for valid email', () => {
        expect(validateEmail('test@example.com')).toBeNull()
    })

    it('should return null for valid email with subdomain', () => {
        expect(validateEmail('user@sub.example.com')).toBeNull()
    })

    it('should return error for invalid email (missing @)', () => {
        expect(validateEmail('invalidemail')).toBe('Invalid email format')
    })

    it('should return error for invalid email (missing domain)', () => {
        expect(validateEmail('test@')).toBe('Invalid email format')
    })

    it('should return error for email with spaces', () => {
        expect(validateEmail('test@example com')).toBe('Invalid email format')
    })

    it('should return null for empty email (optional)', () => {
        expect(validateEmail('')).toBeNull()
    })

    it('should return null for undefined email', () => {
        expect(validateEmail(undefined)).toBeNull()
    })

    it('should return null for null email', () => {
        expect(validateEmail(null)).toBeNull()
    })

    it('should throw TypeError for boolean', () => {
        expect(() => validateEmail(true)).toThrow(TypeError)
    })

    it('should throw TypeError for array', () => {
        expect(() => validateEmail(['test@example.com'])).toThrow(TypeError)
    })
})

describe('validatePhoneNumber', () => {
    it('should return null for valid phone with + prefix', () => {
        expect(validatePhoneNumber('+1234567890')).toBeNull()
    })

    it('should return null for valid US phone (10 digits)', () => {
        expect(validatePhoneNumber('1234567890')).toBeNull()
    })

    it('should return null for valid international phone', () => {
        expect(validatePhoneNumber('+1-800-123-4567')).toBeNull()
    })

    it('should return error for phone with only digits (too short)', () => {
        expect(validatePhoneNumber('123')).toBe('Phone number must have at least 7 digits or start with +')
    })

    it('should return error for phone with non-numeric characters', () => {
        expect(validatePhoneNumber('abc')).toBe('Phone number must have at least 7 digits or start with +')
    })

    it('should return error for phone with letters and numbers', () => {
        expect(validatePhoneNumber('123abc')).toBe('Phone number must have at least 7 digits or start with +')
    })
})

describe('validateAccountId', () => {
    it('should return null for valid account ID', () => {
        expect(validateAccountId('12345')).toBeNull()
    })

    it('should return error for empty account ID', () => {
        expect(validateAccountId('')).toBe('Account ID is required')
    })

    it('should return error for whitespace only', () => {
        expect(validateAccountId('   ')).toBe('Account ID is required')
    })

    it('should return error for undefined', () => {
        expect(validateAccountId(undefined)).toBe('Account ID is required')
    })

    it('should return error for null', () => {
        expect(validateAccountId(null)).toBe('Account ID is required')
    })
})

describe('validateContactCreateData', () => {
    it('should return array of errors for invalid data', () => {
        const result = validateContactCreateData({
            account_id: '',
            first_name: '',
            last_name: '',
            email: 'invalid',
            phone: '123',
        })

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
        expect(result.some((e) => e.field === 'account_id')).toBe(true)
        expect(result.some((e) => e.field === 'first_name')).toBe(true)
        expect(result.some((e) => e.field === 'last_name')).toBe(true)
        expect(result.some((e) => e.field === 'email')).toBe(true)
        expect(result.some((e) => e.field === 'phone')).toBe(true)
    })

    it('should return null for valid data', () => {
        const result = validateContactCreateData({
            account_id: '123',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            phone: '+1234567890',
        })

        expect(result).toBeNull()
    })

    it('should include error message for each field', () => {
        const result = validateContactCreateData({
            account_id: '',
            first_name: '',
            last_name: '',
        })

        expect(result.length).toBe(3)
        expect(result[0].field).toBe('account_id')
        expect(result[0].message).toContain('is required')
        expect(result[1].field).toBe('first_name')
        expect(result[1].message).toContain('is required')
        expect(result[2].field).toBe('last_name')
        expect(result[2].message).toContain('is required')
    })

    it('should validate email format', () => {
        const result = validateContactCreateData({
            account_id: '123',
            first_name: 'John',
            last_name: 'Doe',
            email: 'invalid-email',
        })

        expect(result).not.toBeNull()
        const emailError = result?.find((e) => e.field === 'email')
        expect(emailError?.message).toBe('Invalid email format')
    })

    it('should validate phone format', () => {
        const result = validateContactCreateData({
            account_id: '123',
            first_name: 'John',
            last_name: 'Doe',
            phone: 'abc',
        })

        expect(result).not.toBeNull()
        const phoneError = result?.find((e) => e.field === 'phone')
        expect(phoneError?.message).toBe('Phone number must have at least 7 digits or start with +')
    })

    it('should validate optional fields are optional', () => {
        const result = validateContactCreateData({
            account_id: '123',
            first_name: 'John',
            last_name: 'Doe',
            email: '',
            phone: '',
        })

        expect(result).toBeNull()
    })

    it('should handle undefined for optional fields', () => {
        const result = validateContactCreateData({
            account_id: '123',
            first_name: 'John',
            last_name: 'Doe',
            email: undefined,
            phone: undefined,
        })

        expect(result).toBeNull()
    })

    it('should handle valid is_primary boolean', () => {
        const result = validateContactCreateData({
            account_id: '123',
            first_name: 'John',
            last_name: 'Doe',
            is_primary: true,
        })

        expect(result).toBeNull()
    })

    it('should handle invalid is_primary (not boolean)', () => {
        const result = validateContactCreateData({
            account_id: '123',
            first_name: 'John',
            last_name: 'Doe',
            is_primary: 'true' as any,
        })

        expect(result).not.toBeNull()
        const isPrimaryError = result?.find((e) => e.field === 'is_primary')
        expect(isPrimaryError?.message).toBe('Is primary must be a boolean')
    })

    it('should reject null for is_primary', () => {
        const result = validateContactCreateData({
            account_id: '123',
            first_name: 'John',
            last_name: 'Doe',
            is_primary: null as any,
        })

        expect(result).not.toBeNull()
        const isPrimaryError = result?.find((e) => e.field === 'is_primary')
        expect(isPrimaryError?.message).toBe('Is primary must be a boolean')
    })
})

describe('validateContactUpdateData', () => {
    it('should return array of errors for invalid data', () => {
        const result = validateContactUpdateData({
            email: 'invalid',
            phone: 'abc',
        })

        expect(result).toBeInstanceOf(Array)
        expect(result.length).toBeGreaterThan(0)
        expect(result.some((e) => e.field === 'email')).toBe(true)
        expect(result.some((e) => e.field === 'phone')).toBe(true)
    })

    it('should return null for valid data (all optional)', () => {
        const result = validateContactUpdateData({
            email: 'john@example.com',
            phone: '+1234567890',
        })

        expect(result).toBeNull()
    })

    it('should handle empty object (all optional)', () => {
        const result = validateContactUpdateData({})

        expect(result).toBeNull()
    })

    it('should validate email format in update', () => {
        const result = validateContactUpdateData({
            email: 'invalid-email',
        })

        expect(result).not.toBeNull()
        const emailError = result?.find((e) => e.field === 'email')
        expect(emailError?.message).toBe('Invalid email format')
    })

    it('should validate phone format in update', () => {
        const result = validateContactUpdateData({
            phone: 'abc',
        })

        expect(result).not.toBeNull()
        const phoneError = result?.find((e) => e.field === 'phone')
        expect(phoneError?.message).toBe('Phone number must have at least 7 digits or start with +')
    })

    it('should handle undefined for all optional fields', () => {
        const result = validateContactUpdateData({
            email: undefined,
            phone: undefined,
        })

        expect(result).toBeNull()
    })
})

describe('formatValidationErrors', () => {
    it('should format array of errors into string', () => {
        const errors = [
            { field: 'email', message: 'Invalid email format' },
            { field: 'phone', message: 'Phone number must have at least 7 digits' },
        ]
        const result = formatValidationErrors(errors)
        expect(result).toBe('email: Invalid email format\nphone: Phone number must have at least 7 digits')
    })

    it('should return empty string for empty array', () => {
        const result = formatValidationErrors([])
        expect(result).toBe('')
    })
})
