import { describe, it, expect, vi } from 'vitest';
import { db } from '@/lib/db';

// Mock the database for testing
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

// Mock the Supabase client
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() => ({
        auth: {
            getUser: vi.fn().mockResolvedValue({
                data: { user: { id: 'test-user-id', email: 'test@example.com' } },
                error: null,
            }),
        },
    })),
}));

describe('GET /api/v1/accounts', () => {
    it('returns paginated list of accounts', async () => {
        // Arrange
        const mockAccounts = [
            {
                id: 'account-1',
                name: 'Test Account 1',
                accountType: 'customer',
                status: 'active',
                ownerId: 'test-user-id',
                isDeleted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: 'account-2',
                name: 'Test Account 2',
                accountType: 'partner',
                status: 'active',
                ownerId: 'test-user-id',
                isDeleted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];

        const selectChain = vi.fn();
        const fromFn = vi.fn();
        const whereFn = vi.fn();
        const orderByFn = vi.fn();
        const limitFn = vi.fn();
        const offsetFn = vi.fn();

        // First call: items query (no args)
        // Second call: count query (with object arg)
        selectChain.mockReturnValueOnce({
            from: fromFn.mockReturnValueOnce({
                where: whereFn.mockReturnValueOnce({
                    orderBy: orderByFn.mockReturnValueOnce({
                        limit: limitFn.mockReturnValueOnce({
                            offset: offsetFn.mockResolvedValueOnce(mockAccounts),
                        }),
                    }),
                }),
            }),
            // Second call: count query
        }).mockReturnValueOnce({
            from: fromFn.mockReturnValueOnce({
                where: whereFn.mockResolvedValueOnce([{ count: 2 }]),
            }),
        });

        vi.mocked(db.select).mockImplementation(selectChain);

        // Act
        const response = await import('@/app/api/v1/accounts/route');
        const result = await response.GET({
            nextUrl: {
                searchParams: {
                    get: () => null,
                },
            },
        } as any);

        // Assert
        expect(result.status).toBe(200);
        const json = await result.json();
        expect(json.data).toBeDefined();
        expect(json.total).toBeDefined();
    });

    it('applies pagination parameters correctly', async () => {
        // Arrange
        const mockRequest = {
            nextUrl: {
                searchParams: {
                    get: (key: string) => {
                        if (key === 'limit') return '10';
                        if (key === 'offset') return '20';
                        return null;
                    },
                },
            },
        };

        const selectChain = vi.fn();
        const fromFn = vi.fn();
        const whereFn = vi.fn();
        const orderByFn = vi.fn();
        const limitFn = vi.fn();
        const offsetFn = vi.fn();

        selectChain.mockReturnValueOnce({
            from: fromFn.mockReturnValueOnce({
                where: whereFn.mockReturnValueOnce({
                    orderBy: orderByFn.mockReturnValueOnce({
                        limit: limitFn.mockReturnValueOnce({
                            offset: offsetFn.mockResolvedValueOnce([]),
                        }),
                    }),
                }),
            }),
        }).mockReturnValueOnce({
            from: fromFn.mockReturnValueOnce({
                where: whereFn.mockResolvedValueOnce([{ count: 0 }]),
            }),
        });

        vi.mocked(db.select).mockImplementation(selectChain);

        // Act
        const response = await import('@/app/api/v1/accounts/route');
        const result = await response.GET(mockRequest as any);

        // Assert
        expect(result.status).toBe(200);
        expect(db.select).toHaveBeenCalled();
        expect(limitFn).toHaveBeenCalledWith(10);
        expect(offsetFn).toHaveBeenCalledWith(20);
    });
});

describe('POST /api/v1/accounts', () => {
    describe('with valid data', () => {
        it('creates a new account', async () => {
            // Arrange
            const mockAccountData = {
                name: 'New Account',
                accountType: 'customer',
                status: 'active',
            };

            const mockRequest = {
                json: vi.fn().mockResolvedValue(mockAccountData),
            };

            vi.mocked(db.insert).mockReturnValue({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([
                        { id: 'new-account-id', ...mockAccountData },
                    ]),
                }),
            } as any);

            // Act
            const response = await import('@/app/api/v1/accounts/route');
            const result = await response.POST(mockRequest as any);

            // Assert
            expect(result.status).toBe(201);
            const json = await result.json();
            expect(json.id).toBe('new-account-id');
            expect(json.name).toBe('New Account');
        });
    });

    describe('with invalid data', () => {
        it('returns 400 Bad Request for missing required fields', async () => {
            // Arrange
            const mockRequest = {
                json: vi.fn().mockResolvedValue({ name: '' }),
            };

            // Act
            const response = await import('@/app/api/v1/accounts/route');
            const result = await response.POST(mockRequest as any);

            // Assert
            expect(result.status).toBe(400);
            const json = await result.json();
            expect(json.error.code).toBe('VALIDATION_ERROR');
        });

        it('returns 400 Bad Request for invalid enum values', async () => {
            // Arrange
            const mockRequest = {
                json: vi.fn().mockResolvedValue({
                    name: 'Test',
                    accountType: 'invalid-type',
                }),
            };

            // Act
            const response = await import('@/app/api/v1/accounts/route');
            const result = await response.POST(mockRequest as any);

            // Assert
            expect(result.status).toBe(400);
            const json = await result.json();
            expect(json.error.code).toBe('VALIDATION_ERROR');
        });
    });
});

describe('PATCH /api/v1/accounts/[id]', () => {
    it('updates an existing account', async () => {
        // Arrange
        const mockUpdateData = { name: 'Updated Account' };
        const mockRequest = {
            json: vi.fn().mockResolvedValue(mockUpdateData),
        };

        vi.mocked(db.update).mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([
                        { id: 'account-1', name: 'Updated Account' },
                    ]),
                }),
            }),
        } as any);

        // Act
        const response = await import('@/app/api/v1/accounts/[id]/route');
        const result = await response.PATCH(mockRequest as any, { params: new Promise((resolve) => resolve({ id: 'account-1' })) });

        // Assert
        expect(result.status).toBe(200);
        const json = await result.json();
        expect(json.name).toBe('Updated Account');
    });

    it('returns 404 for non-existent account', async () => {
        // Arrange
        const mockRequest = {
            json: vi.fn().mockResolvedValue({ name: 'Updated' }),
        };

        vi.mocked(db.update).mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([]),
                }),
            }),
        } as any);

        // Act
        const response = await import('@/app/api/v1/accounts/[id]/route');
        const result = await response.PATCH(mockRequest as any, { params: new Promise((resolve) => resolve({ id: 'non-existent' })) });

        // Assert
        expect(result.status).toBe(404);
    });
});

describe('DELETE /api/v1/accounts/[id]', () => {
    it('soft deletes an account', async () => {
        // Arrange
        const mockRequest = {};

        vi.mocked(db.update).mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([
                        { id: 'account-1', isDeleted: true },
                    ]),
                }),
            }),
        } as any);

        // Act
        const response = await import('@/app/api/v1/accounts/[id]/route');
        const result = await response.DELETE(mockRequest as any, { params: new Promise((resolve) => resolve({ id: 'account-1' })) });

        // Assert
        expect(result.status).toBe(204);
    });

    it('does not hard delete the account', async () => {
        // Arrange
        const mockRequest = {};

        vi.mocked(db.update).mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([
                        { id: 'account-1', isDeleted: true },
                    ]),
                }),
            }),
        } as any);

        // Act
        const response = await import('@/app/api/v1/accounts/[id]/route');
        await response.DELETE(mockRequest as any, { params: new Promise((resolve) => resolve({ id: 'account-1' })) });

        // Assert - Verify db.delete was not called
        expect(db.delete).not.toHaveBeenCalled();
    });
});