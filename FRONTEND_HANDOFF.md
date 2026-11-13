# TaskForge Frontend Implementation & Handoff Report

> **Purpose**: This document provides a complete technical report and architectural handoff for the TaskForge frontend inside `frontend/`. It covers all created and modified files, architectural patterns, design decisions, API contracts, and guidance for Claude or any subsequent engineer working on the project.

---

## 1. Executive Summary

The complete frontend for **TaskForge** (a multi-tenant project management application) has been built from scratch within the `frontend/` directory of this monorepo. It strictly adheres to `frontend/FRONTEND_SPEC.md` without modifying any backend code or altering package constraints.

- **Stack**: Next.js 16.4.6 (App Router, Turbopack, React 19.3.0), Tailwind CSS 4.3.3, `@tanstack/react-query` v5, React Hook Form + Zod v4, Radix UI / shadcn/ui primitives, and Lucide React.
- **Design Aesthetic**: Minimal, calm, tool-like (inspired by Linear and GitHub Issues). Neutral surfaces (`#FFFFFF`, `#FAFAFA`, `#F5F5F5`), `#E5E5E5` 1px borders, single `#2563EB` accent, 6px radius (`--radius: 0.375rem`), 8px status indicator dots, text-only priority badges, and zero decorative noise.
- **Strict Hard Bans Followed**: Zero glassmorphism/blur (`backdrop-blur` removed from shadcn overlays), zero gradients, zero shadows (except subtle dropdown/dialog popovers), zero emoji, zero glowing/neon text, and zero entrance/scale animations (only 120ms color/background/opacity transitions).
- **Quality Gates**: `npm run lint` and `npm run build` pass with **0 errors and 0 warnings**.

---

## 2. Inventory of Changes

### 2.1 Modified Files
| File | Changes Made |
| :--- | :--- |
| `frontend/app/globals.css` | Defined light-theme CSS tokens (`--background`, `--border`, `--ring: #2563EB`, status dot colors, priority colors), applied 120ms transitions, visible 2px focus rings (`:focus-visible`), and reset typography to Geist/sans. |
| `frontend/app/layout.tsx` | Wrapped the application tree in `<Providers>`, configured Geist fonts, and set metadata for TaskForge. |
| `frontend/package.json` | Installed required Radix primitives and sonner via shadcn CLI (`sonner`, `next-themes`, `radix-ui`). No versions upgraded. |
| `frontend/package-lock.json` | Updated locks matching installed dependencies. |
| `frontend/components/ui/skeleton.tsx` | Stripped `animate-pulse` to create static light-gray (`#F0F0F0`) blocks as specified. |
| `frontend/components/ui/dialog.tsx` | Removed `backdrop-blur-xs` and scale/entrance animations to adhere to anti-AI hard bans. |
| `frontend/components/ui/alert-dialog.tsx` | Removed `backdrop-blur-xs` and scale animations; ensured 6px radius. |
| `frontend/components/ui/sheet.tsx` | Removed `backdrop-blur-xs` and adjusted transitions to 120ms. |

### 2.2 Deleted Files
| File | Reason |
| :--- | :--- |
| `frontend/app/page.tsx` | Replaced by `frontend/app/(app)/page.tsx` to handle authenticated root redirects cleanly within the `(app)` route group. |

### 2.3 New Files Added

#### Core & Architecture
- `frontend/app/providers.tsx`: Configures `QueryClient` (30s stale time, refetch on window focus, no retry on 4xx) and `AuthProvider`.
- `frontend/app/error.tsx`: Root error boundary handling 403 Forbidden ("You don’t have access to this organization") and general errors with "Try again" and "Go home" actions.
- `frontend/app/not-found.tsx`: Minimal 404 page with a return button.
- `frontend/lib/types.ts`: Strict TypeScript definitions for all domain entities (`User`, `Organization`, `Member`, `Project`, `Task`, `Comment`, `DashboardData`, `Activity`, `Notification`, `Pagination`, `ApiResponse`).
- `frontend/lib/format.ts`: UTC date formatters (`formatDateUTC`, `formatDateTimeUTC`, `toInputDateFormat`), `formatRelativeTime`, and `isOverdue`.

#### Authentication & API Layer (`frontend/lib/api/` & `frontend/lib/auth/`)
- `frontend/lib/api/client.ts`: Core `apiFetch` wrapper with `credentials: 'include'`, in-memory access token management, and deduplicated single-flight `refreshAccessToken()`.
- `frontend/lib/api/auth.ts`: `register`, `login`, `getMe`, `logout`.
- `frontend/lib/api/organizations.ts`: `getOrganizations`, `createOrganization`, `updateOrganization`, `deleteOrganization`.
- `frontend/lib/api/members.ts`: `getMembers`, `addMember`, `updateMemberRole`, `removeMember`.
- `frontend/lib/api/projects.ts`: `getProjects`, `getProject`, `createProject`, `updateProject`, `deleteProject`.
- `frontend/lib/api/tasks.ts`: `getTasks` (filtering, sorting, pagination), `getTask`, `createTask`, `updateTask`, `deleteTask`.
- `frontend/lib/api/comments.ts`: `getComments`, `createComment`, `updateComment`, `deleteComment`.
- `frontend/lib/api/dashboard.ts`: `getDashboard`.
- `frontend/lib/api/activity.ts`: `getActivity` (paginated audit feed).
- `frontend/lib/api/notifications.ts`: `getNotifications`, `markAsRead`.
- `frontend/lib/auth/auth-context.ts`: React Context definitions and `useAuth` hook.
- `frontend/lib/auth/auth-provider.tsx`: Mount bootstrap (`POST /auth/refresh` -> `GET /auth/me`), single-flight refresh listener, login/register/logout actions.
- `frontend/lib/hooks/use-org-role.ts`: Derives user role (`owner`, `admin`, `member`) from the organization's members list.
- `frontend/lib/hooks/use-debounce.ts`: 300ms debounce hook for filter search inputs.

#### UI Components (`frontend/components/`)
- **Shell (`components/shell/`)**:
  - `app-shell.tsx`: Combines desktop 240px sidebar with mobile sheet under 768px. Max-width 1100px main area.
  - `sidebar.tsx`: Top org switcher, main navigation (Dashboard, Projects, Members, Activity, Settings for owners), bottom Notifications link with unread counter, and user profile with "Sign out".
  - `header.tsx`: Slim header with breadcrumb navigation and mobile menu toggle.
  - `org-switcher.tsx`: Dropdown listing user organizations, checkmark for active org, and "+ New organization" shortcut.
- **Shared (`components/shared/`)**:
  - `status-dot.tsx`: 8px status indicator dot (`#737373` Todo, `#2563EB` In progress, `#B45309` Review, `#15803D` Done).
  - `priority-badge.tsx`: Text-only priority labels with specific colors (Low, Medium, High, Urgent).
  - `empty-state.tsx`: Single-sentence literal copy with at most one verb button.
- **Tasks (`components/tasks/`)**:
  - `task-filter-bar.tsx`: URL search-params synced bar (debounced title search, status, priority, assignee, and date sorting with "Clear" action).
  - `task-status-selector.tsx`: Interactive status selector with optimistic React Query update and rollback on error.
  - `create-task-dialog.tsx`: Modal form with title, description, priority, assignee, due date, and labels.
  - `task-comments.tsx`: Comment stream with author, relative timestamps, Ctrl/Cmd+Enter submission, and author edit/delete options.
- **Projects (`components/projects/`)**:
  - `create-project-dialog.tsx`: Project creation modal.
  - `edit-project-dialog.tsx`: Project name/description editor (admin+).
  - `delete-project-dialog.tsx`: `AlertDialog` deletion confirmation (admin+).
- **Members (`components/members/`)**:
  - `add-member-dialog.tsx`: Invite modal by email with role selector (admin+).
  - `remove-member-dialog.tsx`: Deletion/leave confirmation modal protecting owner removal.
- **Shadcn UI Primitives (`components/ui/`)**:
  - `alert-dialog.tsx`, `badge.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `select.tsx`, `separator.tsx`, `sheet.tsx`, `sonner.tsx`, `textarea.tsx`.

#### Pages & Routes (`frontend/app/`)
- `(auth)/layout.tsx`: Centered 360px container with TaskForge header; redirects authenticated users.
- `(auth)/login/page.tsx`: Sign-in form with email/password and inline field validation.
- `(auth)/register/page.tsx`: Registration form (automatically signs in and navigates to `/orgs/new`).
- `(app)/layout.tsx`: `AuthGuard` displaying neutral loading state during bootstrap, redirecting unauthenticated users to `/login?next=...`, and hosting `AppShell`.
- `(app)/page.tsx`: Root redirector inspecting `taskforge_last_org_id` in localStorage, falling back to first org or `/orgs/new`.
- `(app)/orgs/new/page.tsx`: Organization creation page.
- `(app)/orgs/[orgId]/page.tsx`: Dashboard with 5 stat blocks, status distribution bars, latest activity, and project links.
- `(app)/orgs/[orgId]/projects/page.tsx`: Projects list with CRUD dialogs.
- `(app)/orgs/[orgId]/projects/[projectId]/page.tsx`: Tasks table with URL filter sync and pagination.
- `(app)/orgs/[orgId]/projects/[projectId]/tasks/[taskId]/page.tsx`: Task detail with editable title/description, live property editing sidebar, and comments stream.
- `(app)/orgs/[orgId]/members/page.tsx`: Members table with owner role selection and remove/leave actions.
- `(app)/orgs/[orgId]/activity/page.tsx`: Paginated audit log.
- `(app)/orgs/[orgId]/settings/page.tsx`: Owner-only settings with organization rename and type-to-confirm deletion modal.
- `(app)/notifications/page.tsx`: Activity notification stream with 60s polling and mark-as-read click handlers.

---

## 3. Key Architecture & Design Decisions

### 3.1 Authentication & Token Lifecycle
1. **Zero Client Storage for Access Tokens**: The 15-minute JWT is stored solely in memory (`let accessToken: string | null` in `lib/api/client.ts` synced with React state in `AuthProvider`). It is **never** written to `localStorage` or `sessionStorage`.
2. **Rotating HTTP-Only Refresh Token**: The backend sets an `httpOnly`, `SameSite=Strict` cookie on login. All fetch requests pass `credentials: 'include'`.
3. **Single-Flight Refresh Promise**: To prevent duplicate refresh calls from invalidating rotated tokens (especially with React 19 StrictMode executing effects twice in development), `refreshAccessToken()` caches the pending refresh promise in a module-scoped variable:
   ```ts
   let refreshPromise: Promise<string | null> | null = null;
   ```
4. **Transparent 401 Interception**: When any non-auth API call returns a 401, `apiFetch` awaits the single-flight refresh. If successful, it retries the failed request once with the new token. If refresh fails, it clears state and redirects to `/login?next=...`.

### 3.2 Server State & React Query
- Query keys strictly follow the brief:
  - `['orgs']`
  - `['org', orgId, 'members']`
  - `['org', orgId, 'projects']`
  - `['org', orgId, 'project', projectId]`
  - `['org', orgId, 'project', projectId, 'tasks', filters]`
  - `['org', orgId, 'task', taskId]`
  - `['org', orgId, 'task', taskId, 'comments']`
  - `['org', orgId, 'dashboard']`
  - `['org', orgId, 'activity', page]`
  - `['notifications']`
- `placeholderData: keepPreviousData` is used on paginated tasks and activity lists to eliminate layout shift during page turns.
- `TaskStatusSelector` utilizes optimistic updates with immediate cache substitution and automatic rollback on error.
- Notifications query polls every 60 seconds (`refetchInterval: 60 * 1000`).

### 3.3 Role-Based Permissions
Organizations API does not return user roles directly. The custom hook `useOrgRole(orgId)` matches the current user's ID against `userId._id` from `GET /organizations/:orgId/members`:
- **Owner**: Full access, can change member roles, rename org, delete org.
- **Admin**: Can create/edit/delete projects, delete tasks, invite members, remove normal members. Cannot remove admins or owner.
- **Member**: Can create projects, create tasks, edit tasks, comment, and leave the organization.

### 3.4 UTC Date Handling
To resolve discrepancies where UTC 00:00 dates shift to previous days in negative UTC offsets, all dates are formatted using `Intl.DateTimeFormat` with `timeZone: 'UTC'` (`lib/format.ts`). Form dates are transmitted in `YYYY-MM-DD` format.

### 3.5 URL-Driven Filter State & Suspense
All task filter criteria (`status`, `priority`, `assigneeId`, `search`, `sortBy`, `sortOrder`, `page`) are serialized into URL search parameters. All pages using `useSearchParams` are wrapped in `<Suspense>` boundaries to guarantee safe static rendering during `next build`.

---

## 4. Backend Limitations & Constraints Honored

1. **No Task Unassignment / Clearing Fields**: The backend schema disallows unassigning a task or clearing its description or due date. The UI does not provide clear buttons for these attributes.
2. **Alphabetical Priority Sorting**: The backend database sorts priority strings alphabetically (`HIGH` > `LOW` > `MEDIUM` > `URGENT`), which is misleading to users. Consequently, sorting options only expose `createdAt` and `dueDate`.
3. **No Direct Deep Links from Notifications**: Notifications do not supply `organizationId` or `projectId`, so notification rows act as information receipts rather than broken task links.
4. **Comments User ID on Creation**: `POST /comments` returns `userId` as a raw ID string rather than a populated object; `TaskComments` forces a refetch upon submission to ensure the author's display name is immediately rendered.

---

## 5. Verification Commands

To verify the project locally:

```powershell
# 1. Lint check (ESLint 9 + React 19 rules)
npm --prefix frontend run lint

# 2. Production build (Next 16 Turbopack compiler)
npm --prefix frontend run build

# 3. Development server
npm --prefix frontend run dev
```

---

## 6. Recommendations for Claude / Future Engineers

1. **Do Not Store Tokens in LocalStorage**: Maintain the in-memory access token architecture. Any shift to localStorage violates the security specification.
2. **Avoid Decorating the UI**: Maintain the minimal, tool-like aesthetic. Do not introduce framer-motion, neon text, card gradients, emoji, or drop-shadows.
3. **Preserve Suspense on SearchParams**: If introducing new components reading `useSearchParams`, ensure they remain enclosed in a `<Suspense>` boundary to prevent build failures.
4. **React 19 Linting Rules**: Be cautious of `react-hooks/set-state-in-effect`. Derive state via component keys or initial state instead of using `useEffect` to sync props to local state.
