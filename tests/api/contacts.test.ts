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

describe('GET /api/v1/contacts', () => {
    it('returns paginated list of contacts', async () => {
        // Arrange
        const mockContacts = [
            {
                id: 'contact-1',
                firstName: 'Alice',
                lastName: 'Smith',
                email: 'alice@example.com',
                phone: '1234567890',
                jobTitle: 'Manager',
                accountId: 'account-1',
                isPrimary: true,
                ownerId: 'test-user-id',
                isDeleted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: 'contact-2',
                firstName: 'Bob',
                lastName: 'Jones',
                email: 'bob@example.com',
                phone: '0987654321',
                jobTitle: 'Developer',
                accountId: 'account-1',
                isPrimary: false,
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

        selectChain.mockReturnValueOnce({
            from: fromFn.mockReturnValueOnce({
                where: whereFn.mockReturnValueOnce({
                    orderBy: orderByFn.mockReturnValueOnce({
                        limit: limitFn.mockReturnValueOnce({
                            offset: offsetFn.mockResolvedValueOnce(mockContacts),
                        }),
                    }),
                }),
            }),
        }).mockReturnValueOnce({
            from: fromFn.mockReturnValueOnce({
                where: whereFn.mockResolvedValueOnce([{ count: 2 }]),
            }),
        });

        vi.mocked(db.select).mockImplementation(selectChain);

        // Act
        const response = await import('@/app/api/v1/contacts/route');
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
        expect(json.data[0].firstName).toBe('Alice');
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
        const response = await import('@/app/api/v1/contacts/route');
        const result = await response.GET(mockRequest as any);

        // Assert
        expect(result.status).toBe(200);
        expect(db.select).toHaveBeenCalled();
        expect(limitFn).toHaveBeenCalledWith(10);
        expect(offsetFn).toHaveBeenCalledWith(20);
    });
});

describe('POST /api/v1/contacts', () => {
    describe('with valid data', () => {
        it('creates a new contact', async () => {
            // Arrange
            const mockContactData = {
                firstName: 'Alice',
                lastName: 'Smith',
                email: 'alice@example.com',
                phone: '1234567890',
                jobTitle: 'Manager',
                accountId: '00000000-0000-0000-0000-000000000000', // valid UUID
                isPrimary: true,
            };

            const mockRequest = {
                json: vi.fn().mockResolvedValue(mockContactData),
            };

            vi.mocked(db.insert).mockReturnValue({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([
                        { id: 'new-contact-id', ...mockContactData },
                    ]),
                }),
            } as any);

            // Act
            const response = await import('@/app/api/v1/contacts/route');
            const result = await response.POST(mockRequest as any);

            // Assert
            expect(result.status).toBe(201);
            const json = await result.json();
            expect(json.id).toBe('new-contact-id');
            expect(json.firstName).toBe('Alice');
        });
    });

    describe('with invalid data', () => {
        it('returns 400 Bad Request for missing required fields', async () => {
            // Arrange
            const mockRequest = {
                json: vi.fn().mockResolvedValue({ firstName: '' }),
            };

            // Act
            const response = await import('@/app/api/v1/contacts/route');
            const result = await response.POST(mockRequest as any);

            // Assert
            expect(result.status).toBe(400);
            const json = await result.json();
            expect(json.error.code).toBe('VALIDATION_ERROR');
        });

        it('returns 400 Bad Request for invalid email format', async () => {
            // Arrange
            const mockRequest = {
                json: vi.fn().mockResolvedValue({
                    firstName: 'Alice',
                    lastName: 'Smith',
                    email: 'invalid-email',
                    accountId: '00000000-0000-0000-0000-000000000000',
                }),
            };

            // Act
            const response = await import('@/app/api/v1/contacts/route');
            const result = await response.POST(mockRequest as any);

            // Assert
            expect(result.status).toBe(400);
            const json = await result.json();
            expect(json.error.code).toBe('VALIDATION_ERROR');
        });
    });
});

describe('PATCH /api/v1/contacts/[id]', () => {
    it('updates an existing contact', async () => {
        // Arrange
        const mockUpdateData = { firstName: 'Alice Updated' };
        const mockRequest = {
            json: vi.fn().mockResolvedValue(mockUpdateData),
        };

        vi.mocked(db.update).mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([
                        { id: 'contact-1', firstName: 'Alice Updated' },
                    ]),
                }),
            }),
        } as any);

        // Act
        const response = await import('@/app/api/v1/contacts/[id]/route');
        const result = await response.PATCH(mockRequest as any, { params: new Promise((resolve) => resolve({ id: 'contact-1' })) });

        // Assert
        expect(result.status).toBe(200);
        const json = await result.json();
        expect(json.firstName).toBe('Alice Updated');
    });

    it('returns 404 for non-existent contact', async () => {
        // Arrange
        const mockRequest = {
            json: vi.fn().mockResolvedValue({ firstName: 'Updated' }),
        };

        vi.mocked(db.update).mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([]),
                }),
            }),
        } as any);

        // Act
        const response = await import('@/app/api/v1/contacts/[id]/route');
        const result = await response.PATCH(mockRequest as any, { params: new Promise((resolve) => resolve({ id: 'non-existent' })) });

        // Assert
        expect(result.status).toBe(404);
    });
});

describe('DELETE /api/v1/contacts/[id]', () => {
    it('soft deletes a contact', async () => {
        // Arrange
        const mockRequest = {};

        vi.mocked(db.update).mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([
                        { id: 'contact-1', isDeleted: true },
                    ]),
                }),
            }),
        } as any);

        // Act
        const response = await import('@/app/api/v1/contacts/[id]/route');
        const result = await response.DELETE(mockRequest as any, { params: new Promise((resolve) => resolve({ id: 'contact-1' })) });

        // Assert
        expect(result.status).toBe(204);
    });

    it('does not hard delete the contact', async () => {
        // Arrange
        const mockRequest = {};

        vi.mocked(db.update).mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([
                        { id: 'contact-1', isDeleted: true },
                    ]),
                }),
            }),
        } as any);

        // Act
        const response = await import('@/app/api/v1/contacts/[id]/route');
        await response.DELETE(mockRequest as any, { params: new Promise((resolve) => resolve({ id: 'contact-1' })) });

        // Assert - Verify db.delete was not called
        expect(db.delete).not.toHaveBeenCalled();
    });
});
