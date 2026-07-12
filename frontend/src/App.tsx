import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';
import { AuthProvider } from './context/AuthContext';
import { SiteConfigProvider } from './context/SiteConfigContext';
import { Protected } from './components/Protected';
import { AppLayout } from './components/Layout/AppLayout';

// Auth Pages
import { Login } from './pages/Auth/Login';

// Dashboards
import { AdminDashboard } from './pages/Dashboard/AdminDashboard';
import { ManagerDashboard } from './pages/Dashboard/ManagerDashboard';

// Purchase Entries
import { PurchaseList } from './pages/Purchases/PurchaseList';
import { AddPurchase } from './pages/Purchases/AddPurchase';

// Sales Entries
import { SalesList } from './pages/Sales/SalesList';
import { AddSale } from './pages/Sales/AddSale';

// Expense Entries
import { ExpenseList } from './pages/Expenses/ExpenseList';
import { AddExpense } from './pages/Expenses/AddExpense';

// Stock Management
import { StockSummary } from './pages/Stock/StockSummary';
import { StockLedger } from './pages/Stock/StockLedger';

// Reporting
import { ReportsDashboard } from './pages/Reports/ReportsDashboard';
import { MISDashboard } from './pages/Reports/MISDashboard';
import { GlobalLoader } from './components/GlobalLoader';

// Admin Panel
import { UserManagement } from './pages/Users/UserManagement';
import { ActivityLogs } from './pages/Activities/ActivityLogs';

export const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <SiteConfigProvider>
          <GlobalLoader />
          <Router>
            <Routes>
              {/* Unauthenticated Login page */}
              <Route path="/login" element={<Login />} />

              {/* Admin Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <Protected allowedRoles={['ADMIN']}>
                    <AppLayout>
                      <AdminDashboard />
                    </AppLayout>
                  </Protected>
                }
              />
              <Route
                path="/admin/purchases"
                element={
                  <Protected allowedRoles={['ADMIN']}>
                    <AppLayout>
                      <PurchaseList />
                    </AppLayout>
                  </Protected>
                }
              />
              <Route
                path="/admin/sales"
                element={
                  <Protected allowedRoles={['ADMIN']}>
                    <AppLayout>
                      <SalesList />
                    </AppLayout>
                  </Protected>
                }
              />
              <Route
                path="/admin/expenses"
                element={
                  <Protected allowedRoles={['ADMIN']}>
                    <AppLayout>
                      <ExpenseList />
                    </AppLayout>
                  </Protected>
                }
              />
              <Route
                path="/admin/stock-summary"
                element={
                  <Protected allowedRoles={['ADMIN']}>
                    <AppLayout>
                      <StockSummary />
                    </AppLayout>
                  </Protected>
                }
              />
              <Route
                path="/admin/stock-ledger"
                element={
                  <Protected allowedRoles={['ADMIN']}>
                    <AppLayout>
                      <StockLedger />
                    </AppLayout>
                  </Protected>
                }
              />
              <Route
                path="/admin/reports"
                element={
                  <Protected allowedRoles={['ADMIN']}>
                    <AppLayout>
                      <ReportsDashboard />
                    </AppLayout>
                  </Protected>
                }
              />
              <Route
                path="/admin/mis-dashboard"
                element={
                  <Protected allowedRoles={['ADMIN']}>
                    <AppLayout>
                      <MISDashboard />
                    </AppLayout>
                  </Protected>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <Protected allowedRoles={['ADMIN']}>
                    <AppLayout>
                      <UserManagement />
                    </AppLayout>
                  </Protected>
                }
              />
              <Route
                path="/admin/activities"
                element={
                  <Protected allowedRoles={['ADMIN']}>
                    <AppLayout>
                      <ActivityLogs />
                    </AppLayout>
                  </Protected>
                }
              />

              {/* Inventory Manager Routes */}
              <Route
                path="/manager/dashboard"
                element={
                  <Protected allowedRoles={['MANAGER']}>
                    <AppLayout>
                      <ManagerDashboard />
                    </AppLayout>
                  </Protected>
                }
              />
              <Route
                path="/manager/add-purchase"
                element={
                  <Protected allowedRoles={['MANAGER']}>
                    <AppLayout>
                      <AddPurchase />
                    </AppLayout>
                  </Protected>
                }
              />
              <Route
                path="/manager/add-sale"
                element={
                  <Protected allowedRoles={['MANAGER']}>
                    <AppLayout>
                      <AddSale />
                    </AppLayout>
                  </Protected>
                }
              />
              <Route
                path="/manager/add-expense"
                element={
                  <Protected allowedRoles={['MANAGER']}>
                    <AppLayout>
                      <AddExpense />
                    </AppLayout>
                  </Protected>
                }
              />
              <Route
                path="/manager/my-purchases"
                element={
                  <Protected allowedRoles={['MANAGER']}>
                    <AppLayout>
                      <PurchaseList />
                    </AppLayout>
                  </Protected>
                }
              />
              <Route
                path="/manager/my-sales"
                element={
                  <Protected allowedRoles={['MANAGER']}>
                    <AppLayout>
                      <SalesList />
                    </AppLayout>
                  </Protected>
                }
              />
              <Route
                path="/manager/my-expenses"
                element={
                  <Protected allowedRoles={['MANAGER']}>
                    <AppLayout>
                      <ExpenseList />
                    </AppLayout>
                  </Protected>
                }
              />
              <Route
                path="/manager/my-reports"
                element={
                  <Protected allowedRoles={['MANAGER']}>
                    <AppLayout>
                      <ReportsDashboard />
                    </AppLayout>
                  </Protected>
                }
              />
              <Route
                path="/manager/mis-dashboard"
                element={
                  <Protected allowedRoles={['MANAGER']}>
                    <AppLayout>
                      <MISDashboard />
                    </AppLayout>
                  </Protected>
                }
              />

              {/* Fallback Catch-all Route */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Router>
        </SiteConfigProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};
export default App;
