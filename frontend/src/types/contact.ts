export interface Contact {
    id: string
    account_id: string
    first_name: string
    last_name: string
    full_name: string
    email: string | null
    phone: string | null
    mobile_phone: string | null
    mobile_phone_2: string | null
    job_title: string | null
    department: string | null
    is_primary: boolean
    owner_id: string | null
    is_deleted: boolean
    metadata: Record<string, unknown> | null
    created_at: string | null
    updated_at: string | null
}

export interface ContactCreate {
    account_id: string
    first_name: string
    last_name: string
    email?: string | null
    phone?: string | null
    mobile_phone?: string | null
    mobile_phone_2?: string | null
    job_title?: string | null
    department?: string | null
    is_primary?: boolean
    owner_id?: string | null
}

export interface ContactUpdate {
    first_name?: string | null
    last_name?: string | null
    email?: string | null
    phone?: string | null
    mobile_phone?: string | null
    mobile_phone_2?: string | null
    job_title?: string | null
    department?: string | null
    is_primary?: boolean
    owner_id?: string | null
}

// Validation error interface
export interface ValidationError {
    field: string
    message: string
}

/**
 * Validates a string field - returns error message if invalid
 */
export function validateString(
    value: unknown,
    fieldName: string,
    required: boolean = true,
    minLength: number = 0,
    maxLength: number = 500,
): string | null {
    // Handle null/undefined
    if (value === null || value === undefined) {
        return required ? `${fieldName} is required` : null
    }

    // Handle boolean (reject for string field)
    if (typeof value === 'boolean') {
        throw new TypeError(`${fieldName} cannot be a boolean`)
    }

    // Handle array (reject)
    if (Array.isArray(value)) {
        throw new TypeError(`${fieldName} cannot be an array`)
    }

    // Handle object (reject)
    if (typeof value === 'object' && value !== null) {
        throw new TypeError(`${fieldName} cannot be an object`)
    }

    // Convert to string
    const strValue = String(value).trim()

    // Check required
    if (required && strValue === '') {
        return `${fieldName} is required`
    }

    // Check empty if optional
    if (!required && strValue === '') {
        return null
    }

    // Check minimum length
    if (minLength > 0 && strValue.length < minLength) {
        return `${fieldName} must be at least ${minLength} characters`
    }

    // Check maximum length
    if (maxLength > 0 && strValue.length > maxLength) {
        return `${fieldName} must not exceed ${maxLength} characters`
    }

    return null
}

/**
 * Validates email field - returns error message if invalid
 */
export function validateEmail(value: unknown): string | null {
    // Handle null/undefined
    if (value === null || value === undefined) {
        return null
    }

    // Handle boolean (reject for string field)
    if (typeof value === 'boolean') {
        throw new TypeError('Email cannot be a boolean')
    }

    // Handle array (reject)
    if (Array.isArray(value)) {
        throw new TypeError('Email cannot be an array')
    }

    // Convert to string and trim
    const strValue = String(value).trim()

    // Allow empty string (user might want to clear it)
    if (strValue === '') {
        return null
    }

    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(strValue)) {
        return 'Invalid email format'
    }

    return null
}

/**
 * Validates phone number - returns error message if invalid
 */
export function validatePhoneNumber(value: unknown): string | null {
    // Handle null/undefined
    if (value === null || value === undefined) {
        return null
    }

    // Handle boolean (reject for string field)
    if (typeof value === 'boolean') {
        throw new TypeError('Phone cannot be a boolean')
    }

    // Handle array (reject)
    if (Array.isArray(value)) {
        throw new TypeError('Phone cannot be an array')
    }

    // Convert to string and trim
    const strValue = String(value).trim()

    // Allow empty string (user might want to clear it)
    if (strValue === '') {
        return null
    }

    // Remove non-numeric characters except +
    const cleaned = strValue.replace(/[^\d+]/g, '')

    // Check if it's a valid format (at least 7 digits or starts with +)
    if (cleaned.length < 7 && !cleaned.startsWith('+')) {
        return 'Phone number must have at least 7 digits or start with +'
    }

    return null
}

/**
 * Validates account_id field - returns error message if invalid
 */
export function validateAccountId(value: unknown): string | null {
    return validateString(value, 'Account ID', true, 1, 100)
}

/**
 * Validates contact creation data - returns array of validation errors or null
 */
export function validateContactCreateData(data: unknown): ValidationError[] | null {
    if (typeof data !== 'object' || data === null) {
        return [{ field: 'general', message: 'Invalid contact data' }]
    }

    const errors: ValidationError[] = []

    const obj = data as Record<string, unknown>

    // Validate required fields with try-catch for type safety
    try {
        const accountError = validateAccountId(obj.account_id)
        if (accountError) {
            errors.push({ field: 'account_id', message: accountError })
        }
    } catch (e) {
        errors.push({ field: 'account_id', message: (e as Error).message })
    }

    try {
        const firstNameError = validateString(obj.first_name, 'First name', true, 1, 100)
        if (firstNameError) {
            errors.push({ field: 'first_name', message: firstNameError })
        }
    } catch (e) {
        errors.push({ field: 'first_name', message: (e as Error).message })
    }

    try {
        const lastNameError = validateString(obj.last_name, 'Last name', true, 1, 100)
        if (lastNameError) {
            errors.push({ field: 'last_name', message: lastNameError })
        }
    } catch (e) {
        errors.push({ field: 'last_name', message: (e as Error).message })
    }

    // Validate optional fields with try-catch for type safety
    try {
        const emailError = validateEmail(obj.email)
        if (emailError) {
            errors.push({ field: 'email', message: emailError })
        }
    } catch (e) {
        errors.push({ field: 'email', message: (e as Error).message })
    }

    try {
        const phoneError = validatePhoneNumber(obj.phone)
        if (phoneError) {
            errors.push({ field: 'phone', message: phoneError })
        }
    } catch (e) {
        errors.push({ field: 'phone', message: (e as Error).message })
    }

    try {
        const mobilePhoneError = validatePhoneNumber(obj.mobile_phone)
        if (mobilePhoneError) {
            errors.push({ field: 'mobile_phone', message: mobilePhoneError })
        }
    } catch (e) {
        errors.push({ field: 'mobile_phone', message: (e as Error).message })
    }

    try {
        const mobilePhone2Error = validatePhoneNumber(obj.mobile_phone_2)
        if (mobilePhone2Error) {
            errors.push({ field: 'mobile_phone_2', message: mobilePhone2Error })
        }
    } catch (e) {
        errors.push({ field: 'mobile_phone_2', message: (e as Error).message })
    }

    try {
        const jobTitleError = validateString(obj.job_title, 'Job title', false, 0, 200)
        if (jobTitleError) {
            errors.push({ field: 'job_title', message: jobTitleError })
        }
    } catch (e) {
        errors.push({ field: 'job_title', message: (e as Error).message })
    }

    try {
        const departmentError = validateString(obj.department, 'Department', false, 0, 100)
        if (departmentError) {
            errors.push({ field: 'department', message: departmentError })
        }
    } catch (e) {
        errors.push({ field: 'department', message: (e as Error).message })
    }

    // Validate boolean field (must be boolean or undefined)
    if (obj.is_primary !== undefined && typeof obj.is_primary !== 'boolean') {
        errors.push({ field: 'is_primary', message: 'Is primary must be a boolean' })
    }

    try {
        const ownerIdError = validateString(obj.owner_id, 'Owner ID', false, 1, 100)
        if (ownerIdError) {
            errors.push({ field: 'owner_id', message: ownerIdError })
        }
    } catch (e) {
        errors.push({ field: 'owner_id', message: (e as Error).message })
    }

    return errors.length > 0 ? errors : null
}

/**
 * Validates contact update data - returns array of validation errors or null
 */
export function validateContactUpdateData(data: unknown): ValidationError[] | null {
    if (typeof data !== 'object' || data === null) {
        return [{ field: 'general', message: 'Invalid contact data' }]
    }

    const errors: ValidationError[] = []

    const obj = data as Record<string, unknown>

    // Validate optional fields (same as create but without required checks)
    try {
        const emailError = validateEmail(obj.email)
        if (emailError) {
            errors.push({ field: 'email', message: emailError })
        }
    } catch (e) {
        errors.push({ field: 'email', message: (e as Error).message })
    }

    try {
        const phoneError = validatePhoneNumber(obj.phone)
        if (phoneError) {
            errors.push({ field: 'phone', message: phoneError })
        }
    } catch (e) {
        errors.push({ field: 'phone', message: (e as Error).message })
    }

    try {
        const mobilePhoneError = validatePhoneNumber(obj.mobile_phone)
        if (mobilePhoneError) {
            errors.push({ field: 'mobile_phone', message: mobilePhoneError })
        }
    } catch (e) {
        errors.push({ field: 'mobile_phone', message: (e as Error).message })
    }

    try {
        const mobilePhone2Error = validatePhoneNumber(obj.mobile_phone_2)
        if (mobilePhone2Error) {
            errors.push({ field: 'mobile_phone_2', message: mobilePhone2Error })
        }
    } catch (e) {
        errors.push({ field: 'mobile_phone_2', message: (e as Error).message })
    }

    try {
        const jobTitleError = validateString(obj.job_title, 'Job title', false, 0, 200)
        if (jobTitleError) {
            errors.push({ field: 'job_title', message: jobTitleError })
        }
    } catch (e) {
        errors.push({ field: 'job_title', message: (e as Error).message })
    }

    try {
        const departmentError = validateString(obj.department, 'Department', false, 0, 100)
        if (departmentError) {
            errors.push({ field: 'department', message: departmentError })
        }
    } catch (e) {
        errors.push({ field: 'department', message: (e as Error).message })
    }

    // Validate boolean fields
    if (obj.is_primary !== undefined && typeof obj.is_primary !== 'boolean') {
        errors.push({ field: 'is_primary', message: 'Is primary must be a boolean' })
    }

    try {
        const ownerIdError = validateString(obj.owner_id, 'Owner ID', false, 1, 100)
        if (ownerIdError) {
            errors.push({ field: 'owner_id', message: ownerIdError })
        }
    } catch (e) {
        errors.push({ field: 'owner_id', message: (e as Error).message })
    }

    return errors.length > 0 ? errors : null
}

/**
 * Formats validation errors into a user-friendly message
 */
export function formatValidationErrors(errors: ValidationError[]): string {
    return errors.map((error) => `${error.field}: ${error.message}`).join('\n')
}
