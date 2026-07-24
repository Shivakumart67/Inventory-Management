import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Download as DownloadIcon,
  FilterList as FilterIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import dayjs from 'dayjs';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { formatCurrency } from '../../utils/format';
import { downloadFile } from '../../utils/download';

const PRESET_7_DAYS = '7_days';
const PRESET_30_DAYS = '30_days';
const PRESET_THIS_MONTH = 'this_month';
const PRESET_LAST_MONTH = 'last_month';
const PRESET_OVERALL = 'overall';
const PRESET_CUSTOM = 'custom';

const COLORS = ['#0f766e', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#10b981'];

export const MISDashboard: React.FC = () => {
  const { user } = useAuth();
  const { config } = useSiteConfig();
  const currencySymbol = config?.currencySymbol || '₹';
  const isAdmin = user?.role === 'ADMIN';

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Filters state
  const [preset, setPreset] = useState<string>(PRESET_30_DAYS);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [creator, setCreator] = useState<string>('');

  // Loaded data state
  const [loading, setLoading] = useState<boolean>(true);
  const [managers, setManagers] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>({
    totalInwardQty: 0,
    totalInwardCost: 0,
    totalOutwardQty: 0,
    totalOutwardRevenue: 0,
    totalExpenses: 0,
    netProfit: 0
  });
  const [trendData, setTrendData] = useState<any[]>([]);
  const [pivotData, setPivotData] = useState<any[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);

  // Calculate actual dates based on preset
  const getDateRange = (selectedPreset: string) => {
    let start = '';
    let end = dayjs().format('YYYY-MM-DD');

    if (selectedPreset === PRESET_7_DAYS) {
      start = dayjs().subtract(7, 'day').format('YYYY-MM-DD');
    } else if (selectedPreset === PRESET_30_DAYS) {
      start = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
    } else if (selectedPreset === PRESET_THIS_MONTH) {
      start = dayjs().startOf('month').format('YYYY-MM-DD');
    } else if (selectedPreset === PRESET_LAST_MONTH) {
      start = dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
      end = dayjs().subtract(1, 'month').endOf('month').format('YYYY-MM-DD');
    } else if (selectedPreset === PRESET_OVERALL) {
      start = '';
      end = '';
    }
    return { start, end };
  };

  const fetchMISData = async () => {
    setLoading(true);
    try {
      let finalFrom = fromDate;
      let finalTo = toDate;

      if (preset !== PRESET_CUSTOM) {
        const range = getDateRange(preset);
        finalFrom = range.start;
        finalTo = range.end;
      }

      const params: any = {
        fromDate: finalFrom,
        toDate: finalTo,
      };

      if (isAdmin && creator) {
        params.creator = creator;
      }

      const response = await api.get('/dashboard/mis', { params });
      if (response.data?.success) {
        setKpis(response.data.kpis);
        setTrendData(response.data.trendData);
        setPivotData(response.data.pivotData);
        setExpenseCategories(response.data.expenseCategories);
        if (response.data.managers) {
          setManagers(response.data.managers);
        }
      }
    } catch (error) {
      console.error('Error fetching MIS dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (preset !== PRESET_CUSTOM) {
      fetchMISData();
    }
  }, [preset, creator]);

  useEffect(() => {
    if (preset === PRESET_CUSTOM) {
      fetchMISData();
    }
  }, []);

  const handlePresetChange = (val: string) => {
    setPreset(val);
    if (val === PRESET_CUSTOM) {
      setFromDate(dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
      setToDate(dayjs().format('YYYY-MM-DD'));
    }
  };

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMISData();
  };

  // CSV/Excel backend Download Function
  const exportPivotCSV = async () => {
    let finalFrom = fromDate;
    let finalTo = toDate;

    if (preset !== PRESET_CUSTOM) {
      const range = getDateRange(preset);
      finalFrom = range.start;
      finalTo = range.end;
    }

    const queryParams = new URLSearchParams();
    queryParams.append('type', 'mis');
    queryParams.append('format', 'csv');
    if (finalFrom) queryParams.append('fromDate', finalFrom);
    if (finalTo) queryParams.append('toDate', finalTo);
    if (isAdmin && creator) queryParams.append('user', creator);

    const dateStr = dayjs().format('YYYYMMDD_HHmmss');
    const filename = `MIS_Summary_Report_${dateStr}.csv`;

    try {
      await downloadFile(`/reports/export?${queryParams.toString()}`, filename);
    } catch (error) {
      console.error('CSV export error:', error);
      alert('Could not download CSV summary report at this time');
    }
  };

  return (
    <Box sx={{ flexGrow: 1, pb: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4, display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: 2 }}>
        <Box>
          <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
            MIS Business Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Aggregate collections, sales, expenses, and track unit margins dynamically.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<DownloadIcon />}
          onClick={exportPivotCSV}
          disabled={pivotData.length === 0}
          fullWidth={isMobile}
          sx={{ py: 1 }}
        >
          Export Summary Table
        </Button>
      </Box>

      {/* Filters Card */}
      <Card sx={{ mb: 4, borderRadius: 3, boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.04)' }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <form onSubmit={handleApplyFilters}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={isAdmin ? 4 : 6} md={3}>
                <TextField
                  fullWidth
                  select
                  size="small"
                  label="Date Preset"
                  value={preset}
                  onChange={(e) => handlePresetChange(e.target.value)}
                >
                  <MenuItem value={PRESET_7_DAYS}>Last 7 Days</MenuItem>
                  <MenuItem value={PRESET_30_DAYS}>Last 30 Days</MenuItem>
                  <MenuItem value={PRESET_THIS_MONTH}>Current Month</MenuItem>
                  <MenuItem value={PRESET_LAST_MONTH}>Last Month</MenuItem>
                  <MenuItem value={PRESET_OVERALL}>Overall (Lifetime)</MenuItem>
                  <MenuItem value={PRESET_CUSTOM}>Custom Range</MenuItem>
                </TextField>
              </Grid>

              {preset === PRESET_CUSTOM && (
                <>
                  <Grid item xs={12} sm={6} md={2.5}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="From Date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2.5}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="To Date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </>
              )}

              {isAdmin && (
                <Grid item xs={12} sm={preset === PRESET_CUSTOM ? 6 : 4} md={3}>
                  <TextField
                    fullWidth
                    select
                    size="small"
                    label="Filter by Creator"
                    value={creator}
                    onChange={(e) => setCreator(e.target.value)}
                  >
                    <MenuItem value="">All Managers / System</MenuItem>
                    {managers.map((m) => (
                      <MenuItem key={m._id} value={m._id}>
                        {m.name} (@{m.username})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              )}

              {preset === PRESET_CUSTOM && (
                <Grid item xs={12} sm={isAdmin ? 6 : 12} md={1.5}>
                  <Button variant="contained" color="primary" type="submit" startIcon={<FilterIcon />} fullWidth>
                    Apply
                  </Button>
                </Grid>
              )}
            </Grid>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={45} thickness={4.5} />
        </Box>
      ) : (
        <>
          {/* Glassmorphic KPI Summary Grid */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3, borderLeft: '5px solid #0f766e', boxShadow: '0 4px 20px 0 rgba(0,0,0,0.02)' }}>
                <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                    Egg Collections
                  </Typography>
                  <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 800, color: '#0f766e', my: 0.5 }}>
                    {kpis.totalInwardQty.toLocaleString()} Eggs
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total cost: {formatCurrency(kpis.totalInwardCost, currencySymbol)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3, borderLeft: '5px solid #0ea5e9', boxShadow: '0 4px 20px 0 rgba(0,0,0,0.02)' }}>
                <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                    Sales Output
                  </Typography>
                  <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 800, color: '#0ea5e9', my: 0.5 }}>
                    {kpis.totalOutwardQty.toLocaleString()} Eggs
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Revenue: {formatCurrency(kpis.totalOutwardRevenue, currencySymbol)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3, borderLeft: '5px solid #ef4444', boxShadow: '0 4px 20px 0 rgba(0,0,0,0.02)' }}>
                <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                    Other Expenses
                  </Typography>
                  <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 800, color: '#ef4444', my: 0.5 }}>
                    {formatCurrency(kpis.totalExpenses, currencySymbol)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Operational disbursements
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  borderRadius: 3,
                  background: kpis.netProfit >= 0
                    ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
                    : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                  boxShadow: '0 4px 20px 0 rgba(0,0,0,0.02)',
                  height: '100%'
                }}
              >
                <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: { xs: 2, sm: 2.5 } }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                      Net profit / loss
                    </Typography>
                    <Typography
                      variant={isMobile ? "h6" : "h5"}
                      sx={{
                        fontWeight: 900,
                        color: kpis.netProfit >= 0 ? 'success.dark' : 'error.dark',
                        mt: 0.5
                      }}
                    >
                      {formatCurrency(kpis.netProfit, currencySymbol)}
                    </Typography>
                  </Box>
                  <Box>
                    {kpis.netProfit >= 0 ? (
                      <TrendingUpIcon sx={{ fontSize: isMobile ? 36 : 40, color: 'success.main' }} />
                    ) : (
                      <TrendingDownIcon sx={{ fontSize: isMobile ? 36 : 40, color: 'error.main' }} />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts Row */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Chart 1: Collections vs Sales Volume */}
            <Grid item xs={12} lg={6}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.02)' }}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                    Egg Volume Comparison (Qty)
                  </Typography>
                  <Box sx={{ width: '100%', height: { xs: 220, sm: 280 } }}>
                    {trendData.length === 0 ? (
                      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography color="text.secondary">No trend data available for this range</Typography>
                      </Box>
                    ) : (
                      <ResponsiveContainer>
                        <LineChart data={trendData} margin={{ left: -10, right: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '0.7rem' }} tickMargin={8} minTickGap={15} />
                          <YAxis stroke="#94a3b8" style={{ fontSize: '0.7rem' }} />
                          <RechartsTooltip />
                          <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                          <Line type="monotone" name="Collected Eggs" dataKey="inwardQty" stroke="#0f766e" strokeWidth={2.5} dot={{ r: 2 }} />
                          <Line type="monotone" name="Sold Eggs" dataKey="outwardQty" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 2 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Chart 2: Financial Flow Comparison */}
            <Grid item xs={12} lg={6}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.02)' }}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                    Revenue vs Collection Costs & Expenses ({currencySymbol})
                  </Typography>
                  <Box sx={{ width: '100%', height: { xs: 220, sm: 280 } }}>
                    {trendData.length === 0 ? (
                      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography color="text.secondary">No trend data available for this range</Typography>
                      </Box>
                    ) : (
                      <ResponsiveContainer>
                        <AreaChart data={trendData} margin={{ left: -10, right: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '0.7rem' }} tickMargin={8} minTickGap={15} />
                          <YAxis stroke="#94a3b8" style={{ fontSize: '0.7rem' }} />
                          <RechartsTooltip formatter={(value: number) => formatCurrency(value, currencySymbol)} />
                          <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                          <Area type="monotone" name="Sales Revenue" dataKey="revenue" fill="#d0eefb" stroke="#0ea5e9" strokeWidth={2} />
                          <Area type="monotone" name="Collection Cost" dataKey="cost" fill="#d2edea" stroke="#0f766e" strokeWidth={2} />
                          <Area type="monotone" name="Expenses" dataKey="expenses" fill="#fee2e2" stroke="#ef4444" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Chart 3: Expense Category Breakdown */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.02)' }}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={7}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                        Expense Share Breakdown
                      </Typography>
                      <Box sx={{ width: '100%', height: { xs: 200, sm: 240 } }}>
                        {expenseCategories.length === 0 ? (
                          <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography color="text.secondary">No expense transactions registered in this range</Typography>
                          </Box>
                        ) : (
                          <ResponsiveContainer>
                            <PieChart>
                              <Pie
                                data={expenseCategories}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={isMobile ? undefined : ({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                outerRadius={isMobile ? 55 : 85}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {expenseCategories.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <RechartsTooltip formatter={(value: number) => formatCurrency(value, currencySymbol)} />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={5}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, px: { xs: 1, sm: 2 } }}>
                        {expenseCategories.map((ec, idx) => (
                          <Box key={ec.name} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: COLORS[idx % COLORS.length], flexShrink: 0 }} />
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{ec.name}</Typography>
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                              {formatCurrency(ec.value, currencySymbol)}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Pivot Table Section */}
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Interactive MIS Summary Ledger
          </Typography>

          <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.02)', overflowX: 'auto' }}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Date / Period</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Eggs Collected (Inward)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Eggs Sold (Outward)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Collection Cost</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Sales Revenue</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Expenses</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Net Profit/Loss</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pivotData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No transactions found for the selected query filters.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  pivotData.map((row) => (
                    <TableRow key={row.date} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{row.date}</TableCell>
                      <TableCell align="right">{row.inwardQty.toLocaleString()}</TableCell>
                      <TableCell align="right">{row.outwardQty.toLocaleString()}</TableCell>
                      <TableCell align="right">{formatCurrency(row.cost, currencySymbol)}</TableCell>
                      <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>
                        {formatCurrency(row.revenue, currencySymbol)}
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'error.main' }}>
                        {formatCurrency(row.expenses, currencySymbol)}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: 700,
                          color: row.profit >= 0 ? 'success.dark' : 'error.dark',
                          bgcolor: row.profit >= 0 ? '#f0fdf4' : '#fef2f2'
                        }}
                      >
                        {formatCurrency(row.profit, currencySymbol)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
};

export default MISDashboard;
