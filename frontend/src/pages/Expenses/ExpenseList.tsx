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
  TableHead,
  TableRow,
  CircularProgress,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Search as SearchIcon,
  PictureAsPdf as PdfIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import dayjs from 'dayjs';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { formatCurrency } from '../../utils/format';
import { triggerDownload } from '../../utils/download';
import { useIsMobile } from '../../hooks/useIsMobile';

export const ExpenseList: React.FC = () => {
  const { config } = useSiteConfig();
  const currencySymbol = config?.currencySymbol || '₹';
  const isMobile = useIsMobile();

  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);

  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await api.get('/expenses', {
        params: {
          search,
          category,
          fromDate,
          toDate,
          page,
          limit: 10,
        },
      });
      if (response.data?.success) {
        setExpenses(response.data.expenses);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/expenses/categories');
      if (response.data?.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Error loading expense categories:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [page, category]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchExpenses();
  };

  const handleClearFilters = () => {
    setSearch('');
    setCategory('');
    setFromDate('');
    setToDate('');
    setPage(1);
    api.get('/expenses', { params: { limit: 10, page: 1 } }).then((res) => {
      if (res.data?.success) {
        setExpenses(res.data.expenses);
        setPagination(res.data.pagination);
      }
    });
  };

  const handleDownloadPDF = async (id: string) => {
    try {
      triggerDownload(`/expenses/${id}/pdf`);
    } catch (error) {
      console.error('PDF download error:', error);
      alert('Could not download expense PDF voucher');
    }
  };

  const handleRowClick = (expense: any) => {
    setSelectedExpense(expense);
    setDetailsOpen(true);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Filters */}
      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <form onSubmit={handleSearchSubmit}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search Voucher"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    endAdornment: <SearchIcon fontSize="small" color="action" />,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4} md={3}>
                <TextField
                  fullWidth
                  select
                  size="small"
                  label="Expense Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat._id} value={cat.name}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4} md={3}>
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
              <Grid item xs={12} sm={4} md={3}>
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
              <Grid item xs={12} sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 1 }}>
                <Button variant="outlined" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
                <Button variant="contained" type="submit" startIcon={<FilterIcon />}>
                  Filter
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      {/* Main Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : expenses.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No expense entries found.
          </Typography>
        </Card>
      ) : (
        <>
          {/* Desktop Table View */}
          <Card sx={{ display: { xs: 'none', md: 'block' }, mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Voucher No</TableCell>
                  <TableCell>spent For</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Subcategory</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Created By</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {expenses.map((e) => (
                  <TableRow
                    key={e._id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleRowClick(e)}
                  >
                    <TableCell>{dayjs(e.expenseDate).format('DD/MM/YYYY')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{e.voucherNumber}</TableCell>
                    <TableCell>{e.spentFor}</TableCell>
                    <TableCell>{e.category}</TableCell>
                    <TableCell>{e.subcategory || 'N/A'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: 'error.main' }}>
                      {formatCurrency(e.amount, currencySymbol)}
                    </TableCell>
                    <TableCell>{e.createdBy?.name || 'System'}</TableCell>
                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <IconButton size="small" onClick={() => handleRowClick(e)} color="primary">
                          <ViewIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDownloadPDF(e._id)}
                          color="secondary"
                        >
                          <PdfIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile Card Stack */}
          <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 3 }}>
            {expenses.map((e) => (
              <Card key={e._id} sx={{ mb: 2, cursor: 'pointer' }} onClick={() => handleRowClick(e)}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'error.main' }}>
                      {e.voucherNumber}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {dayjs(e.expenseDate).format('DD/MM/YYYY')}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Title: {e.spentFor}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Category: {e.category}
                  </Typography>
                  <Divider sx={{ mb: 1, mt: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'error.main' }}>
                      Amount: {formatCurrency(e.amount, currencySymbol)}
                    </Typography>
                    <Box onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<PdfIcon />}
                        onClick={() => handleDownloadPDF(e._id)}
                      >
                        Voucher
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={pagination.pages}
                page={page}
                onChange={(_e, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Expense Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} fullWidth maxWidth="sm" fullScreen={isMobile}>
        {selectedExpense && (
          <>
            <DialogTitle sx={{ fontWeight: 700 }}>
              Expense Voucher Details: {selectedExpense.voucherNumber}
            </DialogTitle>
            <DialogContent dividers sx={{ p: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Expense Date</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {dayjs(selectedExpense.expenseDate).format('DD/MM/YYYY')}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Voucher Amount</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: 'error.main' }}>
                    {formatCurrency(selectedExpense.amount, currencySymbol)}
                  </Typography>
                </Grid>

                <Grid item xs={12}><Divider /></Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Category</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedExpense.category}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Subcategory</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedExpense.subcategory || 'N/A'}
                  </Typography>
                </Grid>

                <Grid item xs={12}><Divider /></Grid>

                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">spent For / Title</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedExpense.spentFor}
                  </Typography>
                </Grid>

                {selectedExpense.description && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Description</Typography>
                    <Typography variant="body2">{selectedExpense.description}</Typography>
                  </Grid>
                )}

                {selectedExpense.billNumber && (
                  <>
                    <Grid item xs={12}><Divider /></Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">Bill / Ref Number</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {selectedExpense.billNumber}
                      </Typography>
                    </Grid>
                  </>
                )}

                {selectedExpense.notes && (
                  <>
                    <Grid item xs={12}><Divider /></Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">Notes / Remarks</Typography>
                      <Typography variant="body2" sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: 1.5 }}>
                        {selectedExpense.notes}
                      </Typography>
                    </Grid>
                  </>
                )}

                <Grid item xs={12}><Divider /></Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Created By</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {selectedExpense.createdBy?.name} (@{selectedExpense.createdBy?.username}) at {dayjs(selectedExpense.createdAt).format('DD/MM/YYYY')}
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<PdfIcon />}
                onClick={() => handleDownloadPDF(selectedExpense._id)}
              >
                Download Voucher PDF
              </Button>
              <Button variant="outlined" onClick={() => setDetailsOpen(false)}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};
export default ExpenseList;
