import { describe, it, expect, vi } from 'vitest';
import { db } from '@/lib/db';

// Mock the database
vi.mock('@/lib/db', () => ({
    db: {
        select: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
}));

// Mock the auth module
vi.mock('@/lib/auth/rbac', () => ({
    requirePermission: vi.fn().mockResolvedValue(undefined),
    hasPermission: vi.fn().mockResolvedValue(true),
}));

// Mock Supabase server client
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();
const mockGetUser = vi.fn();
const mockAuth = {
    signInWithPassword: mockSignInWithPassword,
    signUp: mockSignUp,
    signOut: mockSignOut,
    getUser: mockGetUser,
};

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() => ({
        auth: mockAuth,
    })),
}));

describe('POST /api/v1/auth/login', () => {
    it('returns 200 with user data on successful login', async () => {
        const mockUser = { id: 'test-user-id', email: 'test@example.com' };
        mockSignInWithPassword.mockResolvedValue({ data: { user: mockUser }, error: null });

        const mockRequest = {
            json: vi.fn().mockResolvedValue({ email: 'test@example.com', password: 'password123' }),
        };

        const response = await import('@/app/api/v1/auth/login/route');
        const result = await response.POST(mockRequest as any);

        expect(result.status).toBe(200);
        const json = await result.json();
        expect(json.user).toBeDefined();
        expect(json.user.email).toBe('test@example.com');
    });

    it('returns 401 for invalid credentials', async () => {
        mockSignInWithPassword.mockResolvedValue({ data: { user: null }, error: { message: 'Invalid credentials' } });

        const mockRequest = {
            json: vi.fn().mockResolvedValue({ email: 'test@example.com', password: 'wrong' }),
        };

        const response = await import('@/app/api/v1/auth/login/route');
        const result = await response.POST(mockRequest as any);

        expect(result.status).toBe(401);
        const json = await result.json();
        expect(json.error.code).toBe('AUTH_ERROR');
    });

    it('returns 400 for missing email', async () => {
        const mockRequest = {
            json: vi.fn().mockResolvedValue({ password: 'password123' }),
        };

        const response = await import('@/app/api/v1/auth/login/route');
        const result = await response.POST(mockRequest as any);

        expect(result.status).toBe(400);
        const json = await result.json();
        expect(json.error.code).toBe('VALIDATION_ERROR');
    });
});

describe('POST /api/v1/auth/register', () => {
    it('returns 201 on successful registration', async () => {
        const mockUser = { id: 'new-user-id', email: 'new@example.com' };
        mockSignUp.mockResolvedValue({ data: { user: mockUser }, error: null });

        const mockRequest = {
            json: vi.fn().mockResolvedValue({
                email: 'new@example.com',
                password: 'password123',
                fullName: 'New User',
            }),
        };

        const response = await import('@/app/api/v1/auth/register/route');
        const result = await response.POST(mockRequest as any);

        expect(result.status).toBe(201);
        const json = await result.json();
        expect(json.user).toBeDefined();
        expect(json.user.email).toBe('new@example.com');
    });

    it('returns 400 for duplicate email', async () => {
        mockSignUp.mockResolvedValue({ data: { user: null }, error: { message: 'User already registered' } });

        const mockRequest = {
            json: vi.fn().mockResolvedValue({
                email: 'existing@example.com',
                password: 'password123',
                fullName: 'Existing User',
            }),
        };

        const response = await import('@/app/api/v1/auth/register/route');
        const result = await response.POST(mockRequest as any);

        expect(result.status).toBe(400);
        const json = await result.json();
        expect(json.error.code).toBe('REGISTER_ERROR');
    });

    it('returns 400 for short password (< 8 chars)', async () => {
        const mockRequest = {
            json: vi.fn().mockResolvedValue({
                email: 'test@example.com',
                password: '1234567',
                fullName: 'Test User',
            }),
        };

        const response = await import('@/app/api/v1/auth/register/route');
        const result = await response.POST(mockRequest as any);

        expect(result.status).toBe(400);
        const json = await result.json();
        expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for missing fullName', async () => {
        const mockRequest = {
            json: vi.fn().mockResolvedValue({
                email: 'test@example.com',
                password: 'password123',
                fullName: '',
            }),
        };

        const response = await import('@/app/api/v1/auth/register/route');
        const result = await response.POST(mockRequest as any);

        expect(result.status).toBe(400);
        const json = await result.json();
        expect(json.error.code).toBe('VALIDATION_ERROR');
    });
});

describe('POST /api/v1/auth/logout', () => {
    it('returns 200 on successful logout', async () => {
        mockSignOut.mockResolvedValue({ error: null });

        const response = await import('@/app/api/v1/auth/logout/route');
        const result = await response.POST();

        expect(result.status).toBe(200);
        const json = await result.json();
        expect(json.success).toBe(true);
    });

    it('returns 500 on logout error', async () => {
        mockSignOut.mockResolvedValue({ error: { message: 'Logout failed' } });

        const response = await import('@/app/api/v1/auth/logout/route');
        const result = await response.POST();

        expect(result.status).toBe(500);
        const json = await result.json();
        expect(json.error.code).toBe('LOGOUT_ERROR');
    });
});

describe('GET /api/v1/auth/me', () => {
    it('returns user profile when authenticated', async () => {
        mockGetUser.mockResolvedValue({
            data: { user: { id: 'test-user-id', email: 'test@example.com' } },
            error: null,
        });

        const selectFn = vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
                leftJoin: vi.fn().mockReturnValue({
                    leftJoin: vi.fn().mockReturnValue({
                        where: vi.fn().mockResolvedValue([
                            {
                                id: 'test-user-id',
                                email: 'test@example.com',
                                fullName: 'Test User',
                                avatarUrl: null,
                                isSuperuser: true,
                                roleName: 'Admin',
                                action: '*',
                                resource: '*',
                            },
                        ]),
                    }),
                }),
            }),
        });

        vi.mocked(db.select).mockImplementation(selectFn as any);

        const response = await import('@/app/api/v1/auth/me/route');
        const result = await response.GET();

        expect(result.status).toBe(200);
        const json = await result.json();
        expect(json.user).toBeDefined();
        expect(json.user.isSuperuser).toBe(true);
        expect(json.user.permissions).toContain('*:*');
    });

    it('returns 401 when not authenticated', async () => {
        mockGetUser.mockResolvedValue({
            data: { user: null },
            error: { message: 'Unauthorized' },
        });

        const response = await import('@/app/api/v1/auth/me/route');
        const result = await response.GET();

        expect(result.status).toBe(401);
        const json = await result.json();
        expect(json.error.code).toBe('UNAUTHORIZED');
    });
});
