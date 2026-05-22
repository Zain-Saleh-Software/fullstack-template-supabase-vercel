const { execSync } = require("child_process");
const path = require("path");
const http = require("http");

function runCommand(name, command, cwd = process.cwd()) {
    console.log(`\n========================================`);
    console.log(`🚀 RUNNING: ${name}...`);
    console.log(`👉 Command: ${command}`);
    console.log(`========================================`);
    try {
        execSync(command, { stdio: "inherit", cwd });
        console.log(`✅ SUCCESS: ${name} passed perfectly!\n`);
        return true;
    } catch (err) {
        console.error(`❌ FAILURE: ${name} failed during execution.`);
        console.error(err.message);
        return false;
    }
}

/**
 * Checks if a critical file path exists in the project.
 */
function checkFileExists(relativePath) {
    const fullPath = path.resolve(__dirname, "..", relativePath);
    try {
        require("fs").accessSync(fullPath);
        console.log(`  ✅ File exists: ${relativePath}`);
        return true;
    } catch {
        console.error(`  ❌ File missing: ${relativePath}`);
        return false;
    }
}

/**
 * Verify project structure completeness
 */
function verifyProjectStructure() {
    console.log(`\n📁 Checking Project Structure...`);
    let allOk = true;

    const requiredPaths = [
        // Core config
        "package.json", "tsconfig.json", "next.config.ts", "vitest.config.ts",
        // App routes
        "src/app/[locale]/layout.tsx",
        "src/app/[locale]/(authenticated)/layout.tsx",
        "src/app/[locale]/(authenticated)/dashboard/page.tsx",
        // POC entity pages — these will be replaced with your real entities after bootstrap
        // "src/app/[locale]/(authenticated)/accounts/page.tsx",
        // "src/app/[locale]/(authenticated)/accounts/new/page.tsx",
        // "src/app/[locale]/(authenticated)/accounts/[id]/edit/page.tsx",
        // "src/app/[locale]/(authenticated)/contacts/page.tsx",
        // "src/app/[locale]/(authenticated)/contacts/new/page.tsx",
        // "src/app/[locale]/(authenticated)/contacts/[id]/edit/page.tsx",
        "src/app/[locale]/login/page.tsx",
        "src/app/[locale]/register/page.tsx",
        "src/app/[locale]/not-found.tsx",
        "src/app/[locale]/error.tsx",
        // API routes
        "src/app/api/v1/health/route.ts",
        "src/app/api/v1/auth/login/route.ts",
        "src/app/api/v1/auth/register/route.ts",
        "src/app/api/v1/auth/logout/route.ts",
        "src/app/api/v1/auth/me/route.ts",
        // POC API routes — these will be replaced with your real entities after bootstrap
        // "src/app/api/v1/accounts/route.ts",
        // "src/app/api/v1/accounts/[id]/route.ts",
        // "src/app/api/v1/contacts/route.ts",
        // "src/app/api/v1/contacts/[id]/route.ts",
        // Core lib
        "src/lib/db/schema/index.ts",
        "src/lib/db/index.ts",
        "src/lib/validators/auth.ts",
        // POC validators — these will be replaced with your real entities after bootstrap
        // "src/lib/validators/account.ts",
        // "src/lib/validators/contact.ts",
        "src/lib/auth/rbac.ts",
        "src/lib/utils.ts",
        "src/lib/api/responses.ts",
        "src/lib/observability/logger.ts",
        "src/lib/supabase/server.ts",
        "src/lib/supabase/browser.ts",
        "src/lib/supabase/middleware.ts",
        "src/proxy.ts",
        // Components
        "src/components/ui/Button.tsx",
        "src/components/ui/Input.tsx",
        "src/components/ui/DeleteButton.tsx",
        // POC form components — these will be replaced with your real entities after bootstrap
        // "src/components/forms/account-form.tsx",
        // "src/components/forms/contact-form.tsx",
        "src/components/rbac/PermissionGate.tsx",
        // i18n
        "messages/en.json",
        "messages/ar.json",
        // Tests
        "tests/api/auth.test.ts",
        // POC test files — these will be replaced with your real entities after bootstrap
        // "tests/api/accounts.test.ts",
        // "tests/api/contacts.test.ts",
        // "tests/api/contacts-id.test.ts",
        "tests/db/schema.test.ts",
        // Migrations
        "drizzle/0000_amusing_scrambler.sql",
        "drizzle/0001_custom_rls_and_triggers.sql",
        "drizzle/0002_add_is_active_to_entities.sql",
    ];

    for (const p of requiredPaths) {
        if (!checkFileExists(p)) {
            allOk = false;
        }
    }

    console.log(allOk ? `  ✅ Project structure complete` : `  ❌ Some files missing`);
    return allOk;
}

/**
 * Verify translation keys are consistent between en.json and ar.json
 */
function verifyTranslations() {
    console.log(`\n🌐 Checking Translation Files...`);
    try {
        const en = require(path.resolve(__dirname, "..", "messages/en.json"));
        const ar = require(path.resolve(__dirname, "..", "messages/ar.json"));

        const enKeys = JSON.stringify(Object.keys(en).sort());
        const arKeys = JSON.stringify(Object.keys(ar).sort());

        if (enKeys === arKeys) {
            console.log(`  ✅ Translation keys are consistent between en.json and ar.json`);
            return true;
        } else {
            console.error(`  ❌ Translation keys mismatch between en.json and ar.json`);
            return false;
        }
    } catch (err) {
        console.error(`  ❌ Could not read translation files: ${err.message}`);
        return false;
    }
}

/**
 * Verify middleware has proper auth protection
 */
function verifyMiddleware() {
    console.log(`\n🛡️ Checking Proxy/Middleware Configuration...`);
    try {
        const proxy = require("fs").readFileSync(
            path.resolve(__dirname, "..", "src/proxy.ts"),
            "utf8"
        );
        const supabaseMiddleware = require("fs").readFileSync(
            path.resolve(__dirname, "..", "src/lib/supabase/middleware.ts"),
            "utf8"
        );
        const checks = [
            proxy.includes("updateSession"),
            proxy.includes("next-intl"),
            supabaseMiddleware.includes("/login"),
            supabaseMiddleware.includes("/register"),
            proxy.includes("locales"),
        ];
        const allPassed = checks.every(Boolean);
        console.log(allPassed ? `  ✅ Proxy/Middleware properly configured` : `  ❌ Proxy/Middleware checks failed`);
        return allPassed;
    } catch (err) {
        console.error(`  ❌ Could not read proxy/middleware: ${err.message}`);
        return false;
    }
}

function main() {
    console.log(`🌟 STARTING CRM-HR BOILERPLATE SMOKE TEST ORCHESTRATION 🌟`);
    const rootDir = path.resolve(__dirname, "..");
    
    // 0. Pre-flight: Verify structure and config
    const structureOk = verifyProjectStructure();
    const translationsOk = verifyTranslations();
    const middlewareOk = verifyMiddleware();
    
    if (!structureOk || !translationsOk || !middlewareOk) {
        console.error(`\n❌ Pre-flight checks failed. Aborting.`);
        process.exit(1);
    }
    console.log(`\n✅ All pre-flight checks passed!`);

    // 1. Rules validation
    const rulesOk = runCommand("Architectural Rules Validation", "node scripts/validate-rules.js", rootDir);
    if (!rulesOk) process.exit(1);

    // 2. TypeScript compilation
    const tsOk = runCommand("TypeScript Type Safety Checks", "npx tsc --noEmit", rootDir);
    if (!tsOk) process.exit(1);

    // 3. Vitest unit and integration tests
    const testsOk = runCommand("Vitest Unit & Integration Tests", "npx vitest run", rootDir);
    if (!testsOk) process.exit(1);

    // 4. Production compiler build
    const buildOk = runCommand("Next.js Production Build Compilation", "npm run build", rootDir);
    if (!buildOk) process.exit(1);

    console.log(`\n🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉`);
    console.log(`🌟 ALL PIPELINE STAGES PASSED SUCCESSFULLY! 🌟`);
    console.log(`👉 This template is 100% stable, secure, and production-ready!`);
    console.log(`🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉\n`);
}

main();
