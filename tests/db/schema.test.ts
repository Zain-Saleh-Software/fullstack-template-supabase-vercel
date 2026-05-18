import { describe, it, expect } from 'vitest';
import * as schema from '@/lib/db/schema';

type SchemaTables = {
    [K in keyof typeof schema]: (typeof schema)[K];
};

describe('Database Schema Validation', () => {
    describe('Table Structure', () => {
        it('exports all required tables', () => {
            expect(schema.users).toBeDefined();
            expect(schema.roles).toBeDefined();
            expect(schema.permissions).toBeDefined();
            expect(schema.accounts).toBeDefined();
            expect(schema.contacts).toBeDefined();
            expect(schema.events).toBeDefined();
            expect(schema.tableChanges).toBeDefined();
        });

        it('users table has required columns', () => {
            const columns = Object.keys(schema.users);
            expect(columns).toContain('id');
            expect(columns).toContain('email');
            expect(columns).toContain('fullName');
            expect(columns).toContain('avatarUrl');
            expect(columns).toContain('roleId');
            expect(columns).toContain('isSuperuser');
            expect(columns).toContain('isDeleted');
            expect(columns).toContain('createdAt');
            expect(columns).toContain('updatedAt');
        });

        it('roles table has required columns', () => {
            const columns = Object.keys(schema.roles);
            expect(columns).toContain('id');
            expect(columns).toContain('name');
            expect(columns).toContain('description');
            expect(columns).toContain('isDeleted');
            expect(columns).toContain('createdAt');
            expect(columns).toContain('updatedAt');
        });

        it('permissions table has required columns', () => {
            const columns = Object.keys(schema.permissions);
            expect(columns).toContain('id');
            expect(columns).toContain('roleId');
            expect(columns).toContain('action');
            expect(columns).toContain('resource');
            expect(columns).toContain('createdAt');
        });

        it('events table has required columns', () => {
            const columns = Object.keys(schema.events);
            expect(columns).toContain('id');
            expect(columns).toContain('eventType');
            expect(columns).toContain('entityType');
            expect(columns).toContain('entityId');
            expect(columns).toContain('actorId');
            expect(columns).toContain('metadata');
            expect(columns).toContain('severity');
            expect(columns).toContain('isDeleted');
            expect(columns).toContain('createdAt');
            expect(columns).toContain('updatedAt');
        });

        it('tableChanges table has required columns', () => {
            const columns = Object.keys(schema.tableChanges);
            expect(columns).toContain('id');
            expect(columns).toContain('tableName');
            expect(columns).toContain('operation');
            expect(columns).toContain('isDeleted');
            expect(columns).toContain('changedAt');
            expect(columns).toContain('createdAt');
            expect(columns).toContain('updatedAt');
        });
    });

    describe('Entity Standards Compliance', () => {
        const tableChecks: Array<{
            name: string;
            table: Record<string, unknown>;
            expectedAuditFields: string[];
        }> = [
                {
                    name: 'accounts',
                    table: schema.accounts as unknown as Record<string, unknown>,
                    expectedAuditFields: ['id', 'ownerId', 'isActive', 'isDeleted', 'deletedAt', 'createdAt', 'updatedAt'],
                },
                {
                    name: 'contacts',
                    table: schema.contacts as unknown as Record<string, unknown>,
                    expectedAuditFields: ['id', 'ownerId', 'isActive', 'isDeleted', 'deletedAt', 'createdAt', 'updatedAt'],
                },
                {
                    name: 'users',
                    table: schema.users as unknown as Record<string, unknown>,
                    expectedAuditFields: ['id', 'isActive', 'isDeleted', 'deletedAt', 'createdAt', 'updatedAt'],
                },
                {
                    name: 'roles',
                    table: schema.roles as unknown as Record<string, unknown>,
                    expectedAuditFields: ['id', 'isActive', 'isDeleted', 'deletedAt', 'createdAt', 'updatedAt'],
                },
                {
                    name: 'events',
                    table: schema.events as unknown as Record<string, unknown>,
                    expectedAuditFields: ['id', 'isActive', 'isDeleted', 'deletedAt', 'createdAt', 'updatedAt'],
                },
                {
                    name: 'tableChanges',
                    table: schema.tableChanges as unknown as Record<string, unknown>,
                    expectedAuditFields: ['id', 'isActive', 'isDeleted', 'deletedAt', 'createdAt', 'updatedAt'],
                },
            ];

        tableChecks.forEach(({ name, table, expectedAuditFields }) => {
            describe(`${name} table`, () => {
                it('has required fields', () => {
                    const columns = Object.keys(table);
                    expectedAuditFields.forEach((field) => {
                        expect(columns).toContain(field);
                    });
                });
            });
        });
    });

    describe('Foreign Key Relationships', () => {
        it('users table has foreign key to roles', () => {
            expect(schema.users.roleId).toBeDefined();
        });

        it('permissions table has foreign key to roles', () => {
            expect(schema.permissions.roleId).toBeDefined();
        });
    });
});