# LibSys — Library Management System Flowcharts

**Project:** College Library Management System (LibSys)
**Stack:** React 18 (Vercel) · Express + Node.js (Render) · PostgreSQL (Neon)
**Roles:** Admin · Librarian · Student · Teacher

> How to view: open this file on GitHub (diagrams render automatically), or paste any
> diagram into [mermaid.live](https://mermaid.live) to export PNG / SVG / PDF.

---

## 1. System Architecture — how the parts connect

```mermaid
flowchart LR
    subgraph Client["Frontend — React (Vercel)"]
        LP[Landing Page]
        LG[Login Page]
        DD[Role Dashboards]
    end
    subgraph Server["Backend — Express API (Render)"]
        A1["/api/auth"]
        A2["/api/admin"]
        A3["/api/librarian"]
        A4["/api/student"]
        A5["/api/teacher"]
    end
    DB[(PostgreSQL — Neon)]

    LP --> LG
    LG --> DD
    DD <--> A1
    DD <--> A2
    DD <--> A3
    DD <--> A4
    DD <--> A5
    A1 <--> DB
    A2 <--> DB
    A3 <--> DB
    A4 <--> DB
    A5 <--> DB
```

- The React app serves the landing page, login, and four role-based dashboards.
- Every dashboard talks to the Express REST API over HTTPS with a JWT Bearer token.
- All data lives in a single PostgreSQL database (tables: `users`, `books`,
  `book_copies`, `issued_books`, `fines`, `students`, `teachers`, `librarians`,
  `audit_logs`, `refresh_tokens`, `system_config`).

---

## 2. Authentication & Role Routing — login to dashboard

```mermaid
flowchart TD
    A[Open App] --> B{Already logged in?}
    B -->|No| C[Landing Page]
    C --> D[Login: email + password]
    D --> E{Credentials valid?}
    E -->|No| F[Show error message]
    F --> D
    E -->|Yes| Ggrenze{Got tokens?}
    Ggrenze -->|access 15min + refresh 7 days| H{Must change password?}
    H -->|Yes| I[Change Password page]
    I --> J[Role Dashboard]
    H -->|No| J
    B -->|Yes| J
    J --> K{What is the role?}
    K -->|admin| L["/admin — Admin Panel"]
    K -->|librarian| M["/librarian — Library Management"]
    K -->|student| N["/student — Student Portal"]
    K -->|teacher| O["/teacher — Teacher Portal"]
    J --> P[Top-right menu: Profile / Logout]
    P --> Q[Logout clears tokens]
    Q --> C
```

- Passwords are stored as bcrypt hashes, never plain text.
- The short-lived access token auto-refreshes using the refresh token, so users stay signed in.
- Every protected route checks the role — a student URL cannot be opened by a teacher, and vice versa.

---

## 3. Book Circulation — the core library workflow (add → issue → return)

```mermaid
flowchart TD
    A[Librarian adds book: book_code + total copies] --> B[System auto-creates copies: CODE-001, CODE-002, ...]
    B --> C[Book listed in catalog as Available]
    C --> D[Librarian issues book: select member + free copy]
    D --> E[Due date auto-set from library settings]
    E --> F[Copy status becomes Issued]
    F --> G{Returned on or before due date?}
    G -->|Yes| H[Copy status becomes Available]
    G -->|No| I[Fine raised: overdue days x fine_per_day]
    I --> J[Fine status: Pending]
    J --> K[Fine paid by member]
    K --> L[Fine status: Paid]
    L --> H
```

- Each physical copy has a unique code (`MATH-001`), so the exact copy is always traceable.
- Durations (`issue_duration_days`) and rates (`fine_per_day`) come from system config — no hard-coding.
- Every issue, return, and payment is written to `audit_logs`.

---

## 4. Role-wise Features — what each user can do

```mermaid
flowchart TD
    R[Logged-in user] --> AD[Admin]
    R --> LB[Librarian]
    R --> ST[Student]
    R --> TE[Teacher]

    AD --> AD1[Manage users and roles]
    AD --> AD2[Library settings: fine rate, issue duration]
    AD --> AD3[View fines, audit logs, analytics]

    LB --> LB1[Add and edit books + copies]
    LB --> LB2[Issue and return books]
    LB --> LB3[Manage students and teachers]
    LB --> LB4[Collect fines]

    ST --> ST1[Browse book catalog]
    ST --> ST2[View issued books + history]
    ST --> ST3[View and track fines]

    TE --> TE1[Browse book catalog]
    TE --> TE2[View issued books + history]
    TE --> TE3[Manage own profile]
```

---

## 5. Fine Lifecycle — overdue to paid

```mermaid
flowchart LR
    A[Due date passes] --> B[Book flagged Overdue]
    B --> C[Fine calculated: days overdue x fine_per_day]
    C --> D[Status: Pending]
    D --> E[Payment collected by librarian]
    E --> F[Status: Paid]
```

- Overdue fines are estimated live on dashboards and confirmed as records in the `fines` table.
- Members see their own fines; librarians collect; admins oversee the totals.
