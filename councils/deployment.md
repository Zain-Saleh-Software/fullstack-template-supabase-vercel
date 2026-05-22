# Deployment Council

**Role:** Guardian of Deployment Compatibility and Production Readiness
**Authority:** Can reject changes that break deployment or violate platform constraints
**Priority:** #3 (High - Deployment is critical for delivery)

## Mission

Ensure that every code change is compatible with Vercel deployment, works correctly with Supabase, and maintains production readiness. The goal is smooth, reliable deployments without surprises.

## Focus Areas

### 1. Vercel Compatibility
- **Serverless Functions:** Verify API routes work within Vercel's serverless constraints
- **Build Process:** Ensure the application builds successfully with `npm run build`
- **Environment Variables:** Confirm all required environment variables are documented
- **Bundle Size:** Check that bundle sizes remain reasonable for serverless
- **Edge Runtime:** Verify edge runtime usage is appropriate if used

### 2. Supabase Integration
- **Database Migrations:** Ensure migrations are properly generated and can be applied
- **Connection Pooling:** Verify `DATABASE_URL` points to Supabase pooler (port 6543)
- **RLS Policies:** Confirm RLS policies are properly configured
- **Auth Integration:** Ensure Supabase Auth is correctly integrated
- **Storage:** Verify storage buckets are properly configured if used

### 3. Environment Configuration
- **Environment Variables:** Document all required environment variables
- **Environment Parity:** Ensure local development mirrors production
- **Secrets Management:** Verify secrets are properly managed (not in code)
- **Configuration Files:** Ensure configuration files are correct

### 4. Build & Deployment Process
- **Build Success:** Verify `npm run build` completes without errors
- **Type Checking:** Ensure TypeScript compilation succeeds
- **Asset Optimization:** Check that assets are properly optimized
- **CI/CD Integration:** Verify CI/CD pipeline configuration

### 5. Production Readiness
- **Error Monitoring:** Ensure Sentry is properly configured
- **Logging:** Verify structured logging is implemented
- **Performance:** Check that performance is acceptable
- **Scalability:** Ensure the application can scale on Vercel

## Review Checklist

Before approving any change, ask:

### Vercel Compatibility Questions
- [ ] Does the application build successfully (`npm run build`)?
- [ ] Are API routes compatible with serverless functions?
- [ ] Are environment variables properly documented?
- [ ] Is the bundle size reasonable?
- [ ] Are there any Vercel-specific configurations needed?

### Supabase Integration Questions
- [ ] Are database migrations properly generated?
- [ ] Is the connection string configured correctly?
- [ ] Are RLS policies properly configured?
- [ ] Is Supabase Auth correctly integrated?
- [ ] Are there any Supabase-specific constraints to consider?

### Environment Questions
- [ ] Are all required environment variables documented?
- [ ] Is the `.env.example` file up to date?
- [ ] Are secrets properly managed (not in code)?
- [ ] Does local development mirror production?
- [ ] Are environment-specific configurations correct?

### Build & Deployment Questions
- [ ] Does `npm run build` complete without errors?
- [ ] Does TypeScript compilation succeed?
- [ ] Are assets properly optimized?
- [ ] Is the CI/CD pipeline configured correctly?
- [ ] Are deployment instructions clear?

### Production Readiness Questions
- [ ] Is error monitoring (Sentry) configured?
- [ ] Is structured logging implemented?
- [ ] Is performance acceptable?
- [ ] Can the application scale on Vercel?
- [ ] Are there any production-specific concerns?

## Rejection Criteria

Reject changes that:

- ❌ Break the build process
- ❌ Are incompatible with Vercel serverless functions
- ❌ Missing required environment variable documentation
- ❌ Break Supabase integration
- ❌ Introduce performance regressions
- ❌ Lack proper error monitoring
- ❌ Missing database migrations
- ❌ Break CI/CD pipeline
- ❌ Expose secrets in code or logs
- ❌ Violate Vercel or Supabase constraints

## Deployment Environments

### Local Development
- Uses local Supabase instance (`npx supabase start`)
- Environment variables in `.env.local`
- Hot reload enabled
- Verbose logging

### Staging (Preview Deployments)
- Vercel preview deployments
- Connected to staging Supabase project
- Environment variables from Vercel
- Production-like configuration

### Production
- Vercel production deployment
- Connected to production Supabase project
- Optimized build
- Error monitoring enabled
- Minimal logging

## Approval Process

1. **Build Verification:** Run `npm run build` and verify success
2. **Environment Check:** Verify environment configuration
3. **Integration Test:** Test Supabase integration
4. **Deployment Test:** Verify deployment would succeed
5. **Decision:** Approve, request changes, or reject
6. **Documentation:** Document deployment decisions and rationale

## Escalation

Deployment considerations in context:
- **Security Council:** Security issues must be fixed before deployment
- **Architect Council:** Architectural decisions shouldn't break deployment
- **Quality Council:** Quality issues should be addressed before deployment

## Environment Variables

### Required Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.your-project.supabase.co:6543/postgres

# Application
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Optional Variables
```bash
# Monitoring
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=your-token

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

## Deployment Checklist

### Pre-Deployment
- [ ] All tests pass
- [ ] Build succeeds
- [ ] Linting passes
- [ ] Environment variables documented
- [ ] Database migrations ready
- [ ] Security review completed

### Deployment
- [ ] Push to main branch
- [ ] Vercel automatically deploys
- [ ] Monitor build logs
- [ ] Verify deployment success
- [ ] Test production deployment

### Post-Deployment
- [ ] Smoke tests pass
- [ ] Error monitoring active
- [ ] Performance acceptable
- [ ] Database migrations applied
- [ ] RLS policies verified

## Examples

### ✅ Good Deployment Configuration
```typescript
// vercel.json - Proper configuration
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

```bash
# .env.example - Complete documentation
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.your-project.supabase.co:6543/postgres

# Application
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### ❌ Bad Deployment Configuration
```bash
# Missing required variables
NEXT_PUBLIC_SUPABASE_URL=
DATABASE_URL=localhost:5432/mydb  # Wrong port, not using pooler
```

## Contact

For deployment questions or concerns, refer to:
- `RULES.md` - Deployment rules and requirements
- `CLAUDE.md` - Deployment checklists and guidelines
- `skills/environment.md` - Environment variable management
- `skills/observability.md` - Sentry and monitoring configuration
- `councils/observability.md` - Observability review checklist
- Vercel Documentation - Platform-specific guidance
- Supabase Documentation - Database and auth guidance

## Emergency Rollback

If a deployment causes issues:
1. **Identify:** Determine the nature and severity of the issue
2. **Rollback:** Use Vercel's rollback feature to revert to previous deployment
3. **Fix:** Address the root cause in a new commit
4. **Test:** Thoroughly test the fix before redeploying
5. **Deploy:** Deploy the fixed version
6. **Review:** Conduct a post-mortem to prevent future issues