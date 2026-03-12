# Kenbon Restaurant – Frontend Module & Routing Design

This document describes the frontend architecture, module structure, routing, and role-based access for the Kenbon Restaurant System (React + Vite + TypeScript). It aligns with **Section 11 (UX & Frontend Structure)** of the project spec.

---

## 1. Application Modes & Layouts

The app is split into **three logical areas**, each with its own layout and entry points:

| Area | Purpose | Layout | Primary users |
|------|--------|--------|----------------|
| **Staff / Admin app** | POS, orders, menu management, reports, settings | `MainLayout` (sidebar + top bar) | Admin, Manager, Waiter, Cashier, Kitchen |
| **Kitchen Display (KDS)** | Real-time order queue; mark items IN_PREP → READY | `KDSLayout` (full-screen, minimal chrome) | Kitchen staff |
| **Customer UI** (future) | Browse menu, place order, track status | Dedicated layout (e.g. `CustomerLayout`) | Customer |

For **Phase 1**, we implement only the **Staff app** and a **skeleton KDS view** (same app, different route and layout). Customer UI is deferred.

---

## 2. Route Map

### 2.1 Public routes (no auth)

| Path | Description |
|------|-------------|
| `/login` | Login form (username/email + password). Redirect to `/dashboard` when already authenticated. |

### 2.2 Protected routes (require valid JWT)

All under **MainLayout** unless noted.

| Path | Description | Roles (later) |
|------|-------------|----------------|
| `/` | Redirect: if auth → `/dashboard`, else → `/login` | — |
| `/dashboard` | Overview (sales summary, quick stats) | Admin, Manager, Waiter, Cashier |
| `/orders` | Order list + create/edit (POS) | Admin, Manager, Waiter, Cashier |
| `/menu` | Menu & catalog (view; CRUD for admin/manager later) | All staff |
| `/inventory` | Ingredients & stock (view; alerts for admin/manager) | Admin, Manager |
| `/kitchen` | **KDS** – order queue, status updates | Kitchen, Admin, Manager |

### 2.3 Layout assignment

- **MainLayout**: `/dashboard`, `/orders`, `/menu`, `/inventory` (and optionally `/kitchen` if we keep it in the same app with a different nav emphasis).
- **KDSLayout**: `/kitchen` only (full-screen, no sidebar; can be chosen per role or same route with layout switch).

For the **skeleton**, we use a single app with one **MainLayout** that includes a “Kitchen” link; the Kitchen page can later be switched to KDSLayout when we add the real KDS UI.

---

## 3. Folder Structure

```
src/
├── main.tsx
├── App.tsx                    # Router + AuthProvider
├── index.css
├── App.css
│
├── lib/
│   ├── api.ts                 # Axios instance, base URL, interceptors (attach token, 401 → logout)
│   └── auth.ts                # login(), register() calling backend
│
├── context/
│   └── AuthContext.tsx        # Auth state (user, token), login, logout, restore from storage
│
├── layouts/
│   ├── MainLayout.tsx         # Sidebar + top bar + outlet for staff app
│   └── KDSLayout.tsx          # Optional: minimal layout for /kitchen (future)
│
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Orders.tsx
│   ├── Menu.tsx
│   ├── Kitchen.tsx
│   └── Inventory.tsx          # Placeholder for Phase 2
│
├── components/
│   ├── ProtectedRoute.tsx     # Wrapper: require auth else redirect to /login
│   └── (future: RoleGuard, shared UI)
│
└── assets/
```

---

## 4. Navigation & Role-Based Menus

- **MainLayout** renders a **sidebar** (or top nav) with links:
  - Dashboard  
  - Orders  
  - Menu  
  - Inventory (can be hidden for non-admin/manager in a later step)  
  - Kitchen  

- **Role-based visibility** (when we enforce roles):
  - Admin/Manager: all links.
  - Waiter/Cashier: Dashboard, Orders, Menu (no Inventory if restricted).
  - Kitchen: Orders (read-only or limited), Kitchen (KDS).
  - Delivery: Orders (relevant filters), no Menu edit.

For the **skeleton**, all links are visible to any authenticated user; role checks can be added later via a `RoleGuard` or by filtering nav items using `user.roles`.

---

## 5. Auth Flow (Client-Side)

1. **On app load**
   - Read `accessToken` (and optionally `user`) from `localStorage`.
   - If token exists, set auth state and allow access to protected routes.
   - (Optional) Validate token with a lightweight backend call or decode JWT expiry; if expired, clear storage and treat as logged out.

2. **Login**
   - User submits username/email + password.
   - Call `POST /auth/login`; on success store `accessToken` and `user` (id, username, email, roles) in context and `localStorage`, then redirect to `/dashboard`.

3. **Logout**
   - Clear `localStorage` and auth context; redirect to `/login`.

4. **API requests**
   - Every request (via shared axios instance) sends `Authorization: Bearer <accessToken>`.
   - On **401**, clear auth and redirect to `/login`.

---

## 6. Protected Routes

- **ProtectedRoute** (or equivalent) wraps any route that requires auth.
- If not authenticated → redirect to `/login`, optionally with `?redirect=/orders` to return after login.
- If authenticated → render the route’s element (usually a page inside MainLayout).

---

## 7. Styling Approach

- **Tailwind CSS** is in the stack for fast, responsive UI; use utility classes for new components.
- **Consistency**: shared buttons, inputs, cards, and tables via Tailwind (or a small set of CSS classes in `App.css` / a `components.css`).
- **Layout**: MainLayout uses a fixed or sticky sidebar + main content area; KDS uses full viewport with minimal chrome.

For the skeleton, we can mix existing global CSS with Tailwind where it’s already configured, or use plain CSS for layout and buttons to avoid build issues.

---

## 8. Summary: What We Implement First

1. **Design doc** (this file).  
2. **Auth + layout + routing skeleton**:
   - `lib/api.ts` and `lib/auth.ts`
   - `context/AuthContext.tsx`
   - `components/ProtectedRoute.tsx`
   - `layouts/MainLayout.tsx` with nav links
   - `pages/Login.tsx`, `pages/Dashboard.tsx`, and placeholders for Orders, Menu, Kitchen, Inventory
   - Route tree in `App.tsx`: `/login` (public), `/` (redirect), `/dashboard`, `/orders`, `/menu`, `/kitchen`, `/inventory` (all protected under MainLayout)

Next steps after the skeleton: connect **Orders** and **Menu** to real APIs, then add **KDS** with Socket.io and optional **KDSLayout**.
