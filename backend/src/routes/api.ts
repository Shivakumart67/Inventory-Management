import { Router } from 'express';
import { authenticateJWT, authorizeRoles } from '../middleware/auth';
import { login, logout, getMe } from '../controllers/authController';
import {
  createUser,
  listUsers,
  getUserById,
  toggleUserStatus,
  resetUserPassword
} from '../controllers/userController';
import {
  createPurchase,
  listPurchases,
  getPurchaseById,
  getPurchasePDF,
  createSale,
  listSales,
  getSaleById,
  getSalePDF,
  createExpense,
  listExpenses,
  getExpenseById,
  getExpensePDF,
  listExpenseCategories
} from '../controllers/transactionController';
import {
  getStockSummary,
  getStockLedger,
  getStockTrend
} from '../controllers/stockController';
import {
  getAdminStats,
  getAdminTrends,
  getAdminMonthlySummary,
  getAdminExpenseBreakdown,
  getManagerStats,
  getManagerTrends,
  getManagerRecentEntries
} from '../controllers/dashboardController';
import {
  getPurchaseReport,
  getSalesReport,
  getExpenseReport,
  getStockReport,
  triggerExport
} from '../controllers/reportController';
import { getActivityLogs } from '../controllers/activityController';
import { getSiteConfig, updateSiteConfig } from '../controllers/siteConfigController';

const router = Router();

// ==========================================
// AUTH ROUTE GROUPS
// ==========================================
router.post('/auth/login', login);
router.post('/auth/logout', authenticateJWT as any, logout as any);
router.get('/auth/me', authenticateJWT as any, getMe as any);

// ==========================================
// USER ROUTE GROUPS (ADMIN ONLY)
// ==========================================
router.post('/users', authenticateJWT as any, authorizeRoles('ADMIN') as any, createUser as any);
router.get('/users', authenticateJWT as any, authorizeRoles('ADMIN') as any, listUsers as any);
router.get('/users/:id', authenticateJWT as any, authorizeRoles('ADMIN') as any, getUserById as any);
router.patch('/users/:id/status', authenticateJWT as any, authorizeRoles('ADMIN') as any, toggleUserStatus as any);
router.patch('/users/:id/reset-password', authenticateJWT as any, authorizeRoles('ADMIN') as any, resetUserPassword as any);

// ==========================================
// SITE CONFIG ROUTE GROUPS
// ==========================================
router.get('/site-config', getSiteConfig as any);
router.put('/site-config', authenticateJWT as any, authorizeRoles('ADMIN') as any, updateSiteConfig as any);

// ==========================================
// PURCHASE ROUTE GROUPS
// ==========================================
router.post('/purchases', authenticateJWT as any, createPurchase as any);
router.get('/purchases', authenticateJWT as any, listPurchases as any);
router.get('/purchases/:id', authenticateJWT as any, getPurchaseById as any);
router.get('/purchases/:id/pdf', authenticateJWT as any, getPurchasePDF as any);

// ==========================================
// SALES ROUTE GROUPS
// ==========================================
router.post('/sales', authenticateJWT as any, createSale as any);
router.get('/sales', authenticateJWT as any, listSales as any);
router.get('/sales/:id', authenticateJWT as any, getSaleById as any);
router.get('/sales/:id/pdf', authenticateJWT as any, getSalePDF as any);

// ==========================================
// EXPENSE ROUTE GROUPS
// ==========================================
router.post('/expenses', authenticateJWT as any, createExpense as any);
router.get('/expenses', authenticateJWT as any, listExpenses as any);
router.get('/expenses/categories', authenticateJWT as any, listExpenseCategories as any);
router.get('/expenses/:id', authenticateJWT as any, getExpenseById as any);
router.get('/expenses/:id/pdf', authenticateJWT as any, getExpensePDF as any);

// ==========================================
// STOCK ROUTE GROUPS
// ==========================================
router.get('/stock/summary', authenticateJWT as any, getStockSummary as any);
router.get('/stock/ledger', authenticateJWT as any, getStockLedger as any);
router.get('/stock/trend', authenticateJWT as any, getStockTrend as any);

// ==========================================
// DASHBOARD ROUTE GROUPS
// ==========================================
router.get('/dashboard/admin/stats', authenticateJWT as any, authorizeRoles('ADMIN') as any, getAdminStats as any);
router.get('/dashboard/admin/trends', authenticateJWT as any, authorizeRoles('ADMIN') as any, getAdminTrends as any);
router.get('/dashboard/admin/monthly-summary', authenticateJWT as any, authorizeRoles('ADMIN') as any, getAdminMonthlySummary as any);
router.get('/dashboard/admin/expense-breakdown', authenticateJWT as any, authorizeRoles('ADMIN') as any, getAdminExpenseBreakdown as any);
router.get('/dashboard/manager/stats', authenticateJWT as any, authorizeRoles('MANAGER') as any, getManagerStats as any);
router.get('/dashboard/manager/trends', authenticateJWT as any, authorizeRoles('MANAGER') as any, getManagerTrends as any);
router.get('/dashboard/manager/recent-entries', authenticateJWT as any, authorizeRoles('MANAGER') as any, getManagerRecentEntries as any);

// ==========================================
// REPORT & EXPORT ROUTE GROUPS
// ==========================================
router.get('/reports/purchases', authenticateJWT as any, getPurchaseReport as any);
router.get('/reports/sales', authenticateJWT as any, getSalesReport as any);
router.get('/reports/expenses', authenticateJWT as any, getExpenseReport as any);
router.get('/reports/stock', authenticateJWT as any, getStockReport as any);
router.get('/reports/export', authenticateJWT as any, triggerExport as any);

// ==========================================
// ACTIVITY LOG ROUTE GROUPS (ADMIN ONLY)
// ==========================================
router.get('/activities', authenticateJWT as any, authorizeRoles('ADMIN') as any, getActivityLogs as any);

export default router;
