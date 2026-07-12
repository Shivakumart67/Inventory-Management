import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import {
  Inventory as StockIcon,
  ShoppingCart as PurchaseIcon,
  MonetizationOn as SalesIcon,
  AccountBalanceWallet as ExpenseIcon,
  People as ActiveUsersIcon,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '../../services/api';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { formatCurrency } from '../../utils/format';

const COLORS = ['#0f766e', '#0ea5e9', '#f59e0b', '#ef4444', '#6366f1'];

interface AdminStats {
  currentStock: number;
  todayPurchasesQty: number;
  todaySalesQty: number;
  todayExpensesAmount: number;
  thisMonthPurchaseTotal: number;
  thisMonthSalesTotal: number;
  thisMonthExpenseTotal: number;
  netBusinessSummary: number;
  activeUsersCount: number;
}

interface DailyTrends {
  purchaseTrend: Array<{ date: string; quantity: number }>;
  salesTrend: Array<{ date: string; quantity: number }>;
  expenseTrend: Array<{ date: string; amount: number }>;
  profitTrend: Array<{ date: string; profit: number }>;
}

interface MonthlySummaryItem {
  month: string;
  purchases: number;
  sales: number;
  expenses: number;
  profit: number;
}

interface TopExpense {
  _id: string;
  totalAmount: number;
}

const StatCard = ({ title, value, subtitle, icon, color, onClick }: any) => (
  <Card
    onClick={onClick}
    sx={{
      cursor: onClick ? 'pointer' : 'default',
      height: '100%',
      '&:hover': onClick ? { transform: 'translateY(-2px)', transition: '0.2s', boxShadow: 3 } : {},
    }}
  >
    <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: { xs: 2, sm: 3 } }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
          {title}
        </Typography>
        <Typography
          variant="h4"
          sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5, fontSize: { xs: '1.35rem', sm: '2rem' }, wordBreak: 'break-word' }}
        >
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      </Box>
      <Box
        sx={{
          bgcolor: `${color}.light`,
          color: `${color}.main`,
          width: { xs: 36, sm: 48 },
          height: { xs: 36, sm: 48 },
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.85,
          flexShrink: 0,
          ml: 1,
        }}
      >
        {icon}
      </Box>
    </CardContent>
  </Card>
);

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
        {title}
      </Typography>
      {children}
    </CardContent>
  </Card>
);

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { config } = useSiteConfig();
  const currencySymbol = config?.currencySymbol || '₹';

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const [trends, setTrends] = useState<DailyTrends | null>(null);
  const [loadingTrends, setLoadingTrends] = useState(true);

  const [monthly, setMonthly] = useState<MonthlySummaryItem[] | null>(null);
  const [loadingMonthly, setLoadingMonthly] = useState(true);

  const [topExpenses, setTopExpenses] = useState<TopExpense[] | null>(null);
  const [loadingExpenses, setLoadingExpenses] = useState(true);

  useEffect(() => {
    api
      .get('/dashboard/admin/stats')
      .then((res) => {
        if (res.data?.success) setStats(res.data.stats);
        else setStatsError('Failed to load dashboard stats');
      })
      .catch((err) => setStatsError(err.response?.data?.message || err.message || 'Network error'))
      .finally(() => setLoadingStats(false));

    api
      .get('/dashboard/admin/trends')
      .then((res) => {
        if (res.data?.success) setTrends(res.data.trends);
      })
      .finally(() => setLoadingTrends(false));

    api
      .get('/dashboard/admin/monthly-summary')
      .then((res) => {
        if (res.data?.success) setMonthly(res.data.monthly);
      })
      .finally(() => setLoadingMonthly(false));

    api
      .get('/dashboard/admin/expense-breakdown')
      .then((res) => {
        if (res.data?.success) setTopExpenses(res.data.topExpenses);
      })
      .finally(() => setLoadingExpenses(false));
  }, []);

  if (loadingStats) {
    return (
      <Box sx={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (statsError || !stats) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error" variant="h6">{statsError || 'Data could not be loaded'}</Typography>
      </Box>
    );
  }

  const transactionTrend =
    trends?.purchaseTrend.map((p, index) => ({
      date: p.date,
      Collections: p.quantity,
      Sales: trends.salesTrend[index]?.quantity || 0,
    })) || [];

  const profitTrendData = trends?.profitTrend || [];
  const expensePieData = (topExpenses || []).map((te) => ({
    name: te._id || 'Uncategorized',
    value: te.totalAmount,
  }));

  const chartHeight = 260;

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* 1. Core Summary Cards Row */}
      <Grid container spacing={{ xs: 1.5, sm: 3 }} sx={{ mb: { xs: 2, sm: 4 } }}>
        <Grid item xs={6} md={3}>
          <StatCard
            title="Available Stock"
            value={`${stats.currentStock} Eggs`}
            subtitle="Current active inventory balance"
            icon={<StockIcon />}
            color="primary"
            onClick={() => navigate('/admin/stock-summary')}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title="Today Collections"
            value={`${stats.todayPurchasesQty} Eggs`}
            subtitle={`Monthly Sum: ${formatCurrency(stats.thisMonthPurchaseTotal, currencySymbol)}`}
            icon={<PurchaseIcon />}
            color="info"
            onClick={() => navigate('/admin/purchases')}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title="Today Sales"
            value={`${stats.todaySalesQty} Eggs`}
            subtitle={`Monthly Sum: ${formatCurrency(stats.thisMonthSalesTotal, currencySymbol)}`}
            icon={<SalesIcon />}
            color="success"
            onClick={() => navigate('/admin/sales')}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title="Today Expenses"
            value={formatCurrency(stats.todayExpensesAmount, currencySymbol)}
            subtitle={`Monthly Sum: ${formatCurrency(stats.thisMonthExpenseTotal, currencySymbol)}`}
            icon={<ExpenseIcon />}
            color="error"
            onClick={() => navigate('/admin/expenses')}
          />
        </Grid>
      </Grid>

      {/* Net profit business card */}
      <Grid container spacing={{ xs: 1.5, sm: 3 }} sx={{ mb: { xs: 2, sm: 4 } }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Grid container alignItems="center" spacing={2}>
                <Grid item xs={12} sm={8}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Net Profit Cashflow</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Overall cumulative profit flow calculated as: Total Sales minus Purchases and Expenses.
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4} sx={{ textAlign: { sm: 'right' } }}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: '1.5rem', sm: '2rem' },
                      color: stats.netBusinessSummary >= 0 ? 'success.main' : 'error.main',
                    }}
                  >
                    {stats.netBusinessSummary >= 0 ? '+' : ''}
                    {formatCurrency(stats.netBusinessSummary, currencySymbol)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: { xs: 2, sm: 3 } }}>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Active Users
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {stats.activeUsersCount} Managers
                </Typography>
              </Box>
              <Box
                sx={{
                  bgcolor: 'secondary.light',
                  color: 'secondary.main',
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.85,
                }}
              >
                <ActiveUsersIcon />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 2. Charts Row 1 — daily trend + expense pie */}
      <Grid container spacing={{ xs: 1.5, sm: 3 }} sx={{ mb: { xs: 2, sm: 4 } }}>
        <Grid item xs={12} lg={8}>
          <ChartCard title="Stock Movement Trends (7 Days)">
            {loadingTrends ? (
              <Box sx={{ height: chartHeight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress size={28} />
              </Box>
            ) : (
              <Box sx={{ width: '100%', height: chartHeight }}>
                <ResponsiveContainer>
                  <LineChart data={transactionTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '0.75rem' }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '0.75rem' }} width={35} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                    <Line type="monotone" dataKey="Collections" name="Egg Collections" stroke="#0f766e" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Sales" name="Sales" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}
          </ChartCard>
        </Grid>

        <Grid item xs={12} lg={4}>
          <ChartCard title="Expense Categories (This Month)">
            {loadingExpenses ? (
              <Box sx={{ height: chartHeight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress size={28} />
              </Box>
            ) : (
              <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {expensePieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={chartHeight - 20}>
                    <PieChart>
                      <Pie
                        data={expensePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {expensePieData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value, currencySymbol)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ height: chartHeight - 20, display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">No expenses recorded yet</Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1, justifyContent: 'center' }}>
                  {expensePieData.map((entry, index) => (
                    <Box key={entry.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: COLORS[index % COLORS.length], flexShrink: 0 }} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        {entry.name} ({formatCurrency(entry.value, currencySymbol)})
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </ChartCard>
        </Grid>
      </Grid>

      {/* 3. Charts Row 2 — profit trend + monthly comparison (MIS) */}
      <Grid container spacing={{ xs: 1.5, sm: 3 }} sx={{ mb: { xs: 2, sm: 4 } }}>
        <Grid item xs={12} lg={5}>
          <ChartCard title="Profit Trend (7 Days)">
            {loadingTrends ? (
              <Box sx={{ height: chartHeight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress size={28} />
              </Box>
            ) : (
              <Box sx={{ width: '100%', height: chartHeight }}>
                <ResponsiveContainer>
                  <AreaChart data={profitTrendData}>
                    <defs>
                      <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0f766e" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '0.75rem' }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '0.75rem' }} width={35} />
                    <Tooltip formatter={(value: number) => formatCurrency(value, currencySymbol)} />
                    <Area type="monotone" dataKey="profit" stroke="#0f766e" fill="url(#profitGradient)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            )}
          </ChartCard>
        </Grid>

        <Grid item xs={12} lg={7}>
          <ChartCard title="Monthly Comparison (6 Months) — MIS Summary">
            {loadingMonthly ? (
              <Box sx={{ height: chartHeight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress size={28} />
              </Box>
            ) : (
              <Box sx={{ width: '100%', height: chartHeight }}>
                <ResponsiveContainer>
                  <BarChart data={monthly || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: '0.75rem' }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '0.75rem' }} width={40} />
                    <Tooltip formatter={(value: number) => formatCurrency(value, currencySymbol)} />
                    <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                    <Bar name="Egg Collections" dataKey="purchases" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    <Bar name="Sales" dataKey="sales" fill="#0f766e" radius={[4, 4, 0, 0]} />
                    <Bar name="Expenses" dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </ChartCard>
        </Grid>
      </Grid>
    </Box>
  );
};
export default AdminDashboard;
