# Mero Kagaz — Unified Frontend

A single Next.js 15 application hosting both the **Public Customer Web Portal** and the **Admin Dashboard** using Next.js App Router route groups.

## Architecture

By using route groups `(web)` and `(admin)` within a single Next.js project, both the public site and the admin portal are deployed and hosted together seamlessly on a single domain or hosting service (e.g. Vercel, Cloudflare, Docker).

```
frontend/
├── src/
│   ├── app/
│   │   ├── (web)/                  # Public web portal (clean URLs: /, /documents, /checkout)
│   │   │   ├── layout.tsx          # Public header, navigation & footer
│   │   │   ├── page.tsx            # Landing page (/)
│   │   │   ├── documents/          # Document catalog & forms
│   │   │   └── checkout/           # Payment checkout flow
│   │   ├── (admin)/                # Protected admin portal (/admin/*)
│   │   │   ├── layout.tsx          # Admin layout (dark theme, admin controls)
│   │   │   └── admin/
│   │   │       ├── dashboard/      # Admin metrics & overview
│   │   │       ├── documents/      # Document management
│   │   │       ├── templates/      # Blade template management
│   │   │       ├── orders/         # Order tracking & processing
│   │   │       ├── payments/       # Transaction auditing
│   │   │       ├── audit-logs/     # Immutable security audit logs
│   │   │       ├── settings/       # System configuration
│   │   │       └── login/          # Sanctum token authentication
│   │   ├── layout.tsx              # Root HTML wrapper with Geist font & SEO metadata
│   │   └── globals.css             # Tailwind CSS styles
│   └── lib/
│       └── api.ts                  # Unified typed API client (public + admin endpoints)
├── package.json
└── next.config.ts
```

## Getting Started

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Set `NEXT_PUBLIC_API_URL` to point to your Laravel backend (default: `http://localhost:8000`).

### 3. Run Development Server
```bash
pnpm dev
```
- Public Web: [http://localhost:3000](http://localhost:3000)
- Admin Portal: [http://localhost:3000/admin](http://localhost:3000/admin)

### 4. Build for Production
```bash
pnpm build
pnpm start
```

## Features & Routes

### Individual User Accounts
- `/login` — Unified user authentication supporting Individual and Business tabbed login
- `/register` — Individual account registration with immediate email verification dispatch
- `/verify-email` — Email token verification page with one-click resend
- `/forgot-password` & `/reset-password` — Password recovery workflow
- `/user/dashboard` — Personal document catalog, payment history, and secure download links

### Business Accounts & Isolation
- `/business/register` — Business organization creation with PAN/VAT and initial owner credentials
- `/business/dashboard` — Dedicated multi-tenant business control center:
  - Real-time today/week/month document statistics
  - Aggregated document usage & spending breakdown
  - Team member invitation modal & management
  - Cross-tenant data isolation enforced by backend policy
- `/business/invitations/accept` — Token-based member onboarding

### Nepali Calendar & Date Filtering
- `NepaliDateFilter.tsx` component supporting Bikram Sambat presets:
  - आज (Today), हिजो (Yesterday), यो हप्ता (This Week), गएको हप्ता (Last Week), यो महिना (This Month), गएको महिना (Last Month), and आफूले छानेको मिति (Custom Range)
  - Seamlessly integrated into both Business and Super Admin dashboards

### Super Admin Dashboard & Email Automation
- `/admin/dashboard` — Platform-wide KPI counters, real database analytics charts, and 12-second live operational alert panel
- `/admin/emails` — Full SMTP configuration, interactive email template editor with dynamic variables (`{{user_name}}`, `{{secure_download_link}}`), test email sender, and delivery logs with 1-click retry

