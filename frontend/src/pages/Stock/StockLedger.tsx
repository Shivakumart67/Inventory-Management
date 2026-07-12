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
  Chip,
  Pagination,
  Divider,
} from '@mui/material';
import { FilterList as FilterIcon } from '@mui/icons-material';
import api from '../../services/api';
import dayjs from 'dayjs';

export const StockLedger: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [ledger, setLedger] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [entryType, setEntryType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const response = await api.get('/stock/ledger', {
        params: {
          entryType,
          fromDate,
          toDate,
          page,
          limit: 15,
        },
      });
      if (response.data?.success) {
        setLedger(response.data.ledger);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching stock ledger:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [page, entryType]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLedger();
  };

  const handleClearFilters = () => {
    setEntryType('');
    setFromDate('');
    setToDate('');
    setPage(1);
    api.get('/stock/ledger', { params: { limit: 15, page: 1 } }).then((res) => {
      if (res.data?.success) {
        setLedger(res.data.ledger);
        setPagination(res.data.pagination);
      }
    });
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Filter Controls */}
      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <form onSubmit={handleFilterSubmit}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  select
                  size="small"
                  label="Entry Type"
                  value={entryType}
                  onChange={(e) => setEntryType(e.target.value)}
                >
                  <MenuItem value="">All Movements</MenuItem>
                  <MenuItem value="PURCHASE">EGG COLLECTION (Inward)</MenuItem>
                  <MenuItem value="SALE">SALE (Outward)</MenuItem>
                  <MenuItem value="ADJUSTMENT">ADJUSTMENT</MenuItem>
                </TextField>
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

      {/* Ledger Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : ledger.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No stock ledger history entries found.
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
                  <TableCell>Movement Type</TableCell>
                  <TableCell>Reference No</TableCell>
                  <TableCell align="right">Qty In</TableCell>
                  <TableCell align="right">Qty Out</TableCell>
                  <TableCell align="right">Closing Balance</TableCell>
                  <TableCell>Operator</TableCell>
                  <TableCell>Movement Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ledger.map((l) => (
                  <TableRow key={l._id} hover>
                    <TableCell>{dayjs(l.date).format('DD MM YYYY HH:mm:ss')}</TableCell>
                    <TableCell>
                      <Chip
                        label={l.entryType === 'PURCHASE' ? 'COLLECTION' : l.entryType}
                        size="small"
                        color={
                          l.entryType === 'PURCHASE' ? 'info' :
                          l.entryType === 'SALE' ? 'success' : 'default'
                        }
                        sx={{ fontSize: '0.7rem', fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{l.referenceNumber}</TableCell>
                    <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>
                      {l.inQuantity > 0 ? `+${l.inQuantity}` : '-'}
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'error.main', fontWeight: 600 }}>
                      {l.outQuantity > 0 ? `-${l.outQuantity}` : '-'}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {l.closingStock}
                    </TableCell>
                    <TableCell>{l.createdBy?.name || 'System'}</TableCell>
                    <TableCell color="text.secondary">{l.notes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile Card stack view */}
          <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 3 }}>
            {ledger.map((l) => (
              <Card key={l._id} sx={{ mb: 2 }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {dayjs(l.date).format('DD MM YYYY HH:mm:ss')}
                    </Typography>
                    <Chip
                      label={l.entryType === 'PURCHASE' ? 'COLLECTION' : l.entryType}
                      size="small"
                      color={
                        l.entryType === 'PURCHASE' ? 'info' :
                        l.entryType === 'SALE' ? 'success' : 'default'
                      }
                      sx={{ fontSize: '0.65rem', fontWeight: 700 }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Ref: {l.referenceNumber}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    {l.notes}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Grid container spacing={1}>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">Inward</Typography>
                      <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>
                        {l.inQuantity > 0 ? `+${l.inQuantity}` : '-'}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">Outward</Typography>
                      <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 600 }}>
                        {l.outQuantity > 0 ? `-${l.outQuantity}` : '-'}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">Closing Stock</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {l.closingStock}
                      </Typography>
                    </Grid>
                  </Grid>
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
    </Box>
  );
};
export default StockLedger;
