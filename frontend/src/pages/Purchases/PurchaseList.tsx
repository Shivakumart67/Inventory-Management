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

export const PurchaseList: React.FC = () => {
  const { config } = useSiteConfig();
  const currencySymbol = config?.currencySymbol || '₹';
  const isMobile = useIsMobile();

  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);

  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const response = await api.get('/purchases', {
        params: {
          search,
          fromDate,
          toDate,
          page,
          limit: 10,
        },
      });
      if (response.data?.success) {
        setPurchases(response.data.purchases);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPurchases();
  };

  const handleClearFilters = () => {
    setSearch('');
    setFromDate('');
    setToDate('');
    setPage(1);
    api.get('/purchases', { params: { limit: 10, page: 1 } }).then((res) => {
      if (res.data?.success) {
        setPurchases(res.data.purchases);
        setPagination(res.data.pagination);
      }
    });
  };

  const handleDownloadPDF = async (id: string, ref: string) => {
    try {
      const response = await api.get(`/purchases/${id}/pdf`, { responseType: 'blob' });
      downloadBlob(new Blob([response.data], { type: 'application/pdf' }), `${ref}.pdf`);
    } catch (error) {
      console.error('PDF download error:', error);
      alert('Could not download purchase PDF voucher');
    }
  };

  const handleRowClick = (purchase: any) => {
    setSelectedPurchase(purchase);
    setDetailsOpen(true);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Filters Card */}
      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <form onSubmit={handleSearchSubmit}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search Reference"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    endAdornment: <SearchIcon fontSize="small" color="action" />,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
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
              <Grid item xs={12} sm={4}>
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

      {/* Main Table view on desktop / Cards view on mobile */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : purchases.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No egg collection entries found.
          </Typography>
        </Card>
      ) : (
        <>
          {/* Desktop Table View */}
          <Card sx={{ display: { xs: 'none', md: 'block' }, mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Collection Date</TableCell>
                  <TableCell>Reference No</TableCell>
                  <TableCell>Quantity (Eggs)</TableCell>
                  <TableCell>Rate</TableCell>
                  <TableCell align="right">Total Value</TableCell>
                  <TableCell>Created By</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {purchases.map((p) => (
                  <TableRow
                    key={p._id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleRowClick(p)}
                  >
                    <TableCell>{dayjs(p.purchaseDate).format('DD MM YYYY HH:mm:ss')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{p.referenceNumber}</TableCell>
                    <TableCell>{p.quantity}</TableCell>
                    <TableCell>{formatCurrency(p.ratePerUnit, currencySymbol)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {formatCurrency(p.totalAmount, currencySymbol)}
                    </TableCell>
                    <TableCell>{p.createdBy?.name || 'System'}</TableCell>
                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <IconButton size="small" onClick={() => handleRowClick(p)} color="primary">
                          <ViewIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDownloadPDF(p._id, p.referenceNumber)}
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

          {/* Mobile Card Stack View */}
          <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 3 }}>
            {purchases.map((p) => (
              <Card key={p._id} sx={{ mb: 2, cursor: 'pointer' }} onClick={() => handleRowClick(p)}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {p.referenceNumber}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {dayjs(p.purchaseDate).format('DD MM YYYY HH:mm:ss')}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Quantity: {p.quantity} | Rate: {formatCurrency(p.ratePerUnit, currencySymbol)}
                  </Typography>
                  <Divider sx={{ mb: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Total: {formatCurrency(p.totalAmount, currencySymbol)}
                    </Typography>
                    <Box onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<PdfIcon />}
                        onClick={() => handleDownloadPDF(p._id, p.referenceNumber)}
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

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} fullWidth maxWidth="sm" fullScreen={isMobile}>
        {selectedPurchase && (
          <>
            <DialogTitle sx={{ fontWeight: 700 }}>
              Collection Details: {selectedPurchase.referenceNumber}
            </DialogTitle>
            <DialogContent dividers sx={{ p: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Collection Date</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {dayjs(selectedPurchase.purchaseDate).format('DD MM YYYY HH:mm:ss')}
                  </Typography>
                </Grid>

                <Grid item xs={12}><Divider /></Grid>

                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">Quantity (Eggs)</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedPurchase.quantity}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">Rate Per Egg</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {formatCurrency(selectedPurchase.ratePerUnit, currencySymbol)}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">Total Value</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {formatCurrency(selectedPurchase.totalAmount, currencySymbol)}
                  </Typography>
                </Grid>

                {selectedPurchase.notes && (
                  <>
                    <Grid item xs={12}><Divider /></Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">Notes / Remarks</Typography>
                      <Typography variant="body2" sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: 1.5 }}>
                        {selectedPurchase.notes}
                      </Typography>
                    </Grid>
                  </>
                )}

                <Grid item xs={12}><Divider /></Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Created By</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {selectedPurchase.createdBy?.name} (@{selectedPurchase.createdBy?.username}) at {dayjs(selectedPurchase.createdAt).format('DD MM YYYY HH:mm:ss')}
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<PdfIcon />}
                onClick={() => handleDownloadPDF(selectedPurchase._id, selectedPurchase.referenceNumber)}
              >
                Download PDF
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
export default PurchaseList;
