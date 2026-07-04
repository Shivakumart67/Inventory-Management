import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Inventory as StockIcon,
  AddCircle as AddIcon,
  ShoppingCart as PurchaseIcon,
  MonetizationOn as SalesIcon,
  AccountBalanceWallet as ExpenseIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import api from '../../services/api';
import dayjs from 'dayjs';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { formatCurrency } from '../../utils/format';
import { downloadBlob } from '../../utils/download';

interface ManagerStats {
  currentStock: number;
  todayPurchaseTotal: number;
  todaySalesTotal: number;
  todayExpenses: number;
}

interface TrendPoint {
  date: string;
  purchases: number;
  sales: number;
  expenses: number;
}

interface RecentEntry {
  id: string;
  type: 'PURCHASE' | 'SALE' | 'EXPENSE';
  ref: string;
  date: string;
  party: string;
  amount: number;
}

const StatCard = ({ title, value, label, icon, color }: any) => (
  <Card sx={{ height: '100%' }}>
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
          {label}
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

export const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { config } = useSiteConfig();
  const currencySymbol = config?.currencySymbol || '₹';

  const [stats, setStats] = useState<ManagerStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [loadingTrend, setLoadingTrend] = useState(true);

  const [recentEntries, setRecentEntries] = useState<RecentEntry[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    api
      .get('/dashboard/manager/stats')
      .then((res) => {
        if (res.data?.success) setStats(res.data.stats);
        else setStatsError('Failed to load dashboard metrics');
      })
      .catch((err) => setStatsError(err.response?.data?.message || err.message || 'Network error'))
      .finally(() => setLoadingStats(false));

    api
      .get('/dashboard/manager/trends')
      .then((res) => {
        if (res.data?.success) setTrend(res.data.trend);
      })
      .finally(() => setLoadingTrend(false));

    api
      .get('/dashboard/manager/recent-entries')
      .then((res) => {
        if (res.data?.success) setRecentEntries(res.data.recentEntries);
      })
      .finally(() => setLoadingRecent(false));
  }, []);

  const handleDownloadPDF = async (type: string, id: string, ref: string) => {
    try {
      const endpoint = type === 'PURCHASE' ? `/purchases/${id}/pdf` :
                       type === 'SALE' ? `/sales/${id}/pdf` : `/expenses/${id}/pdf`;

      const response = await api.get(endpoint, { responseType: 'blob' });
      downloadBlob(new Blob([response.data], { type: 'application/pdf' }), `${ref}.pdf`);
    } catch (error) {
      console.error('PDF download error:', error);
      alert('Could not download PDF invoice at this time');
    }
  };

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
        <Typography color="error" variant="h6">{statsError || 'Could not load data'}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Welcome / Header */}
      <Box sx={{ mb: { xs: 2, sm: 4 } }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5, fontSize: { xs: '1.15rem', sm: '1.5rem' } }}>
          My Operational Panel
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage your entries, verify stock availability, and export invoices.
        </Typography>
      </Box>

      {/* 1. Stat Summary Cards */}
      <Grid container spacing={{ xs: 1.5, sm: 3 }} sx={{ mb: { xs: 2, sm: 4 } }}>
        <Grid item xs={6} md={3}>
          <StatCard
            title="Available Stock"
            value={`${stats.currentStock} Units`}
            label="Global stock level tracker"
            icon={<StockIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title="My Purchases (Today)"
            value={formatCurrency(stats.todayPurchaseTotal, currencySymbol)}
            label="Inward cost submitted today"
            icon={<PurchaseIcon />}
            color="info"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title="My Sales (Today)"
            value={formatCurrency(stats.todaySalesTotal, currencySymbol)}
            label="Outward cashflow registered today"
            icon={<SalesIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title="My Expenses (Today)"
            value={formatCurrency(stats.todayExpenses, currencySymbol)}
            label="Voucher sum registered today"
            icon={<ExpenseIcon />}
            color="error"
          />
        </Grid>
      </Grid>

      {/* 2. Quick Action Cards */}
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '1rem', sm: '1.25rem' } }}>Quick Actions</Typography>
      <Grid container spacing={{ xs: 1.5, sm: 3 }} sx={{ mb: { xs: 2, sm: 4 } }}>
        <Grid item xs={12} sm={4}>
          <Card
            onClick={() => navigate('/manager/add-purchase')}
            sx={{
              cursor: 'pointer',
              bgcolor: 'info.light',
              color: 'info.contrastText',
              '&:hover': { transform: 'translateY(-2px)', transition: '0.2s', boxShadow: 3 },
            }}
          >
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3, textAlign: 'center' }}>
              <AddIcon sx={{ fontSize: 40, mb: 1, color: 'white' }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'white' }}>Add Purchase Entry</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Add stock inward purchases
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card
            onClick={() => navigate('/manager/add-sale')}
            sx={{
              cursor: 'pointer',
              bgcolor: 'success.light',
              color: 'success.contrastText',
              '&:hover': { transform: 'translateY(-2px)', transition: '0.2s', boxShadow: 3 },
            }}
          >
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3, textAlign: 'center' }}>
              <AddIcon sx={{ fontSize: 40, mb: 1, color: 'white' }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'white' }}>Add Sales Entry</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Add stock outward sales
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card
            onClick={() => navigate('/manager/add-expense')}
            sx={{
              cursor: 'pointer',
              bgcolor: 'error.light',
              color: 'error.contrastText',
              '&:hover': { transform: 'translateY(-2px)', transition: '0.2s', boxShadow: 3 },
            }}
          >
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3, textAlign: 'center' }}>
              <AddIcon sx={{ fontSize: 40, mb: 1, color: 'white' }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'white' }}>Add Expense Entry</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Add category-based expense voucher
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 3. Personal performance trend */}
      <Card sx={{ mb: { xs: 2, sm: 4 } }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            My Activity Trend (7 Days)
          </Typography>
          {loadingTrend ? (
            <Box sx={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <Box sx={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '0.75rem' }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '0.75rem' }} width={35} />
                  <Tooltip formatter={(value: number) => formatCurrency(value, currencySymbol)} />
                  <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                  <Line type="monotone" dataKey="purchases" name="Purchases" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="sales" name="Sales" stroke="#0f766e" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 4. Manager's own recent entries */}
      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '1rem', sm: '1.25rem' } }}>My Recent Entries</Typography>
          {loadingRecent ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <>
              {/* Desktop table */}
              <Box sx={{ display: { xs: 'none', sm: 'block' }, overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Reference No</TableCell>
                      <TableCell>Party / Details</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="center">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentEntries.length > 0 ? (
                      recentEntries.map((entry) => (
                        <TableRow key={`${entry.type}-${entry.id}`} hover>
                          <TableCell>{dayjs(entry.date).format('YYYY-MM-DD')}</TableCell>
                          <TableCell>
                            <Chip
                              label={entry.type}
                              size="small"
                              color={
                                entry.type === 'PURCHASE' ? 'info' :
                                entry.type === 'SALE' ? 'success' : 'error'
                              }
                              sx={{ fontSize: '0.7rem', fontWeight: 700 }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{entry.ref}</TableCell>
                          <TableCell>{entry.party}</TableCell>
                          <TableCell align="right">{formatCurrency(entry.amount, currencySymbol)}</TableCell>
                          <TableCell align="center">
                            <Button
                              size="small"
                              startIcon={<PdfIcon />}
                              onClick={() => handleDownloadPDF(entry.type, entry.id, entry.ref)}
                              sx={{ py: 0.2 }}
                            >
                              PDF
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center">No transactions registered today</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Box>

              {/* Mobile card list */}
              <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                {recentEntries.length > 0 ? (
                  recentEntries.map((entry) => (
                    <Card key={`${entry.type}-${entry.id}`} variant="outlined" sx={{ mb: 1.5 }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Chip
                            label={entry.type}
                            size="small"
                            color={
                              entry.type === 'PURCHASE' ? 'info' :
                              entry.type === 'SALE' ? 'success' : 'error'
                            }
                            sx={{ fontSize: '0.7rem', fontWeight: 700 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {dayjs(entry.date).format('YYYY-MM-DD')}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{entry.ref}</Typography>
                        <Typography variant="body2" color="text.secondary">{entry.party}</Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {formatCurrency(entry.amount, currencySymbol)}
                          </Typography>
                          <Button
                            size="small"
                            startIcon={<PdfIcon />}
                            onClick={() => handleDownloadPDF(entry.type, entry.id, entry.ref)}
                          >
                            PDF
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                    No transactions registered today
                  </Typography>
                )}
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
export default ManagerDashboard;
