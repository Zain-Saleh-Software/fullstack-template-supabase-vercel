# Authentication (AuthN) — OWASP-Compliant

> **Source of Truth:** This skill defines ALL authentication rules for the template.
> **Compliance:** Mandatory for every PR, commit, and deployment.
> **Deviation:** Requires an Architecture Decision Record (ADR).
> **Scope:** Non-enterprise applications (startups, mid-level products). Enterprise protocols (SAML federation, TLS client certs, FIDO hardware tokens) are excluded as premature complexity.

---

## 1. User IDs & Usernames

- **User IDs** MUST be randomly generated (UUIDv4). NEVER use sequential or predictable IDs (e.g., auto-increment integers exposed to clients).
- **Usernames** MUST permit email addresses, provided the email is verified during sign-up. Users MAY also choose a non-email username.
- **Email verification** MUST occur before the account is activated.

---

## 2. Authentication Solution Separation

- **Sensitive/internal accounts** (backend, middleware, database service accounts) MUST NEVER be usable for login via any front-end user interface.
- The authentication solution (IDP, Auth0, Cognito, etc.) used for **public/unsecured access** MUST be separate from any IDP used for internal administrative tooling.

---

## 3. Password Strength Controls (NIST SP800-63B)

### Length
| MFA Enabled? | Minimum Length |
|:---:|:---:|
| Yes | 8 characters |
| No | 15 characters |

- **Maximum** length: **at least 64** characters to allow passphrases.
- **NEVER silently truncate** passwords. If a password exceeds the maximum supported length, reject it with a clear error message.

### Character Rules
- **ALL characters** MUST be permitted including Unicode and whitespace.
- **NO composition rules.** Do not require upper case, lower case, digits, or special characters.
- **NO character-type restrictions.**

### Rotation & Expiration
- **NEVER require periodic password changes** (e.g., every 90 days). NIST explicitly discourages this.
- **MANDATORY credential rotation** when a password leak is detected or authenticator technology changes.
- On compromise identification, the account MUST be flagged and the password MUST be reset before further access.

### Strength Meter
- A **password strength meter** MUST be displayed during registration and password change.
- Use [zxcvbn-ts](https://github.com/zxcvbn-ts/zxcvbn) or a language-equivalent maintained implementation.

### Breached Password Blocking
- **Common and previously breached passwords MUST be blocked** at registration and password change.
- Use the [Pwned Passwords API](https://haveibeenpwned.com/API/v3#PwnedPasswords) (k-anonymity model) or host the database locally via the [Pwned Passwords Downloader](https://github.com/HaveIBeenPwned/PwnedPasswordsDownloader).

---

## 4. Password Storage

- **Algorithm:** `bcrypt` via `passlib` with cost factor **>= 12**. Argon2id is an acceptable alternative where available.
- **Salt:** MUST be auto-generated per-password (handled by bcrypt/Argon2 by default).
- **Pepper:** Optional. If used, MUST be stored outside the database (env var, HSM, secrets manager).

---

## 5. Password Hash Comparison

- Use the **framework/language's built-in secure comparison function** (e.g., `password_verify()` in PHP, `bcrypt.checkpw` in Python, `bcrypt.compare` in Node.js).
- Where no built-in exists, ensure the comparison function:
  - **Has a maximum input length** to prevent denial-of-service with very long inputs.
  - **Explicitly sets the type** of both variables (prevent type confusion / magic hash attacks).
  - **Returns in constant time** (prevent timing attacks).

---

## 6. Change Password Feature

- User **MUST be authenticated** with an active session.
- **Current password verification is REQUIRED.** Without it, an attacker with temporary session access could change the password.
- New password MUST pass all strength controls (Section 3).
- On success:
  - Invalidate all existing sessions except the current one.
  - Log the event.

---

## 7. TLS Requirement

- The **login page** and **all authenticated pages** MUST be served exclusively over TLS (HTTPS).
- All API endpoints handling credentials, tokens, or session cookies MUST be TLS-protected.
- HSTS header MUST be set in production: `Strict-Transport-Security: max-age=31536000; includeSubDomains`.

---

## 8. Re-authentication for Sensitive Features

- Require the **user's current credentials** before allowing changes to:
  - Password
  - Email address
  - MFA devices
  - Sensitive transactions (payments, shipping address changes)
- This mitigates CSRF, XSS, and session hijacking attacks on sensitive operations.

---

## 9. Authentication Error Messages (Anti-Enumeration)

### Generic Responses
ALL authentication endpoints MUST return **generic error messages** regardless of whether:
- The user ID or password was incorrect.
- The account does not exist.
- The account is locked or disabled.

### Login
| ❌ Incorrect | ✅ Correct |
|---|---|
| "Login for User foo: invalid password." | "Login failed; Invalid user ID or password." |
| "Login failed, invalid user ID." | |
| "Login failed; account disabled." | |

### Password Recovery
| ❌ Incorrect | ✅ Correct |
|---|---|
| "We just sent you a password reset link." | "If that email address is in our database, we will send you an email to reset your password." |
| "This email address doesn't exist in our database." | |

### Account Creation
| ❌ Incorrect | ✅ Correct |
|---|---|
| "This user ID is already in use." | "A link to activate your account has been emailed to the address provided." |
| "Welcome! You have signed up successfully." | |

### Timing Attacks & Uniform Response
- **NEVER use "quick exit"** patterns where user existence is checked before password verification (this creates measurable timing differences).
- Always hash the password and perform the full lookup regardless of whether the user exists.
- **ALL authentication endpoints MUST return responses in a consistent amount of time** regardless of whether the account exists. Use identical logic paths (e.g., always query the DB, always hash/compute) — never take a fast path for non-existent accounts and a slow path for existent ones.
- If asynchronous operations are used, ensure the response timing is still uniform from the caller's perspective (e.g., queue background email sending so the response is immediate regardless of account existence).

### HTTP Status Codes
- **MUST NOT** use different HTTP status codes to indicate valid vs. invalid accounts.
- Use the same status (e.g., 401 or 400) for all authentication failures.

---

## 10. Automated Attack Protection

### Multi-Factor Authentication (MFA)
- **MFA MUST be supported** as an optional but strongly encouraged security layer.
- MFA would have stopped [99.9% of account compromises](https://techcommunity.microsoft.com/t5/Azure-Active-Directory-Identity/Your-Pa-word-doesn-t-matter/ba-p/731984).
- See [Multifactor Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html).

### Login Throttling & Account Lockout
- **Failed attempts counter** MUST be associated with the **account** (not source IP), preventing bypass via distributed IPs.
- Lockout threshold: **10 failed attempts** within an observation window.
- Lockout duration: **exponential backoff** (1s → 2s → 4s → ... up to max 15 min) or fixed duration.
- After **2-3 lockout cycles**, consider permanent lockout requiring admin intervention.
- Allow **password reset** functionality to bypass lockout (prevents DoS via account lockout).
- Rate limit: **5 login attempts per minute** per account.

### CAPTCHA
- CAPTCHA is **optional defense-in-depth**. If implemented:
  - Only require it after a small number of failed attempts (not from the first login).
  - View as a rate-limiting control, not a preventative one (CAPTCHAs can be solved/bypassed).

### Forgot Password & Reset Rate Limiting
- **Forgot password requests** MUST be rate-limited per account AND per IP:
  - **3 requests per hour per account** (prevents flooding a user's email inbox with reset links).
  - **3 requests per hour per IP** (prevents automated scraping of the endpoint).
- **Reset token verification** MUST be rate-limited:
  - **5 attempts per IP per 15 minutes** (prevents brute-forcing of reset tokens).
- CAPTCHA SHOULD be required on the forgot-password form after 1 failed attempt per account to further slow automated attacks.

### Security Questions
- Security questions do **NOT** constitute MFA (both factors are "something you know").
- If used, questions MUST be carefully chosen to avoid predictable answers.
- See [Choosing and Using Security Questions Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Choosing_and_Using_Security_Questions_Cheat_Sheet.html).

---

## 11. Logging & Monitoring of Authentication

- **ALL authentication failures** MUST be logged.
- **ALL password failures** MUST be logged.
- **ALL account lockouts** MUST be logged.
- Logs MUST include: timestamp, user identifier, failure reason (categorized, not verbose), source IP, request ID.
- Logs MUST be reviewed regularly.
- PII (passwords, tokens, secrets) MUST NEVER appear in logs. See observability-patterns.md.

---

## 12. Password Manager Support

Web applications MUST NOT hinder password managers. Follow these rules:
- Use **standard HTML forms** with appropriate `type` attributes (`type="password"`, `type="email"`, etc.).
- **NO plugin-based login pages** (Flash, Silverlight, Java applets).
- Password fields MUST support a maximum of **at least 64 characters**.
- **Allow ALL printable characters** in passwords.
- **Allow paste** in username, password, and MFA fields.
- Users MUST be able to navigate between username and password fields with a single **Tab** key press.

---

## 13. OAuth 2.0 / OpenID Connect (OIDC)

- Use **OAuth 2.0 for delegated authorization** (third-party API access on behalf of users).
- Use **OpenID Connect for authentication/SSO** (OIDC is an identity layer on top of OAuth).
- **NEVER allow third-party applications to store user passwords.** Use OAuth/OIDC instead.
- When implementing OIDC:
  - **Validate ID Tokens** on the server: issuer (`iss`), audience (`aud`), signature (via provider JWKs), expiration (`exp`).
  - Prefer **well-maintained libraries/SDKs** over custom implementations.
  - Use the **UserInfo endpoint** when additional claims beyond the ID Token are needed.
- **OAuth 2.1** consolidates OAuth 2.0 with best practices. Prefer OAuth 2.1 guidance where possible.

---

## 14. Changing a User's Registered Email Address

### If User HAS MFA Enabled:
1. Confirm valid auth session.
2. Ask for proposed new email.
3. Request MFA for identity verification.
4. Store new email as **pending change**.
5. Send **notification email** to **current** address with link to report unexpected activity.
6. Send **confirmation email** to **new** address with link to confirm.
7. Apply change only after confirmation link is clicked.

### If User DOES NOT HAVE MFA:
1. Confirm valid auth session.
2. Ask for proposed new email.
3. Request **current password** for identity verification.
4. Store new email as **pending change**.
5. Send **confirmation email** to **current** address with link to confirm.
6. Send **separate confirmation email** to **new** address with link to confirm.
7. Apply change only after BOTH confirmation links are clicked.

---

## 15. Password Recovery

- Implement a secure password reset flow. See [OWASP Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html).
- NEVER reveal whether an account exists in password recovery responses (see Section 9).

### Reset Tokens
- Reset tokens MUST be:
  - **Cryptographically random** (single-use) using a CSPRNG.
  - **Minimum 32 bytes (256 bits)** of entropy to protect against brute-force.
  - **Time-limited** (max 15-60 minutes).
  - **Invalidated after use or expiration** (single-use).
  - **Linked to an individual user** in the database.
  - **Stored securely** (hashed, like passwords — never stored in plaintext).

### Reset URL Generation
- Reset URLs MUST be generated from **trusted configuration** (`PASSWORD_RESET_BASE_URL` setting), NOT from the HTTP `Host` header. This prevents [Host Header Injection](https://owasp.org/www-project-web-security-testing-guide/stable/4-Web_Application_Security_Testing/07-Input_Validation_Testing/17-Testing_for_Host_Header_Injection) attacks.
- The URL MUST use **HTTPS** only.
- The reset page served by this URL MUST set `Referrer-Policy: noreferrer` to prevent token leakage via the Referer header.
- Rate limit token submission: **5 attempts per IP per 15 minutes** (prevents brute-force).

### Reset Flow (Step-by-Step)
1. User submits email/username on forgot-password form.
2. **Consistent timing & message** returned (see §9). Do not reveal if the account exists.
3. If account exists, generate a reset token and send it via **side-channel email**.
4. User clicks reset URL and is presented with a **new password form**.
5. User MUST **confirm the new password by typing it twice** (two fields, match validation).
6. New password MUST pass all strength controls (Section 3).
7. On successful reset:
   - **DO NOT auto-login the user.** Redirect them to the login page instead. Auto-login introduces unnecessary complexity to session handling and increases attack surface.
   - **Invalidate ALL existing sessions** for this account (all refresh tokens, all access tokens).
   - **Send a notification email** informing the user their password was changed. **NEVER include the new password in the email.**
   - Log the password reset event.
8. **Account MUST NOT be locked out** in response to a forgotten password attempt (prevents DoS via account lockout — see [Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)).

---

## Hard Rules

1. **User IDs** MUST be UUIDv4, never sequential integers exposed to clients.
2. **Password minimums:** 8 chars (with MFA) / 15 chars (without MFA). **Maximum:** at least 64.
3. **NEVER silently truncate** passwords. **NEVER impose composition rules** (upper, lower, digit, special).
4. **NEVER require periodic password changes.** Rotate ONLY on confirmed leak.
5. **Block breached passwords** via Pwned Passwords or equivalent.
6. **Use a password strength meter** (zxcvbn) during registration and password change.
7. **Hash passwords** with bcrypt (cost >= 12) or Argon2id.
8. **Compare hashes** in constant time using framework-provided functions.
9. **Change password** MUST require current password + active session.
10. **TLS is MANDATORY** for login and all authenticated pages.
11. **Re-authenticate** user for password/email changes and sensitive transactions.
12. **Generic error messages** on ALL auth endpoints — no user enumeration via responses, timing, or HTTP status codes.
13. **NEVER use "quick exit"** patterns in login logic.
14. **Account lockout** MUST be per-account, not per-IP. Threshold: 10 failures. Use exponential backoff or fixed duration.
15. **Rate limit** login: 5/min per account.
16. **MUST support MFA** as an optional but encouraged layer.
17. **Log ALL auth failures**, password failures, and account lockouts. NEVER log passwords or tokens.
18. **Password-manager friendly:** standard HTML forms, paste allowed, Tab navigation, any printable characters.
19. **OAuth/OIDC:** validate ID Token (iss, aud, sig, exp); use libraries; never let 3rd parties store user passwords.
20. **Email changes** require notification to current address + confirmation from new address, plus password or MFA verification.
21. **Password reset tokens** MUST be single-use, time-limited (15-60 min), minimum 32 bytes entropy, cryptographically random, and hashed in storage.
22. **Reset URLs** MUST be generated from `PASSWORD_RESET_BASE_URL` config, NOT from the Host header.
23. **Reset page** MUST set `Referrer-Policy: noreferrer`.
24. **Rate limit** forgot-password requests: 3/hr per account + 3/hr per IP.
25. **Rate limit** token verification: 5/IP per 15 minutes.
26. **After password reset**: DO NOT auto-login. Invalidate ALL sessions. Send notification email (no password in email).
27. **Confirm password by typing it twice** on password reset form.
28. **Account MUST NOT be locked** in response to a forgotten password attempt.
