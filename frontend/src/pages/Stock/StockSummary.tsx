import React, { useState, useEffect } from 'react';
import {
  Grid,
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Inventory as StockIcon,
  TrendingUp as InwardIcon,
  TrendingDown as OutwardIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import api from '../../services/api';
import dayjs from 'dayjs';

export const StockSummary: React.FC = () => {
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingTrend, setLoadingTrend] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await api.get('/stock/summary');
        if (response.data?.success) {
          setSummary(response.data.summary);
        }
      } catch (error) {
        console.error('Error loading stock summary:', error);
      } finally {
        setLoadingSummary(false);
      }
    };

    const fetchTrend = async () => {
      try {
        const response = await api.get('/stock/trend');
        if (response.data?.success) {
          // Format date labels for chart
          const formatted = response.data.trend.map((t: any) => ({
            ...t,
            dateLabel: dayjs(t.date).format('MMM DD'),
          }));
          setTrendData(formatted);
        }
      } catch (error) {
        console.error('Error loading stock trend:', error);
      } finally {
        setLoadingTrend(false);
      }
    };

    fetchSummary();
    fetchTrend();
  }, []);

  if (loadingSummary || loadingTrend) {
    return (
      <Box sx={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  const currentStock = summary?.currentStock || 0;
  const isLowStock = currentStock < 50;

  const summaryCards = [
    {
      title: 'Current Available Stock',
      value: `${currentStock} Units`,
      subtitle: 'Net physical stock in storage',
      icon: <StockIcon />,
      color: isLowStock ? 'error' : 'primary',
    },
    {
      title: 'Total Inward Quantity',
      value: `${summary?.totalInwardQuantity || 0} Units`,
      subtitle: 'Cumulative purchase stock received',
      icon: <InwardIcon />,
      color: 'info',
    },
    {
      title: 'Total Outward Quantity',
      value: `${summary?.totalOutwardQuantity || 0} Units`,
      subtitle: 'Cumulative sales stock dispatched',
      icon: <OutwardIcon />,
      color: 'success',
    },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Low Stock Warning Alert */}
      {isLowStock && (
        <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 4, borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Low Stock Warning Level
          </Typography>
          Current available stock is {currentStock} units (below the 50 units threshold). Consider submitting purchase inward entries to maintain operations.
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {summaryCards.map((card) => (
          <Grid item xs={12} md={4} key={card.title}>
            <Card>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {card.title}
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 800,
                      color: card.color === 'error' ? 'error.main' : 'text.primary',
                    }}
                  >
                    {card.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {card.subtitle}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    bgcolor: `${card.color}.light`,
                    color: `${card.color}.main`,
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.85,
                  }}
                >
                  {card.icon}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Stock Trend Chart */}
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
            Stock Balance History Trend (Last 30 Movements)
          </Typography>
          <Box sx={{ width: '100%', height: 350 }}>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f766e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="dateLabel" stroke="#94a3b8" style={{ fontSize: '0.8rem' }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '0.8rem' }} />
                  <Tooltip
                    formatter={(value: any, _name: any, props: any) => [
                      `${value} Units`,
                      `Closing Stock (Ref: ${props.payload.referenceNumber})`,
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="closingStock"
                    stroke="#0f766e"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorStock)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography color="text.secondary">No stock movement logs recorded yet</Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
export default StockSummary;
