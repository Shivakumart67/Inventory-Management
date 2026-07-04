import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
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
import { downloadBlob } from '../../utils/download';
import { useIsMobile } from '../../hooks/useIsMobile';

export const SalesList: React.FC = () => {
  const { config } = useSiteConfig();
  const currencySymbol = config?.currencySymbol || '₹';
  const isMobile = useIsMobile();

  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [search, setSearch] = useState('');
  const [buyer, setBuyer] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);

  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const response = await api.get('/sales', {
        params: {
          search,
          buyer,
          fromDate,
          toDate,
          page,
          limit: 10,
        },
      });
      if (response.data?.success) {
        setSales(response.data.sales);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchSales();
  };

  const handleClearFilters = () => {
    setSearch('');
    setBuyer('');
    setFromDate('');
    setToDate('');
    setPage(1);
    api.get('/sales', { params: { limit: 10, page: 1 } }).then((res) => {
      if (res.data?.success) {
        setSales(res.data.sales);
        setPagination(res.data.pagination);
      }
    });
  };

  const handleDownloadPDF = async (id: string, ref: string) => {
    try {
      const response = await api.get(`/sales/${id}/pdf`, { responseType: 'blob' });
      downloadBlob(new Blob([response.data], { type: 'application/pdf' }), `${ref}.pdf`);
    } catch (error) {
      console.error('PDF download error:', error);
      alert('Could not download sales invoice PDF');
    }
  };

  const handleRowClick = (sale: any) => {
    setSelectedSale(sale);
    setDetailsOpen(true);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Filters */}
      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <form onSubmit={handleSearchSubmit}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search Invoice"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    endAdornment: <SearchIcon fontSize="small" color="action" />,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Buyer Name"
                  value={buyer}
                  onChange={(e) => setBuyer(e.target.value)}
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

      {/* Sales List Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : sales.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No sales entries found.
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
                  <TableCell>Invoice Number</TableCell>
                  <TableCell>Buyer Name</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Selling Rate</TableCell>
                  <TableCell align="right">Total Sale</TableCell>
                  <TableCell>Created By</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sales.map((s) => (
                  <TableRow
                    key={s._id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleRowClick(s)}
                  >
                    <TableCell>{dayjs(s.salesDate).format('YYYY-MM-DD')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{s.invoiceNumber}</TableCell>
                    <TableCell>{s.buyerName}</TableCell>
                    <TableCell>{s.quantity} Units</TableCell>
                    <TableCell>{formatCurrency(s.unitSellingRate, currencySymbol)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {formatCurrency(s.totalSaleAmount, currencySymbol)}
                    </TableCell>
                    <TableCell>{s.createdBy?.name || 'System'}</TableCell>
                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <IconButton size="small" onClick={() => handleRowClick(s)} color="primary">
                          <ViewIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDownloadPDF(s._id, s.invoiceNumber)}
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

          {/* Mobile Card stack view */}
          <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 3 }}>
            {sales.map((s) => (
              <Card key={s._id} sx={{ mb: 2, cursor: 'pointer' }} onClick={() => handleRowClick(s)}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {s.invoiceNumber}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {dayjs(s.salesDate).format('YYYY-MM-DD')}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Buyer: {s.buyerName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Quantity: {s.quantity} Units | Rate: {formatCurrency(s.unitSellingRate, currencySymbol)}
                  </Typography>
                  <Divider sx={{ mb: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Total: {formatCurrency(s.totalSaleAmount, currencySymbol)}
                    </Typography>
                    <Box onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<PdfIcon />}
                        onClick={() => handleDownloadPDF(s._id, s.invoiceNumber)}
                      >
                        Invoice
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

      {/* Sale Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} fullWidth maxWidth="sm" fullScreen={isMobile}>
        {selectedSale && (
          <>
            <DialogTitle sx={{ fontWeight: 700 }}>
              Sales Invoice Details: {selectedSale.invoiceNumber}
            </DialogTitle>
            <DialogContent dividers sx={{ p: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Sales Date</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {dayjs(selectedSale.salesDate).format('YYYY-MM-DD')}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Buyer / Customer</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedSale.buyerName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Buyer Mobile</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedSale.buyerMobile || 'N/A'}
                  </Typography>
                </Grid>

                <Grid item xs={12}><Divider /></Grid>

                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">Quantity Sold</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedSale.quantity} Units
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">Selling Rate</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {formatCurrency(selectedSale.unitSellingRate, currencySymbol)}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">Total Sales Value</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {formatCurrency(selectedSale.totalSaleAmount, currencySymbol)}
                  </Typography>
                </Grid>

                {selectedSale.notes && (
                  <>
                    <Grid item xs={12}><Divider /></Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">Notes / Remarks</Typography>
                      <Typography variant="body2" sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: 1.5 }}>
                        {selectedSale.notes}
                      </Typography>
                    </Grid>
                  </>
                )}

                <Grid item xs={12}><Divider /></Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Created By</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {selectedSale.createdBy?.name} (@{selectedSale.createdBy?.username}) at {dayjs(selectedSale.createdAt).format('YYYY-MM-DD HH:mm')}
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<PdfIcon />}
                onClick={() => handleDownloadPDF(selectedSale._id, selectedSale.invoiceNumber)}
              >
                Download Invoice PDF
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
export default SalesList;
