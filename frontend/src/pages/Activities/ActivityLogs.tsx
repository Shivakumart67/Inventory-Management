import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
  Chip,
  Pagination,
  Button,
  Grid,
  TextField,
  MenuItem,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import dayjs from 'dayjs';

export const ActivityLogs: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
  });
  const [page, setPage] = useState(1);

  // Filter States
  const [action, setAction] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [search, setSearch] = useState('');

  const fetchLogs = async (pageOverride?: number) => {
    setLoading(true);
    try {
      const currentPage = pageOverride ?? page;

      const params: any = {
        page: currentPage,
        limit: 25,
      };

      if (action) params.action = action;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      if (search.trim()) params.search = search.trim();

      const response = await api.get('/activities', { params });

      if (response.data?.success) {
        setLogs(response.data.items || []);
        setPagination({
          total: response.data.total || 0,
          page: response.data.page || currentPage,
          pages: response.data.pages || 1,
        });
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (page !== 1) {
      setPage(1);
    } else {
      fetchLogs(1);
    }
  };

  const handleActionChange = (value: string) => {
    setAction(value);
    if (page !== 1) {
      setPage(1);
    } else {
      setTimeout(() => {
        fetchLogs(1);
      }, 0);
    }
  };

  const handleClearFilters = () => {
    setAction('');
    setFromDate('');
    setToDate('');
    setSearch('');

    if (page !== 1) {
      setPage(1);
    } else {
      setTimeout(() => {
        fetchLogs(1);
      }, 0);
    }
  };

  const getActionColor = (actionName: string) => {
    if (actionName?.includes('CREATE')) return 'success';
    if (actionName?.includes('LOGIN')) return 'info';
    if (actionName?.includes('RESET')) return 'warning';
    if (actionName?.includes('DELETE')) return 'error';
    return 'default';
  };

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 1, sm: 2 } }}>
      {/* Page Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
          mb: 3,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          System Audit Logs
        </Typography>

        <Button
          startIcon={<RefreshIcon />}
          variant="outlined"
          onClick={() => fetchLogs()}
          disabled={loading}
          sx={{
            width: { xs: '100%', sm: 'auto' },
            whiteSpace: 'nowrap',
          }}
        >
          Refresh
        </Button>
      </Box>

      {/* Filters Card */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <form onSubmit={handleFilterSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  select
                  size="small"
                  label="Action Category"
                  value={action}
                  onChange={(e) => handleActionChange(e.target.value)}
                >
                  <MenuItem value="">All Actions</MenuItem>
                  <MenuItem value="LOGIN">LOGIN</MenuItem>
                  <MenuItem value="LOGOUT">LOGOUT</MenuItem>
                  <MenuItem value="PURCHASE_CREATE">PURCHASE_CREATE</MenuItem>
                  <MenuItem value="SALE_CREATE">SALE_CREATE</MenuItem>
                  <MenuItem value="EXPENSE_CREATE">EXPENSE_CREATE</MenuItem>
                  <MenuItem value="USER_CREATE">USER_CREATE</MenuItem>
                  <MenuItem value="PASSWORD_RESET">PASSWORD_RESET</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search Details"
                  value={search}
                  placeholder="e.g. invoice, supplier"
                  onChange={(e) => setSearch(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
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

              <Grid item xs={12} sm={6} md={3}>
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

              <Grid item xs={12}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'flex-end',
                    gap: 1.5,
                    mt: 1,
                  }}
                >
                  <Button
                    variant="outlined"
                    onClick={handleClearFilters}
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                  >
                    Clear Filters
                  </Button>

                  <Button
                    variant="contained"
                    type="submit"
                    startIcon={<FilterIcon />}
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                  >
                    Filter
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : logs.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <Typography color="text.secondary">
            No activities logged matching the criteria.
          </Typography>
        </Card>
      ) : (
        <>
          {isMobile ? (
            // MOBILE / TABLET CARD VIEW
            <Grid container spacing={2}>
              {logs.map((log) => (
                <Grid item xs={12} key={log._id}>
                  <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
                    <CardContent sx={{ p: 2 }}>
                      {/* Top */}
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: 1.5,
                          mb: 2,
                        }}
                      >
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 700,
                              color: 'text.primary',
                              wordBreak: 'break-word',
                            }}
                          >
                            {log.user?.name || 'Deleted User'}
                          </Typography>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ wordBreak: 'break-word' }}
                          >
                            @{log.user?.username || 'unknown'}
                          </Typography>
                        </Box>

                        <Chip
                          label={log.action}
                          size="small"
                          color={getActionColor(log.action) as any}
                          sx={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            maxWidth: 160,
                          }}
                        />
                      </Box>

                      {/* Info Grid */}
                      <Grid container spacing={1.5}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary">
                            Timestamp
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 500,
                              wordBreak: 'break-word',
                            }}
                          >
                            {dayjs(log.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                          </Typography>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary">
                            Role
                          </Typography>
                          <Box sx={{ mt: 0.5 }}>
                            {log.user ? (
                              <Chip
                                label={log.user.role}
                                size="small"
                                color={
                                  log.user.role === 'ADMIN'
                                    ? 'secondary'
                                    : 'default'
                                }
                                sx={{
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                }}
                              />
                            ) : (
                              <Typography variant="body2">-</Typography>
                            )}
                          </Box>
                        </Grid>

                        <Grid item xs={12}>
                          <Typography variant="caption" color="text.secondary">
                            Operation Details
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 500,
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                            }}
                          >
                            {log.details || '-'}
                          </Typography>
                        </Grid>

                        <Grid item xs={12}>
                          <Typography variant="caption" color="text.secondary">
                            IP Address
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontStyle: 'italic',
                              color: 'text.secondary',
                              wordBreak: 'break-word',
                            }}
                          >
                            {log.ipAddress || '127.0.0.1'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            // DESKTOP TABLE VIEW
            <Card sx={{ mb: 3, borderRadius: 3 }}>
              <Box sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: 900 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Operator</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Action Category</TableCell>
                      <TableCell>Operation Details</TableCell>
                      <TableCell>IP Address</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log._id} hover>
                        <TableCell
                          sx={{
                            color: 'text.secondary',
                            whiteSpace: 'nowrap',
                            minWidth: 170,
                          }}
                        >
                          {dayjs(log.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                        </TableCell>

                        <TableCell sx={{ fontWeight: 600, minWidth: 180 }}>
                          <Typography
                            sx={{
                              fontWeight: 600,
                              wordBreak: 'break-word',
                            }}
                          >
                            {log.user?.name || 'Deleted User'}
                          </Typography>
                          <Typography
                            variant="caption"
                            display="block"
                            color="text.secondary"
                            sx={{ wordBreak: 'break-word' }}
                          >
                            @{log.user?.username || 'unknown'}
                          </Typography>
                        </TableCell>

                        <TableCell sx={{ minWidth: 110 }}>
                          {log.user ? (
                            <Chip
                              label={log.user.role}
                              size="small"
                              color={
                                log.user.role === 'ADMIN'
                                  ? 'secondary'
                                  : 'default'
                              }
                              sx={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                              }}
                            />
                          ) : (
                            '-'
                          )}
                        </TableCell>

                        <TableCell sx={{ minWidth: 160 }}>
                          <Chip
                            label={log.action}
                            size="small"
                            color={getActionColor(log.action) as any}
                            sx={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                            }}
                          />
                        </TableCell>

                        <TableCell
                          sx={{
                            minWidth: 280,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}
                        >
                          {log.details || '-'}
                        </TableCell>

                        <TableCell
                          sx={{
                            fontStyle: 'italic',
                            color: 'text.secondary',
                            minWidth: 140,
                            wordBreak: 'break-word',
                          }}
                        >
                          {log.ipAddress || '127.0.0.1'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Card>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                mt: 3,
                px: 1,
              }}
            >
              <Pagination
                count={pagination.pages}
                page={page}
                onChange={(_e, value) => setPage(value)}
                color="primary"
                size={isMobile ? 'small' : 'medium'}
                siblingCount={isMobile ? 0 : 1}
                boundaryCount={isMobile ? 1 : 2}
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default ActivityLogs;