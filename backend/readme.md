# Inventory & MIS Management Web Application Walkthrough

This walkthrough outlines the project layout, setup guidelines, initial seed users, and details the backend and frontend business workflows.

---

## 1. Project Folder Structure

The workspace contains two standalone folders, `/backend` and `/frontend`:

```text
├── /backend
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env
│   └── /src
│       ├── server.ts
│       ├── /config
│       │   └── db.ts
│       ├── /models
│       │   ├── User.ts
│       │   ├── Purchase.ts
│       │   ├── Sale.ts
│       │   ├── Expense.ts
│       │   ├── ExpenseCategory.ts
│       │   ├── StockLedger.ts
│       │   ├── StockSummary.ts
│       │   └── ActivityLog.ts
│       ├── /middleware
│       │   ├── auth.ts
│       │   └── errorHandler.ts
│       ├── /services
│       │   ├── stockService.ts
│       │   ├── pdfService.ts
│       │   ├── exportService.ts
│       │   └── activityService.ts
│       ├── /controllers
│       │   ├── authController.ts
│       │   ├── userController.ts
│       │   ├── transactionController.ts
│       │   ├── stockController.ts
│       │   ├── dashboardController.ts
│       │   └── reportController.ts
│       ├── /routes
│       │   └── api.ts
│       └── /seeds
│           └── seed.ts
│
└── /frontend
    ├── package.json
    ├── tsconfig.json
    ├── index.html
    ├── .env
    └── /src
        ├── main.tsx
        ├── App.tsx
        ├── index.css
        ├── theme.ts
        ├── /components
        │   ├── Protected.tsx
        │   └── /Layout
        │       └── AppLayout.tsx
        ├── /context
        │   └── AuthContext.tsx
        ├── /services
        │   └── api.ts
        └── /pages
            ├── /Auth
            │   └── Login.tsx
            ├── /Dashboard
            │   ├── AdminDashboard.tsx
            │   └── ManagerDashboard.tsx
            ├── /Purchases
            │   ├── PurchaseList.tsx
            │   └── AddPurchase.tsx
            ├── /Sales
            │   ├── SalesList.tsx
            │   └── AddSale.tsx
            ├── /Expenses
            │   ├── ExpenseList.tsx
            │   └── AddExpense.tsx
            ├── /Stock
            │   ├── StockSummary.tsx
            │   └── StockLedger.tsx
            ├── /Reports
            │   └── ReportsDashboard.tsx
            ├── /Users
            │   └── UserManagement.tsx
            └── /Activities
                └── ActivityLogs.tsx
```

---

## 2. Setup & Execution Instructions

Ensure you have [Node.js (v18+)](https://nodejs.org) and [MongoDB](https://www.mongodb.com) running locally.

### Step A: Backend Setup
1. Open a terminal inside the `/backend` folder:
   ```bash
   cd backend
   ```
2. The dependencies are already installed. Check or customize your `backend/.env` file:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/inventory_db
   JWT_SECRET=super_secret_jwt_key_987654321
   NODE_ENV=development
   ```
3. Run the Database Seeder script:
   ```bash
   npm run seed
   ```
4. Start the backend developer server:
   ```bash
   npm run dev
   ```
   The backend will boot up on [http://localhost:5000](http://localhost:5000).

### Step B: Frontend Setup
1. Open a new terminal inside the `/frontend` folder:
   ```bash
   cd frontend
   ```
2. Verify or edit your `frontend/.env` variables:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
3. Start the frontend developer server:
   ```bash
   npm run dev
   ```
   Vite will host the web app at [http://localhost:5173](http://localhost:5173).

---

## 3. Seed Credentials

Running `npm run seed` populates the database with:

| Full Name | Username | Password | Role | Access Level |
| :--- | :--- | :--- | :--- | :--- |
| **System Admin** | `admin` | `admin123` | `ADMIN` | Full MIS Analytics, Manage Users, View audit log, View all transactions |
| **Inventory Manager** | `manager` | `manager123` | `MANAGER` | Add purchase/sale/expense, View own data, Download own transaction PDFs |

---

## 4. Business Rules & Stock Movement Flow

### Stock Ledger & Balance Alignment
The database does not just write to a single stock value; it stores a chronological **Stock Ledger** and keeps an aggregated **Stock Summary** document.

1. **Purchase Entry (Inward Stock)**:
   - When a purchase is registered, it triggers `StockService.registerPurchase()`.
   - The transaction increases `currentStock` and `totalInwardQuantity` inside `StockSummary`.
   - A `StockLedger` document is saved recording `inQuantity` and the calculated `closingStock`.

2. **Sales Entry (Outward Stock)**:
   - When a sale is submitted, the system performs an **atomic stock check**.
   - If the requested quantity exceeds `currentStock`, the checkout fails and blocks submission.
   - If stock is sufficient, it atomically decrements `currentStock` and increments `totalOutwardQuantity`.
   - A `StockLedger` document is saved recording `outQuantity` and the decreased `closingStock`.

3. **Expense Voucher**:
   - Expenses are recorded for category logs (e.g. labour, maintenance) and have **no effect** on physical stock levels.

---

## 5. Security & Role Permissions Matrix

The application restricts route targets and API access levels on both frontend (via React Route Guards) and backend (JWT role auth middleware):

* **Admin Role**:
  - View overall company dashboard metrics, trends, and top categories.
  - View complete purchases, sales, and expense lists across all managers.
  - Reset manager passwords and toggle active status.
  - Review system-wide audit activity logs.
  - Create and register new managers.
* **Inventory Manager Role**:
  - View individual totals (today's purchases, sales, expenses).
  - Submit purchases, sales, and expenses.
  - Access own list history and download own transaction PDFs.
  - Exclude access to User Management, Activity logs, or another manager's transaction rows.

---

## 6. Dynamic Exports Engine

No transaction invoice or spreadsheet report is saved permanently in the filesystem or database. This complies with strict storage limitations.

1. **PDF Generation (`pdfkit`)**:
   - Triggering `/api/purchases/:id/pdf` reads database fields and writes text, alignments, tables, and borders directly into a PDFKit stream piped to the client browser.
2. **Excel & CSV Export (`exceljs`)**:
   - Reporting query responses are formatted as tabular rows. 
   - `ExportService` formats cell grids, colors headers teal, adjusts column widths, and streams binary Excel files (`.xlsx`) or text CSV lines (`.csv`) directly back to the HTTP response header.
