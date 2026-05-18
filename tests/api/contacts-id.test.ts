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

describe('PATCH /api/v1/contacts/[id]', () => {
    it('updates an existing contact', async () => {
        // Arrange
        const mockUpdateData = { firstName: 'Updated', lastName: 'Name' };
        const mockRequest = {
            json: vi.fn().mockResolvedValue(mockUpdateData),
        };

        vi.mocked(db.update).mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([
                        { id: 'contact-1', firstName: 'Updated', lastName: 'Name' },
                    ]),
                }),
            }),
        } as any);

        // Act
        const response = await import('@/app/api/v1/contacts/[id]/route');
        const result = await response.PATCH(mockRequest as any, {
            params: Promise.resolve({ id: 'contact-1' }),
        });

        // Assert
        expect(result.status).toBe(200);
        const json = await result.json();
        expect(json.firstName).toBe('Updated');
        expect(json.lastName).toBe('Name');
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
        const result = await response.PATCH(mockRequest as any, {
            params: Promise.resolve({ id: 'non-existent' }),
        });

        // Assert
        expect(result.status).toBe(404);
    });

    it('returns 400 for invalid data', async () => {
        // Arrange - empty firstName (required field)
        const mockRequest = {
            json: vi.fn().mockResolvedValue({ firstName: '' }),
        };

        // Act
        const response = await import('@/app/api/v1/contacts/[id]/route');
        const result = await response.PATCH(mockRequest as any, {
            params: Promise.resolve({ id: 'contact-1' }),
        });

        // Assert
        expect(result.status).toBe(400);
        const json = await result.json();
        expect(json.error.code).toBe('VALIDATION_ERROR');
    });
});

describe('DELETE /api/v1/contacts/[id]', () => {
    it('soft deletes a contact (returns 204)', async () => {
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
        const result = await response.DELETE(mockRequest as any, {
            params: Promise.resolve({ id: 'contact-1' }),
        });

        // Assert
        expect(result.status).toBe(204);
    });

    it('returns 404 when contact does not exist', async () => {
        // Arrange
        const mockRequest = {};

        vi.mocked(db.update).mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([]),
                }),
            }),
        } as any);

        // Act
        const response = await import('@/app/api/v1/contacts/[id]/route');
        const result = await response.DELETE(mockRequest as any, {
            params: Promise.resolve({ id: 'non-existent' }),
        });

        // Assert
        expect(result.status).toBe(404);
    });

    it('performs soft delete, not hard delete', async () => {
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
        await response.DELETE(mockRequest as any, {
            params: Promise.resolve({ id: 'contact-1' }),
        });

        // Assert - verify db.delete (hard delete) was never called
        expect(db.delete).not.toHaveBeenCalled();
        expect(db.update).toHaveBeenCalled();
    });
});
