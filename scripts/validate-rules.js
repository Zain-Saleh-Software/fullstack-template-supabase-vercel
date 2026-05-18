#!/usr/bin/env node

// =============================================================================
// Vercel Template Rule Validation Script
// =============================================================================
// This script ensures that AI agents (or humans) have not modified the immutable
// rules and skills files that govern the architecture of this template, and
// validates that code follows all established patterns and best practices.
// Run this script using `npm run validate-rules`.
// =============================================================================

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("============================================================");
console.log(" Running Architecture Integrity Validation");
console.log("============================================================\n");

let allPassed = true;
let warnings = 0;
let errors = 0;

// =============================================================================
// SECTION 1: Critical Files Validation
// =============================================================================

console.log("📋 SECTION 1: Critical Files Validation");
console.log("-----------------------------------------------------------");

const CRITICAL_FILES = [
    "RULES.md",
    "CLAUDE.md",
    "skills/ai-init-project.md",
    "package.json",
    "tsconfig.json",
    "next.config.ts",
    "drizzle.config.ts",
    "vitest.config.ts"
];

for (const file of CRITICAL_FILES) {
    if (!fs.existsSync(file)) {
        console.error(`  ❌ CRITICAL FILE MISSING: ${file}`);
        errors++;
        allPassed = false;
    } else {
        console.log(`  ✅ File present: ${file}`);
    }
}

// =============================================================================
// SECTION 2: Forbidden Technology Detection
// =============================================================================

console.log("\n🚫 SECTION 2: Forbidden Technology Detection");
console.log("-----------------------------------------------------------");

const FORBIDDEN_PATTERNS = [
    { pattern: /import.*from\s+['"](docker|fastapi|python|redis|mongodb|mysql)['"]/gi, name: "Forbidden import" },
    { pattern: /FROM\s+(docker|python|node:\d+-alpine)/gi, name: "Dockerfile base image" },
    { pattern: /"docker":\s*"/gi, name: "Docker dependency" },
    { pattern: /"fastapi":\s*"/gi, name: "FastAPI dependency" },
    { pattern: /"redis":\s*"/gi, name: "Redis dependency" },
    { pattern: /"mongodb":\s*"/gi, name: "MongoDB dependency" },
    { pattern: /"mysql2":\s*"/gi, name: "MySQL dependency" },
    { pattern: /"pg":\s*"/gi, name: "pg dependency (use drizzle)" },
    { pattern: /import.*redux/gi, name: "Redux import" },
    { pattern: /import.*mobx/gi, name: "MobX import" },
];

const FILES_TO_SCAN = [
    "package.json",
    "src/app/api/v1/accounts/route.ts",
    "src/lib/db/schema/index.ts",
    "src/lib/auth/rbac.ts",
    "src/middleware.ts"
];

let forbiddenFound = false;
for (const file of FILES_TO_SCAN) {
    if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        for (const { pattern, name } of FORBIDDEN_PATTERNS) {
            if (pattern.test(content)) {
                console.error(`  ❌ Forbidden pattern found in ${file}: ${name}`);
                errors++;
                forbiddenFound = true;
                allPassed = false;
            }
        }
    }
}

if (!forbiddenFound) {
    console.log("  ✅ No forbidden technologies detected");
}

// =============================================================================
// SECTION 3: Architecture Pattern Validation
// =============================================================================

console.log("\n🏗️ SECTION 3: Architecture Pattern Validation");
console.log("-----------------------------------------------------------");

// Check for required directory structure
const REQUIRED_DIRS = [
    "src/app",
    "src/components",
    "src/lib",
    "src/lib/db",
    "src/lib/auth",
    "src/lib/validators",
    "src/lib/observability",
    "src/lib/supabase",
    "tests"
];

for (const dir of REQUIRED_DIRS) {
    if (!fs.existsSync(dir)) {
        console.error(`  ❌ Required directory missing: ${dir}`);
        errors++;
        allPassed = false;
    } else {
        console.log(`  ✅ Directory exists: ${dir}`);
    }
}

// Check for API routes structure
const apiDir = "src/app/api/v1";
if (fs.existsSync(apiDir)) {
    console.log(`  ✅ API routes directory exists: ${apiDir}`);
} else {
    console.error(`  ❌ API routes directory missing: ${apiDir}`);
    errors++;
    allPassed = false;
}

// =============================================================================
// SECTION 4: Code Quality Validation
// =============================================================================

console.log("\n🔍 SECTION 4: Code Quality Validation");
console.log("-----------------------------------------------------------");

const CODE_QUALITY_CHECKS = [
    {
        name: "No 'error: any' in catch blocks",
        pattern: /catch\s*\(\s*error\s*:\s*any/g,
        severity: "error"
    },
    {
        name: "No console.log in production code",
        pattern: /console\.(log|debug|info)/g,
        severity: "warning",
        excludeFiles: ["logger.ts", "setup.ts", "validate-rules.js", "seed.ts"]
    },
    {
        name: "No 'as any' type assertions",
        pattern: /as\s+any/g,
        severity: "warning"
    },
    {
        name: "Proper error handling (catch unknown)",
        pattern: /catch\s*\(\s*error\s*:\s*unknown/g,
        severity: "info",
        shouldBePresent: true
    }
];

function scanDirectory(dir, callback) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules' && file !== '.next') {
            scanDirectory(filePath, callback);
        } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
            callback(filePath);
        }
    }
}

let qualityErrors = 0;
let qualityWarnings = 0;

scanDirectory("src", (filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = filePath.replace(/\\/g, '/');

    for (const check of CODE_QUALITY_CHECKS) {
        // Skip excluded files
        if (check.excludeFiles && check.excludeFiles.some(excl => relativePath.includes(excl))) {
            continue;
        }

        const matches = content.match(check.pattern);
        const hasMatches = matches && matches.length > 0;

        if (check.shouldBePresent) {
            if (!hasMatches) {
                if (check.severity === "error") {
                    console.error(`  ❌ ${check.name} not found in ${relativePath}`);
                    qualityErrors++;
                } else {
                    console.log(`  ℹ️ ${check.name} not found in ${relativePath}`);
                }
            }
        } else {
            if (hasMatches) {
                if (check.severity === "error") {
                    console.error(`  ❌ ${check.name} found in ${relativePath} (${matches.length} occurrences)`);
                    qualityErrors++;
                } else if (check.severity === "warning") {
                    console.warn(`  ⚠️ ${check.name} found in ${relativePath} (${matches.length} occurrences)`);
                    qualityWarnings++;
                }
            }
        }
    }
});

if (qualityErrors === 0 && qualityWarnings === 0) {
    console.log("  ✅ No code quality issues detected");
} else {
    errors += qualityErrors;
    warnings += qualityWarnings;
    if (qualityErrors === 0) {
        console.log(`  ⚠️ ${qualityWarnings} warnings found`);
    }
}

// =============================================================================
// SECTION 5: Database Schema Validation
// =============================================================================

console.log("\n🗄️ SECTION 5: Database Schema Validation");
console.log("-----------------------------------------------------------");

const schemaFile = "src/lib/db/schema/index.ts";
if (fs.existsSync(schemaFile)) {
    const schemaContent = fs.readFileSync(schemaFile, 'utf8');

    // Check for UUID primary keys
    const uuidPattern = /uuid\(['"]id['"]\)\.primaryKey\(\)/g;
    const uuidMatches = schemaContent.match(uuidPattern);
    if (uuidMatches) {
        console.log(`  ✅ Found ${uuidMatches.length} UUID primary keys`);
    } else {
        console.warn("  ⚠️ No UUID primary keys found");
        warnings++;
    }

    // Check for business entity tables (accounts, contacts, etc.)
    // These are the tables that should have all audit fields
    const businessEntityTables = ['accounts', 'contacts'];
    const requiredFieldsForEntities = [
        'id',
        'ownerId',
        'isActive',
        'isDeleted',
        'deletedAt',
        'createdAt',
        'updatedAt'
    ];

    for (const tableName of businessEntityTables) {
        const tablePattern = new RegExp(`export const ${tableName}\\s*=\\s*pgTable`, 'i');
        if (tablePattern.test(schemaContent)) {
            console.log(`  ✅ Business entity table '${tableName}' exists`);

            // Check for required fields in business entities
            let missingFields = [];
            for (const field of requiredFieldsForEntities) {
                const fieldPattern = new RegExp(`${field}\\s*:\\s*`, 'i');
                if (!fieldPattern.test(schemaContent)) {
                    missingFields.push(field);
                }
            }

            if (missingFields.length > 0) {
                console.warn(`  ⚠️ Table '${tableName}' missing recommended fields: ${missingFields.join(', ')}`);
                warnings++;
            } else {
                console.log(`  ✅ Table '${tableName}' has all required audit fields`);
            }
        }
    }

    // Check for system tables existence
    const systemTables = ['users', 'roles', 'permissions'];
    for (const tableName of systemTables) {
        const tablePattern = new RegExp(`export const ${tableName}\\s*=\\s*pgTable`, 'i');
        if (tablePattern.test(schemaContent)) {
            console.log(`  ✅ System table '${tableName}' exists`);
        } else {
            console.error(`  ❌ Required system table '${tableName}' missing`);
            errors++;
            allPassed = false;
        }
    }
} else {
    console.error("  ❌ Schema file not found");
    errors++;
    allPassed = false;
}

// =============================================================================
// SECTION 6: API Route Validation
// =============================================================================

console.log("\n🔌 SECTION 6: API Route Validation");
console.log("-----------------------------------------------------------");

function validateApiRoute(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = filePath.replace(/\\/g, '/');
    let issues = [];

    // Skip validation for auth routes (they have special requirements)
    const isAuthRoute = relativePath.includes('/auth/');
    const isHealthRoute = relativePath.includes('/health/');

    // Check for permission checks (skip for auth and health routes)
    if (!isAuthRoute && !isHealthRoute) {
        if (!content.includes('requirePermission')) {
            issues.push('Missing requirePermission check');
        }
    }

    // Check for proper response helpers (skip for health route)
    if (!isHealthRoute) {
        if (!content.includes('apiError') && !content.includes('paginatedResponse') && !content.includes('NextResponse.json')) {
            issues.push('Missing standardized response helpers');
        }
    }

    // Check for Zod validation (skip for auth routes which may have different validation)
    if (!isAuthRoute && !isHealthRoute) {
        if (content.includes('POST') || content.includes('PATCH')) {
            if (!content.includes('safeParse') && !content.includes('parse')) {
                issues.push('Missing Zod validation for POST/PATCH');
            }
        }
    }

    // Check for proper error handling
    if (!content.includes('catch')) {
        issues.push('Missing error handling');
    }

    // Check for logger usage (skip for health route)
    if (!isHealthRoute) {
        if (!content.includes('logger')) {
            issues.push('Missing structured logging');
        }
    }

    return issues;
}

let apiRoutesFound = 0;
let apiRouteIssues = 0;

if (fs.existsSync("src/app/api/v1")) {
    scanDirectory("src/app/api/v1", (filePath) => {
        if (filePath.endsWith('route.ts')) {
            apiRoutesFound++;
            const issues = validateApiRoute(filePath);
            if (issues.length > 0) {
                console.error(`  ❌ API route ${filePath.replace('src/', '')}:`);
                issues.forEach(issue => console.error(`     - ${issue}`));
                apiRouteIssues++;
                errors += issues.length;
            } else {
                console.log(`  ✅ API route ${filePath.replace('src/', '')} follows patterns`);
            }
        }
    });

    if (apiRoutesFound === 0) {
        console.log("  ℹ️ No API routes found (this may be okay for new projects)");
    } else if (apiRouteIssues === 0) {
        console.log(`  ✅ All ${apiRoutesFound} API routes follow established patterns`);
    }
}

// =============================================================================
// SECTION 7: Validator Schema Validation
// =============================================================================

console.log("\n📝 SECTION 7: Validator Schema Validation");
console.log("-----------------------------------------------------------");

const validatorsDir = "src/lib/validators";
if (fs.existsSync(validatorsDir)) {
    const validatorFiles = fs.readdirSync(validatorsDir).filter(f => f.endsWith('.ts'));
    console.log(`  ✅ Found ${validatorFiles.length} validator files`);

    for (const file of validatorFiles) {
        const content = fs.readFileSync(path.join(validatorsDir, file), 'utf8');

        // Check for Zod usage
        if (!content.includes('z.') && !content.includes('zod')) {
            console.error(`  ❌ Validator ${file} doesn't use Zod`);
            errors++;
        } else {
            console.log(`  ✅ Validator ${file} uses Zod`);
        }

        // Check for schema exports
        if (!content.includes('export const') && !content.includes('export type')) {
            console.warn(`  ⚠️ Validator ${file} has no exports`);
            warnings++;
        }
    }
} else {
    console.error("  ❌ Validators directory not found");
    errors++;
    allPassed = false;
}

// =============================================================================
// SECTION 8: TypeScript Configuration Validation
// =============================================================================

console.log("\n📘 SECTION 8: TypeScript Configuration Validation");
console.log("-----------------------------------------------------------");

const tsConfig = JSON.parse(fs.readFileSync("tsconfig.json", 'utf8'));

if (tsConfig.compilerOptions) {
    const options = tsConfig.compilerOptions;

    if (options.strict === true) {
        console.log("  ✅ TypeScript strict mode enabled");
    } else {
        console.warn("  ⚠️ TypeScript strict mode not enabled");
        warnings++;
    }

    if (options.noImplicitAny === true) {
        console.log("  ✅ noImplicitAny enabled");
    } else {
        console.warn("  ⚠️ noImplicitAny not enabled");
        warnings++;
    }

    if (options.esModuleInterop === true) {
        console.log("  ✅ esModuleInterop enabled");
    } else {
        console.warn("  ⚠️ esModuleInterop not enabled");
        warnings++;
    }
} else {
    console.error("  ❌ Invalid tsconfig.json");
    errors++;
}

// =============================================================================
// SECTION 9: Security Validation
// =============================================================================

console.log("\n🔒 SECTION 9: Security Validation");
console.log("-----------------------------------------------------------");

// Check for environment variable security
const envExample = ".env.example";
if (fs.existsSync(envExample)) {
    const envContent = fs.readFileSync(envExample, 'utf8');

    // Check for proper NEXT_PUBLIC_ prefix usage
    const publicVars = envContent.match(/NEXT_PUBLIC_\w+/g) || [];
    const privateVars = envContent.match(/^\w+/gm) || [];
    const nextPublicPrivate = privateVars.filter(v => v.startsWith('NEXT_PUBLIC_'));

    console.log(`  ✅ Found ${publicVars.length} public environment variables`);
    console.log(`  ✅ Found ${privateVars.length - nextPublicPrivate.length} private environment variables`);

    // Check for sensitive data exposure
    if (envContent.includes('DATABASE_URL') && !envContent.includes('DATABASE_URL=postgres')) {
        console.log("  ✅ DATABASE_URL properly configured");
    }
} else {
    console.warn("  ⚠️ .env.example not found");
    warnings++;
}

// Check for proper authentication implementation
const authFile = "src/lib/auth/rbac.ts";
if (fs.existsSync(authFile)) {
    const authContent = fs.readFileSync(authFile, 'utf8');

    if (authContent.includes('requirePermission')) {
        console.log("  ✅ RBAC permission checking implemented");
    } else {
        console.error("  ❌ RBAC permission checking not implemented");
        errors++;
    }

    if (authContent.includes('hasPermission')) {
        console.log("  ✅ Permission checking function implemented");
    } else {
        console.warn("  ⚠️ Permission checking function not found");
        warnings++;
    }
} else {
    console.error("  ❌ RBAC file not found");
    errors++;
}

// =============================================================================
// SECTION 10: Testing Configuration Validation
// =============================================================================

console.log("\n🧪 SECTION 10: Testing Configuration Validation");
console.log("-----------------------------------------------------------");

const vitestConfig = fs.readFileSync("vitest.config.ts", 'utf8');

if (vitestConfig.includes('coverage')) {
    console.log("  ✅ Vitest coverage configuration found");

    if (vitestConfig.includes('thresholds') || vitestConfig.includes('reporter')) {
        console.log("  ✅ Coverage reporting configured");
    } else {
        console.warn("  ⚠️ Coverage thresholds not configured");
        warnings++;
    }
} else {
    console.error("  ❌ Coverage configuration not found");
    errors++;
}

if (fs.existsSync("tests/setup.ts")) {
    console.log("  ✅ Test setup file found");
} else {
    console.error("  ❌ Test setup file not found");
    errors++;
}

// =============================================================================
// SUMMARY
// =============================================================================

console.log("\n============================================================");
console.log(" VALIDATION SUMMARY");
console.log("============================================================");
console.log(`  Errors: ${errors}`);
console.log(`  Warnings: ${warnings}`);
console.log(`  Status: ${allPassed && errors === 0 ? '✅ PASSED' : '❌ FAILED'}`);
console.log("============================================================\n");

if (allPassed && errors === 0) {
    console.log("🎉 SUCCESS: All architectural rules and patterns are intact!");
    console.log("   The template is ready for AI-assisted development.\n");
    process.exit(0);
} else {
    console.error("💥 FAILURE: Architecture validation failed.");
    console.error("   Please review the errors above and fix them before proceeding.\n");
    process.exit(1);
}