# AI Project Initialization Guide (Entrypoint)

**Context for AI:** You have been invoked to bootstrap a new, real-world project using this Fullstack Template. Your goal during the first update is to transition the repository from a "Template State" to a "Project State" without breaking any structural integrity or introducing errors. 

This document defines exactly what is structural (DO NOT TOUCH) and what is demonstrational (MODIFY/REMOVE) to ensure a perfect, error-free start.

---

## 1. Structural Core — DO NOT REMOVE OR ALTER
These files and systems form the engine of the template. They are fully production-ready and must remain intact to ensure Auth, RBAC, Security, and Observability function correctly.

### Backend Core (Immutable)
- **Models:** `user.py`, `role.py`, `event.py`, `base.py`
- **Services & Routes:** `auth`, `users`, `roles`, `events`, `health`
- **Core Systems:** `orm/`, `core/security.py`, `core/config.py`, all `middlewares`
- **Tests:** The entire test suite for auth, users, and core systems MUST keep passing.

### Frontend Core (Immutable)
- **Auth & Routing:** `contexts/AuthContext.tsx`, `components/auth/ProtectedRoute.tsx`, `App.tsx` (routing structure).
- **Layout & UI:** `components/Layout/` (Header, Footer, LayoutWrapper), `components/ui/` (Button, Input, Skeleton).
- **API Clients:** `api/client.ts`, `api/auth.ts`, `api/users.ts`.
- **Hooks:** `useAuth.ts`, `useLocale.ts`.

### Project Rules
- **`RULES.md`**: The ultimate source of truth. NEVER violate these rules.

---

## 2. Template Demonstration Content — WHAT TO MODIFY OR REMOVE
The following elements exist only to demonstrate how the template works. They MUST be replaced or cleared out for the real project.

### 1. Frontend Pages (Modify Content, Keep Shells)
- **`frontend/src/pages/Home.tsx`**: 
  - *Current state:* Displays generic "Fullstack Template" welcome text and generic login/register buttons.
  - *Action:* Strip out the dummy text. Replace with the actual project's landing page content, hero section, and specific branding. Keep the locale and auth routing intact if applicable.
- **`frontend/src/pages/Dashboard.tsx`**:
  - *Current state:* Demonstrates fetching and displaying a list of users (`useUsersList`) in a table.
  - *Action:* Remove the user list demonstration. Keep the `useAuth` hook and the welcome header. Replace the body with actual project-specific dashboard widgets.

### 2. Internationalization (i18n)
- **`frontend/src/i18n/en.json` & `ar.json`**:
  - *Current state:* Contains dummy translation keys under `home` and `dashboard`.
  - *Action:* Delete the dummy keys. Add the real project's initial translation keys. **CRITICAL:** Ensure every key you add to `en.json` is also added to `ar.json` to prevent crashes.

### 3. Project Metadata & Configuration
- **`README.md`**:
  - *Current state:* Template documentation.
  - *Action:* Overwrite entirely with the new project's title, description, local setup instructions, and specific architecture notes.
- **`package.json` (frontend) & `pyproject.toml` (backend)**:
  - *Action:* Change `"name": "fullstack-template"` to the actual project name. Update description and author.
- **`deploy/render.yaml` & `frontend/vercel.json`**:
  - *Action:* Update service names from `fullstack-backend` and `fullstack-frontend` to the actual project names.

---

## 3. The Bootstrap Workflow (Step-by-Step for the AI)

When the user asks you to "Initialize the project for [Project Name]", execute these steps in order:

1. **Update Metadata:** 
   - Rename the project in `README.md`, `package.json`, `pyproject.toml`, and deployment files.
2. **Clear Dummy UI Content:** 
   - Wipe the demonstration content from `Home.tsx` and `Dashboard.tsx`. 
   - Clean up `en.json` and `ar.json`.
3. **Configure the Environment:** 
   - Generate secure random strings for `SECRET_KEY` and `JWT_SECRET` (if configuring local `.env` files for the user).
   - Set the `VITE_API_BASE_URL` appropriately.
4. **Scaffold the First Business Module:** 
   - If the user provided the core domain (e.g., "Build an E-commerce store"), immediately create the first module (e.g., `Products`) following the strict 10-step process in `RULES.md` (Model -> Schema -> Service -> Route -> Frontend Types -> API -> Hooks -> Page).
5. **Verify Core Integrity:**
   - Run `make lint` and `make test`. 
   - The original Auth, User, and RBAC tests MUST still pass. If they fail, you broke structural code. Fix it immediately before reporting back to the user.

**Final Check:** Does the code strictly adhere to `RULES.md`? If yes, the bootstrap is complete.
