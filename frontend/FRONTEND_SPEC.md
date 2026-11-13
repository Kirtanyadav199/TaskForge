# TaskForge Frontend Build Brief

For the coding agent that builds the frontend. The backend is finished and tested. The frontend is only scaffolded, everything else is your job.

## 0. How to work

- Read this whole brief and `frontend/AGENTS.md` before writing code. This project uses very recent versions (Next.js 16, React 19, Tailwind 4, Zod, shadcn CLI 4). Do not rely on habits from older versions; when unsure, read the docs shipped with the installed packages or run `npx shadcn@latest docs <component>`.
- First reply with a short plan: file tree and milestone order. Then build milestone by milestone (section 12). After each milestone run `npm run lint` and `npm run build`, fix everything, post a 5-line report, continue.
- Do not modify anything inside `backend/`. If you find a backend problem, put it in the final report.
- Do not run `git commit` or `git push`, do not run `npm audit fix --force`, do not upgrade major versions.
- The developer machine is Windows with PowerShell. Use only cross-platform npm scripts.
- Prefer boring, readable code over clever code. The owner is a student who must be able to read and explain every file in interviews.

## 1. Product

TaskForge is a multi-tenant project management app (a simplified Linear/Jira). A user can belong to many organizations. An organization has members with roles (owner, admin, member) and projects. Projects contain tasks, tasks have comments. There is also a dashboard, an activity feed and notifications.

## 2. What already exists (do not change)

- Repo layout: `backend/` and `frontend/` side by side. You work only in `frontend/` (path D:/Backend/TaskForge/frontend).
- Installed: next 16.4.6, react 19.3.0, tailwindcss 4.3.3 wired through `@tailwindcss/turbopack` in `next.config.ts` (keep that rule), typescript 5, @tanstack/react-query, react-hook-form, zod, @hookform/resolvers, shadcn/ui (Radix base, `components.json` exists, `button input label card` already added; lucide-react comes with it).
- App Router, no `src/` directory. Code lives in `frontend/app`, `frontend/components`, `frontend/lib`. Import alias `@/*`.
- `cacheComponents` is intentionally OFF in `next.config.ts`. Keep it off. All data is fetched in the browser, so server-side caching features give nothing here.
- The dev server must run on http://localhost:3000. The backend CORS allows exactly that origin with credentials. If port 3000 is busy, stop the other process, never switch ports.
- Backend runs on http://localhost:5000 (from `backend/`: `docker compose up -d`, or `npm run dev`). The frontend reads `NEXT_PUBLIC_API_URL=http://localhost:5000` from `frontend/.env.local`; make sure that file is gitignored. Never put secrets in `NEXT_PUBLIC_` variables.

## 3. Design direction

Goal: a calm, minimal, tool-like interface that looks hand-made by a careful engineer, not generated. Think of quiet, dense work tools (Linear, GitHub Issues, Notion lists): borders instead of shadows, plain text instead of decoration.

**Palette** (CSS variables in `app/globals.css`, overriding shadcn’s theme; light theme only, no theme toggle):

- Background `#FFFFFF`; sidebar and subtle surfaces `#FAFAFA`; hover `#F5F5F5`; border `#E5E5E5`.
- Text `#171717`; muted text `#737373`.
- Primary button: background `#171717`, text `#FFFFFF`. Secondary button: white with a 1px border.
- One accent `#2563EB` for links, focus rings and selected states. Use it sparingly.
- Status is a small 8px dot plus plain text, never a big colored pill. TODO `#737373`, IN\_PROGRESS `#2563EB`, REVIEW `#B45309`, DONE `#15803D`.
- Priority is text only: LOW `#737373`, MEDIUM `#171717`, HIGH `#B45309`, URGENT `#B91C1C` with medium weight. Overdue dates and error text `#B91C1C`, with no background fill.

**Typography:** one sans-serif family (keep the scaffold font, Geist, or use Inter). Base size 14px, secondary 13px, page title 20px/600, section headings 14px/600. Only weights 400, 500, 600. Sentence case everywhere (New task, not NEW TASK or New Task).

**Shape and space:** radius 6px everywhere. No shadows, except one very subtle shadow on dropdowns and dialogs. 4/8px spacing grid. Content max width 1100px, sidebar 240px. Lists use 1px row dividers and a light hover background.

**Hard bans (these are what make an interface look AI-generated):**

- No glowing, neon, gradient, outlined or shadowed text. No text effects of any kind. No gradients anywhere (backgrounds, buttons, borders).
- No glassmorphism, blur, backdrop-filter, aurora blobs, dot or grid patterns, noise, decorative illustrations.
- No emoji in the UI or in copy. No sparkle icons. No Welcome back style greetings. No marketing hero sections or feature-card grids.
- No hover lift, scale, parallax, entrance animations, shimmer or looping animation. Only 120ms color, background and opacity transitions. Respect `prefers-reduced-motion`.
- No big rounded cards (nothing above 8px radius), no colored card backgrounds, no oversized icons. Icons are lucide, 16px, 1.5 to 2 stroke, muted color.
- Copy is short, literal and specific. Button labels are verbs (Create task, Save, Delete project). An empty state is one sentence and at most one button, with no illustration.

**Login and register:** a plain centered 360px form on the white page, with the name TaskForge as small text above it. No split screens, no side illustrations.

**Loading and errors:** loading uses static light-gray skeleton blocks (no shimmer) or plain Loading… text for tiny areas. Errors are an inline message plus a Try again button.

**Responsive:** usable from 375px width. Under 768px the sidebar becomes a top bar with a menu button that opens a sheet. Tables become stacked rows.

**Accessibility:** AA contrast, a visible 2px accent focus ring on every interactive element, a label on every input, keyboard-operable menus and dialogs (Radix provides this), polite toast announcements, semantic landmarks (nav, main).

## 4. Auth and data architecture (the most important part)

The backend uses a 15-minute JWT access token plus a rotating refresh token in an httpOnly, SameSite=Strict cookie (7 days). Rules:

1. The access token lives in memory only (a module variable plus React context state). Never in localStorage, sessionStorage or a JS-set cookie. The refresh token is invisible to JS; the browser handles it.
2. Every request uses `fetch` with `credentials: 'include'` and the header `Authorization: Bearer <accessToken>`. No axios.
3. Bootstrap on app load: call `POST /api/auth/refresh`. On success store the token and call `GET /api/auth/me`; on failure the user is signed out. While bootstrapping show a neutral loading screen, never flash the login form.
4. Single-flight refresh: keep one module-level refresh-in-progress promise and make every caller await it. This is required because refresh tokens rotate and a reused token returns 401, which would sign the user out. React StrictMode runs effects twice in development, so an unguarded bootstrap breaks.
5. In the API client, when a request (other than login, register, refresh, logout) returns 401: do one single-flight refresh, retry the original request once, and if refresh fails clear auth state and redirect to `/login?next=<current path>`. Never loop.
6. Login: `POST /api/auth/login`, store token and user, go to `next` or `/`. Register: the endpoint returns no token, so after it succeeds call login with the same credentials and go to `/orgs/new`. Logout: `POST /api/auth/logout`, clear the token, `queryClient.clear()`, go to `/login`.
7. Route protection is client-side: an `AuthGuard` in `app/(app)/layout.tsx` waits for bootstrap, then renders children or redirects. Do not use Next.js middleware for auth and do not fetch user data in Server Components (the token only exists in the browser). Pages are thin `page.tsx` files rendering client components. Use `useParams()` and `useSearchParams()` in client components.
8. Use TanStack Query for all server state, with one `QueryClient` created via `useState` inside a client `Providers` component. `staleTime` 30s, no retry on 4xx, refetch on window focus. Query keys: `['orgs']`, `['org', orgId, 'members']`, `['org', orgId, 'projects']`, `['org', orgId, 'project', projectId]`, `['org', orgId, 'project', projectId, 'tasks', filters]`, `['org', orgId, 'task', taskId]`, `['org', orgId, 'task', taskId, 'comments']`, `['org', orgId, 'dashboard']`, `['org', orgId, 'activity', page]`, `['notifications']`. Mutations invalidate the affected keys. Task status change is optimistic with rollback on error. Paginated lists use `placeholderData: keepPreviousData`. Poll notifications every 60s (there is no realtime yet).
9. Any component using `useSearchParams` must sit inside a `<Suspense>` boundary, otherwise `next build` fails.
10. The organizations list does not include the user’s role. Derive it from `GET /api/organizations/:orgId/members` by matching `userId._id` with the current user’s id, inside a `useOrgRole(orgId)` hook. Hide actions the role cannot use. The backend enforces permissions anyway, so also handle 403 with a toast.
11. Remember the last used org id in localStorage (it is not sensitive) for the `/` redirect. The URL is the source of truth.
12. Format dates with `timeZone: 'UTC'`. The backend stores due dates at 00:00 UTC, and local formatting shows the wrong day in some timezones. Send due dates as `YYYY-MM-DD`.

## 5. API contract

Base: `${NEXT_PUBLIC_API_URL}/api`. Success: `{ success: true, data, pagination? }`. Error: `{ success: false, message }` with an HTTP status: 400 validation (one message), 401 not authenticated, expired or invalid token, 403 forbidden or not a member, 404, 409 conflict, 429 rate limited, 500. IDs are 24-character Mongo ObjectId strings; a malformed id returns 400. Show the server `message` in the UI when present.

Types: Role = owner | admin | member. TaskStatus = TODO | IN\_PROGRESS | REVIEW | DONE. TaskPriority = LOW | MEDIUM | HIGH | URGENT.

**Auth**

- `POST /auth/register` {name (min 2), email, password (min 6)} → 201, data {id, name, email}. 409: Email already registered.
- `POST /auth/login` {email, password} → data {accessToken, user {id, name, email}} and sets the refresh cookie. 401: Invalid email or password. Login and register are limited to 10 per 15 minutes per IP (429 with a message); show it.
- `POST /auth/refresh` (no body, cookie only) → data {accessToken}; rotates the cookie. 401 if missing, already used or expired.
- `POST /auth/logout` → 200, clears the cookie, idempotent.
- `GET /auth/me` → data {id, name, email}.

**Organizations**

- `POST /organizations` {name} → 201 org; the creator becomes owner.
- `GET /organizations` → data \[org\] (organizations the user belongs to). org = {\_id, name, ownerId, createdAt, updatedAt}.
- `PATCH /organizations/:orgId` {name} (owner). `DELETE /organizations/:orgId` (owner).

**Members** `/organizations/:orgId/members`

- `GET` (any member) → data \[{\_id, userId {\_id, name, email}, organizationId, role, createdAt}\].
- `POST` {email, role: admin | member} (admin or above). The user must already be registered: 404 No registered user found with this email; 409 if already a member.
- `PATCH /:userId/role` {role: admin | member} (owner). `:userId` is the user id, not the membership id. The owner’s role cannot be changed (400).
- `DELETE /:userId`: owner or admin can remove (an admin cannot remove an admin, nobody can remove the owner). Any member can remove themselves (leave).

**Projects** `/organizations/:orgId/projects`

- `POST` {name (min 2), description?} (any member) → 201 project {\_id, name, description?, organizationId, createdBy, createdAt, updatedAt}.
- `GET` → data \[project\], newest first, not paginated. `GET /:projectId`.
- `PATCH /:projectId` {name?, description?} (admin or above). `DELETE /:projectId` (admin or above).

**Tasks** `/organizations/:orgId/projects/:projectId/tasks`

- Task = {\_id, title, description?, status, priority, projectId, organizationId, assigneeId?, createdBy, dueDate?, labels: string\[\], createdAt, updatedAt}. `assigneeId` and `createdBy` are plain user id strings; map them to names with the members list.
- `POST` {title (min 2), description?, priority? (default MEDIUM), assigneeId? (must be an org member), dueDate?, labels?} (any member) → 201. Status is always TODO on create.
- `GET` query: `status`, `priority`, `assigneeId`, `search` (title, case-insensitive), `page` (default 1), `limit` (default 20, max 100), `sortBy` (createdAt | dueDate | priority), `sortOrder` (asc | desc, default desc) → data \[task\] and pagination {page, limit, totalCount, totalPages}. Do not expose sorting by priority (the backend sorts the strings alphabetically). Offer created date and due date only.
- `GET /:taskId`. `PATCH /:taskId` with any of {title, description, status, priority, assigneeId, dueDate, labels} (any member). `DELETE /:taskId` (admin or above).

**Comments** `.../tasks/:taskId/comments`

- `GET` → data \[{\_id, content, taskId, userId {\_id, name, email}, createdAt, updatedAt}\], oldest first, not paginated.
- `POST` {content (min 1)} → 201. In this response `userId` is a plain id string, so refetch the list after posting.
- `PATCH /:commentId` {content} and `DELETE /:commentId`: author only (anyone else gets 404).

**Dashboard** `GET /organizations/:orgId/dashboard` → data {totalTasks, completedTasks, pendingTasks, myAssignedTasks, overdueTasks, breakdown: \[{\_id: TaskStatus, count}\]}. `breakdown` only contains statuses that have tasks; treat missing ones as 0.

**Activity** `GET /organizations/:orgId/activity?page&limit` (limit max 100, default 20) → data \[{\_id, actorId {\_id, name, email}, action, targetId?, message, createdAt}\] and pagination. Render the actor name followed by the message. If the message already starts with the actor’s name, render the message alone.

**Notifications** (not organization scoped)

- `GET /notifications` → data \[{\_id, type: TASK\_ASSIGNED | NEW\_COMMENT, message, relatedTaskId?, isRead, createdAt}\], latest 50, newest first.
- `PATCH /notifications/:notificationId/read` → 200; 404 if it is not yours. Unread count = items where isRead is false.

## 6. Routes and layout

Route groups: `(auth)` for public pages, `(app)` for guarded pages.

- `/login`, `/register`: public; signed-in users are redirected away.
- `/`: signed in → redirect to the last used org (if still in the list), else the first org, else `/orgs/new`.
- `/orgs/new`: create organization (also the first-run screen).
- `/orgs/[orgId]`: dashboard. `/orgs/[orgId]/projects`: project list and create.
- `/orgs/[orgId]/projects/[projectId]`: task list. `/orgs/[orgId]/projects/[projectId]/tasks/[taskId]`: task detail with comments.
- `/orgs/[orgId]/members`, `/orgs/[orgId]/activity`, `/orgs/[orgId]/settings` (owner only), `/notifications`.
- `not-found.tsx` and `error.tsx`. A 403 on an org shows: You don’t have access to this organization, with a link home.

**App shell:** left sidebar (240px, `#FAFAFA`, right border). At the top an organization switcher (dropdown listing orgs plus New organization). Then nav links: Dashboard, Projects, Members, Activity, Settings (owners only). At the bottom a Notifications link with an unread count, and the user name with a menu (Sign out). The main area has a slim header with breadcrumbs.

## 7. Pages

Hide UI by role (the backend enforces it too): create project, create task, comment: any member. Edit or delete project: admin or above. Delete task: admin or above. Add member: admin or above. Change role: owner. Remove member: admin or above (admins cannot remove admins). Any non-owner can leave an organization. Rename or delete organization: owner. Edit or delete a comment: its author.

- **Dashboard:** a row of 5 plain bordered stat blocks (Total, Pending, Completed, Assigned to me, Overdue) with a large number and a small label. Below: the status breakdown as a simple list with thin neutral bars (plain divs, no chart library), then Recent activity (latest 8) and a short project list.
- **Projects:** rows with name, one-line description and created date. A New project dialog (name, description). Row click opens the project. Admin or above get a row menu: Edit, Delete (confirm dialog).
- **Project tasks:** header with the project name and New task. Filter bar: search (300ms debounce), status, priority, assignee (from members), sort (Newest, Oldest, Due soonest, Due latest), Clear. Filters and page live in the URL search params. Rows: status (a clickable dot select that changes status), title, priority, assignee name, due date (red when overdue and not DONE), labels as small plain text. Footer: Page x of y, total count, Previous and Next. The New task dialog has title, description, priority, assignee, due date (`<input type='date'>`) and labels (comma separated).
- **Task detail:** breadcrumbs. Title and description are editable with explicit Save and Cancel. A side column with Status, Priority, Assignee, Due date and Labels, each saved immediately on change, plus created by and created date as plain text. Delete (admin or above) with confirm. Comments below: author, relative time, content as plain text keeping line breaks, edit and delete on your own, and a textarea to add one (Ctrl or Cmd plus Enter submits).
- **Members:** table with name, email, role, actions. Add member dialog (email, role). The owner changes roles with a select. Remove with confirm; Leave organization for non-owners.
- **Activity:** vertical list of actor plus message with a relative time; Previous and Next paging.
- **Notifications:** list with an unread dot, message and relative time; clicking an item marks it read. No deep links (see section 11).
- **Settings (owner):** rename the organization; Delete organization with a type-the-name confirmation; afterwards go to `/`.

## 8. Forms, validation, states

- Forms use React Hook Form with Zod through `@hookform/resolvers`, directly with shadcn `Input`, `Label`, `Textarea` (do not add shadcn’s form wrapper). Match backend rules: name at least 2 characters, valid email, password at least 6, organization name required, project name at least 2, task title at least 2, comment at least 1. Check the installed Zod version’s API first (v4 differs from v3).
- Field errors sit under inputs; server errors show in a form-level message; the submit button is disabled and says Saving… while pending; set correct `autoComplete` attributes; close dialogs and reset forms on success.
- Failed mutations show a `sonner` toast with the server message. Destructive actions always use an `AlertDialog`.
- Every list and page has loading, empty and error states in the style of section 3.
- Add components with `npx shadcn@latest add`: textarea, select, dropdown-menu, dialog, alert-dialog, sheet, badge, separator, skeleton, sonner (and avatar only if needed). Radix base only. Adjust them to the palette.

## 9. Code structure

Suggested (adapt if you have a good reason):

```
app/            layout.tsx, globals.css, providers.tsx, not-found.tsx, error.tsx
  (auth)/       login, register
  (app)/        layout.tsx (AuthGuard + shell), page.tsx, orgs/new, orgs/[orgId]/..., notifications
components/ui/  shadcn components
components/     shell, sidebar, org-switcher, task-row, filters, dialogs
lib/api/        client.ts (apiFetch, ApiError, single-flight refresh), one file per domain
lib/auth/       auth-provider.tsx
lib/hooks/      React Query hooks
lib/            types.ts, format.ts
```

Rules: no `fetch` inside components (everything goes through `lib/api`), strict TypeScript with no `any`, small components, comments only where logic is non-obvious (especially the refresh logic).

## 10. Do not

- Store tokens in localStorage or sessionStorage, use Next.js middleware for auth, fetch user data in Server Components, or enable `cacheComponents`.
- Add axios, Redux, Zustand, framer-motion, chart libraries, or any UI kit besides shadcn/ui and lucide-react.
- Upgrade major versions, run `npm audit fix --force`, switch to Base UI, or move Tailwind to PostCSS.
- Use `dangerouslySetInnerHTML`, hardcode the API URL, or put secrets in `NEXT_PUBLIC_` variables.
- Use any effect or decoration banned in section 3.

## 11. Known backend limitations (do not build around them; report if relevant)

- A task cannot be unassigned, and its due date or description cannot be cleared. Build no UI for this.
- Sorting by priority is alphabetical, so it is not exposed.
- Notifications carry no organization or project id, so they cannot link to the task.
- There is no cross-project My tasks list; the dashboard only gives a count.
- Deleting a project or organization does not delete its tasks or comments.
- No password reset, password change or email verification. No realtime: poll and refetch on window focus instead.
- The cookie is SameSite=Strict. It works on localhost (same site, different ports), but in production the frontend and the API must share a registrable domain, or the backend cookie settings must change.

## 12. Milestones and finish

Run `npm run lint` and `npm run build` after each milestone and fix everything before moving on.

1. **Foundation:** theme tokens, providers, `lib/api/client.ts`, auth provider with bootstrap and single-flight refresh, login and register, guard, app shell with org switcher, `/orgs/new`, `/` redirect. Done when: register, create an org, refresh the page and stay signed in, then log out.
2. **Projects and members.**
3. **Tasks:** list with filters and pagination, create, status change, task detail, comments.
4. **Dashboard, activity, notifications, settings.**
5. **Polish:** states, responsive layout, accessibility, copy review against section 3.

Manual QA before finishing (use two accounts and two organizations): register, login, logout; page refresh keeps the session; role-based UI as owner, admin and member; filters survive a page reload; optimistic status change rolls back on failure (stop the backend and try); 403 and 404 screens; 375px width. The owner will separately test silent token refresh by setting a short `JWT_EXPIRES_IN` in `backend/.env` locally.

Final report: what was built per milestone, how to run it, deviations from this brief, backend issues found, QA results.
