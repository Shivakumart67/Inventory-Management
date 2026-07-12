import React, { useState, useEffect } from 'react';
import {
  Grid,
  Box,
  Typography,
  Card,
  CardContent,
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
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Description as ExcelIcon,
  Article as CsvIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import dayjs from 'dayjs';
import { useSiteConfig } from '../../context/SiteConfigContext';

export const ReportsDashboard: React.FC = () => {
  const { config } = useSiteConfig();
  const currencySymbol = config?.currencySymbol || '₹';

  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('purchases');

  // Filter States
  const [fromDate, setFromDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [toDate, setToDate] = useState(dayjs().endOf('month').format('YYYY-MM-DD'));
  const [supplier, setSupplier] = useState('');
  const [buyer, setBuyer] = useState('');
  const [category, setCategory] = useState('');
  const [entryType, setEntryType] = useState('');

  // Results State
  const [reportData, setReportData] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);

  // Fetch categories for expense report selection
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const response = await api.get('/expenses/categories');
        if (response.data?.success) {
          setCategories(response.data.categories);
        }
      } catch (err) {
        console.error('Error loading expense categories:', err);
      }
    };
    fetchCats();
  }, []);

  // Fix: Reset report-specific filters when reportType changes to prevent API query bugs
  useEffect(() => {
    setSupplier('');
    setBuyer('');
    setCategory('');
    setEntryType('');
    setReportData(null);
    runQuery();
  }, [reportType]);

  const runQuery = async () => {
    setLoading(true);
    setReportData(null);
    try {
      let endpoint = `/reports/${reportType}`;
      const params: any = { fromDate, toDate };

      if (reportType === 'purchases') {
        if (supplier) params.supplier = supplier;
      } else if (reportType === 'sales') {
        if (buyer) params.buyer = buyer;
      } else if (reportType === 'expenses') {
        if (category) params.category = category;
      } else if (reportType === 'stock') {
        if (entryType) params.entryType = entryType;
      }

      const response = await api.get(endpoint, { params });
      if (response.data?.success) {
        setReportData(response.data);
      }
    } catch (error) {
      console.error('Failed to run report query:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runQuery();
  };

  const handleExport = async (format: 'excel' | 'csv') => {
    try {
      const params: any = { type: reportType, format, fromDate, toDate };

      if (reportType === 'purchases') {
        if (supplier) params.supplier = supplier;
      } else if (reportType === 'sales') {
        if (buyer) params.buyer = buyer;
      } else if (reportType === 'expenses') {
        if (category) params.category = category;
      } else if (reportType === 'stock') {
        if (entryType) params.entryType = entryType;
      }

      // Trigger file download stream
      const response = await api.get('/reports/export', { params, responseType: 'blob' });

      const fileExt = format === 'excel' ? 'xlsx' : 'csv';
      const contentType = format === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv';

      const blob = new Blob([response.data], { type: contentType });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `${reportType}_report_${dayjs().format('YYYYMMDD')}.${fileExt}`;
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Could not export report file');
    }
  };

  const renderSummaryCards = () => {
    if (!reportData?.summary) return null;
    const { summary } = reportData;

    if (reportType === 'purchases') {
      return (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6}>
            <SummaryTile title="Collected Eggs Quantity" value={`${summary.totalQuantity}`} color="primary" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <SummaryTile title="Total Collection Value" value={`${currencySymbol}${summary.totalAmount?.toFixed(2)}`} color="info" />
          </Grid>
        </Grid>
      );
    }

    if (reportType === 'sales') {
      return (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6}>
            <SummaryTile title="Sold Quantity" value={`${summary.totalQuantity} Units`} color="primary" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <SummaryTile title="Total Outward Value" value={`${currencySymbol}${summary.totalAmount?.toFixed(2)}`} color="success" />
          </Grid>
        </Grid>
      );
    }

    if (reportType === 'expenses') {
      return (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6}>
            <SummaryTile title="Total Expense Amount" value={`${currencySymbol}${summary.totalAmount?.toFixed(2)}`} color="error" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <SummaryTile title="Expense Voucher Count" value={`${summary.count} Vouchers`} color="info" />
          </Grid>
        </Grid>
      );
    }

    if (reportType === 'stock') {
      return (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <SummaryTile title="Current Available Stock" value={`${summary.currentStock} Units`} color="primary" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <SummaryTile title="Total Cumulative Inward" value={`${summary.totalInwardQuantity} Units`} color="info" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <SummaryTile title="Total Cumulative Outward" value={`${summary.totalOutwardQuantity} Units`} color="success" />
          </Grid>
        </Grid>
      );
    }

    return null;
  };

  const SummaryTile = ({ title, value, color }: any) => (
    <Card sx={{ bgcolor: `${color}.light`, color: `${color}.contrastText` }}>
      <CardContent sx={{ p: 2, textAlign: 'center', '&:last-child': { pb: 2 } }}>
        <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 700, opacity: 0.85 }}>
          {title}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 1, sm: 2 } }}>
      {/* 1. Header with Report Type toggle */}
      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Query Builder & Reports</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  size="small"
                  label="Select Report Module"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <MenuItem value="purchases">Egg Collection Report (Stock Inward)</MenuItem>
                  <MenuItem value="sales">Sales Report (Stock Outward)</MenuItem>
                  <MenuItem value="expenses">Expense Report</MenuItem>
                  <MenuItem value="stock">Stock Movement Ledger</MenuItem>
                </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 2. Filters Form */}
      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <form onSubmit={handleFilterSubmit}>
            <Grid container spacing={2} alignItems="center">
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

              {/* Purchase Specific Filters */}
              {reportType === 'purchases' && null}

              {/* Sales Specific Filters */}
              {reportType === 'sales' && (
                <Grid item xs={12} sm={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Buyer Name"
                    value={buyer}
                    onChange={(e) => setBuyer(e.target.value)}
                  />
                </Grid>
              )}

              {/* Expense Specific Filters */}
              {reportType === 'expenses' && (
                <Grid item xs={12} sm={12} md={6}>
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
              )}

              {/* Stock Ledger Specific Filters */}
              {reportType === 'stock' && (
                <Grid item xs={12} sm={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    size="small"
                    label="Ledger Entry Type"
                    value={entryType}
                    onChange={(e) => setEntryType(e.target.value)}
                  >
                    <MenuItem value="">All Entry Types</MenuItem>
                    <MenuItem value="PURCHASE">PURCHASE</MenuItem>
                    <MenuItem value="SALE">SALE</MenuItem>
                    <MenuItem value="ADJUSTMENT">ADJUSTMENT</MenuItem>
                  </TextField>
                </Grid>
              )}

              {/* Action Buttons */}
              <Grid item xs={12} sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', flexWrap: 'wrap', mt: 1 }}>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<ExcelIcon />}
                    onClick={() => handleExport('excel')}
                    disabled={loading || (!reportData?.items && !reportData?.ledgerItems)}
                  >
                    Export Excel
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<CsvIcon />}
                    onClick={() => handleExport('csv')}
                    disabled={loading || (!reportData?.items && !reportData?.ledgerItems)}
                  >
                    Export CSV
                  </Button>
                </Box>

                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Button variant="contained" type="submit" startIcon={<FilterIcon />}>
                    Generate Report
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      {/* 3. Summary Tiles Banner */}
      {renderSummaryCards()}

      {/* 4. Tabular Results */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : !reportData ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">Select parameters above and run query.</Typography>
        </Card>
      ) : (
        <>
        {/* Desktop / tablet table view */}
        <Card sx={{ display: { xs: 'none', md: 'block' } }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 650 }}>
              {/* PURCHASE HEADERS */}
              {reportType === 'purchases' && (
                <>
                  <TableHead>
                    <TableRow>
                      <TableCell>Collection Date</TableCell>
                      <TableCell>Ref Number</TableCell>
                      <TableCell align="right">Qty (Eggs)</TableCell>
                      <TableCell align="right">Rate</TableCell>
                      <TableCell align="right">Net Total</TableCell>
                      <TableCell>Manager</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.items?.length > 0 ? (
                      reportData.items.map((item: any) => (
                        <TableRow key={item._id} hover>
                          <TableCell>{dayjs(item.purchaseDate).format('DD MM YYYY HH:mm:ss')}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{item.referenceNumber}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">{currencySymbol}{item.ratePerUnit?.toFixed(2)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>{currencySymbol}{item.totalAmount?.toFixed(2)}</TableCell>
                          <TableCell>{item.createdBy?.name || 'System'}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={6} align="center">No collection entries matching criteria</TableCell></TableRow>
                    )}
                  </TableBody>
                </>
              )}

              {/* SALES HEADERS */}
              {reportType === 'sales' && (
                <>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Invoice Number</TableCell>
                      <TableCell>Buyer Name</TableCell>
                      <TableCell align="right">Qty Sold</TableCell>
                      <TableCell align="right">Selling Rate</TableCell>
                      <TableCell align="right">Net Sale</TableCell>
                      <TableCell>Manager</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.items?.length > 0 ? (
                      reportData.items.map((item: any) => (
                        <TableRow key={item._id} hover>
                          <TableCell>{dayjs(item.salesDate).format('DD MM YYYY HH:mm:ss')}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{item.invoiceNumber}</TableCell>
                          <TableCell>{item.buyerName}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">{currencySymbol}{item.unitSellingRate?.toFixed(2)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>{currencySymbol}{item.totalSaleAmount?.toFixed(2)}</TableCell>
                          <TableCell>{item.createdBy?.name || 'System'}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={7} align="center">No sales entries matching criteria</TableCell></TableRow>
                    )}
                  </TableBody>
                </>
              )}

              {/* EXPENSE HEADERS */}
              {reportType === 'expenses' && (
                <>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Voucher No</TableCell>
                      <TableCell>Title / Item</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Subcategory</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Bill Ref</TableCell>
                      <TableCell>Created By</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.items?.length > 0 ? (
                      reportData.items.map((item: any) => (
                        <TableRow key={item._id} hover>
                          <TableCell>{dayjs(item.expenseDate).format('DD MM YYYY HH:mm:ss')}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{item.voucherNumber}</TableCell>
                          <TableCell>{item.spentFor}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>{item.subcategory || 'N/A'}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: 'error.main' }}>
                            {currencySymbol}{item.amount?.toFixed(2)}
                          </TableCell>
                          <TableCell>{item.billNumber || 'N/A'}</TableCell>
                          <TableCell>{item.createdBy?.name || 'System'}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={8} align="center">No expense vouchers matching criteria</TableCell></TableRow>
                    )}
                  </TableBody>
                </>
              )}

              {/* STOCK HEADERS */}
              {reportType === 'stock' && (
                <>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Reference No</TableCell>
                      <TableCell align="right">In Qty</TableCell>
                      <TableCell align="right">Out Qty</TableCell>
                      <TableCell align="right">Closing Balance</TableCell>
                      <TableCell>Notes</TableCell>
                      <TableCell>Created By</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.ledgerItems?.length > 0 ? (
                      reportData.ledgerItems.map((item: any) => (
                        <TableRow key={item._id} hover>
                          <TableCell>{dayjs(item.date).format('DD MM YYYY HH:mm:ss')}</TableCell>
                          <TableCell>
                            <Chip
                              label={item.entryType === 'PURCHASE' ? 'COLLECTION' : item.entryType}
                              size="small"
                              color={
                                item.entryType === 'PURCHASE' ? 'info' :
                                  item.entryType === 'SALE' ? 'success' : 'default'
                              }
                              sx={{ fontSize: '0.65rem', fontWeight: 700 }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{item.referenceNumber}</TableCell>
                          <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>
                            {item.inQuantity > 0 ? `+${item.inQuantity}` : '-'}
                          </TableCell>
                          <TableCell align="right" sx={{ color: 'error.main', fontWeight: 600 }}>
                            {item.outQuantity > 0 ? `-${item.outQuantity}` : '-'}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main' }}>
                            {item.closingStock}
                          </TableCell>
                          <TableCell>{item.notes}</TableCell>
                          <TableCell>{item.createdBy?.name || 'System'}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={8} align="center">No stock ledger logs matching criteria</TableCell></TableRow>
                    )}
                  </TableBody>
                </>
              )}
            </Table>
          </Box>
        </Card>

        {/* Mobile card-stack view */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          {reportType === 'purchases' && (
            reportData.items?.length > 0 ? reportData.items.map((item: any) => (
              <Card key={item._id} sx={{ mb: 1.5 }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>{item.referenceNumber}</Typography>
                    <Typography variant="caption" color="text.secondary">{dayjs(item.purchaseDate).format('DD MM YYYY HH:mm:ss')}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">Qty: {item.quantity} @ {currencySymbol}{item.ratePerUnit?.toFixed(2)}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>Total: {currencySymbol}{item.totalAmount?.toFixed(2)}</Typography>
                </CardContent>
              </Card>
            )) : <Card sx={{ p: 3, textAlign: 'center' }}><Typography color="text.secondary">No collection entries matching criteria</Typography></Card>
          )}

          {reportType === 'sales' && (
            reportData.items?.length > 0 ? reportData.items.map((item: any) => (
              <Card key={item._id} sx={{ mb: 1.5 }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>{item.invoiceNumber}</Typography>
                    <Typography variant="caption" color="text.secondary">{dayjs(item.salesDate).format('DD MM YYYY HH:mm:ss')}</Typography>
                  </Box>
                  <Typography variant="body2">Buyer: {item.buyerName}</Typography>
                  <Typography variant="body2" color="text.secondary">Qty: {item.quantity} @ {currencySymbol}{item.unitSellingRate?.toFixed(2)}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>Total: {currencySymbol}{item.totalSaleAmount?.toFixed(2)}</Typography>
                </CardContent>
              </Card>
            )) : <Card sx={{ p: 3, textAlign: 'center' }}><Typography color="text.secondary">No sales entries matching criteria</Typography></Card>
          )}

          {reportType === 'expenses' && (
            reportData.items?.length > 0 ? reportData.items.map((item: any) => (
              <Card key={item._id} sx={{ mb: 1.5 }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>{item.voucherNumber}</Typography>
                    <Typography variant="caption" color="text.secondary">{dayjs(item.expenseDate).format('DD MM YYYY HH:mm:ss')}</Typography>
                  </Box>
                  <Typography variant="body2">{item.spentFor}</Typography>
                  <Typography variant="body2" color="text.secondary">{item.category}{item.subcategory ? ` / ${item.subcategory}` : ''}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5, color: 'error.main' }}>{currencySymbol}{item.amount?.toFixed(2)}</Typography>
                </CardContent>
              </Card>
            )) : <Card sx={{ p: 3, textAlign: 'center' }}><Typography color="text.secondary">No expense vouchers matching criteria</Typography></Card>
          )}

          {reportType === 'stock' && (
            reportData.ledgerItems?.length > 0 ? reportData.ledgerItems.map((item: any) => (
              <Card key={item._id} sx={{ mb: 1.5 }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Chip
                      label={item.entryType === 'PURCHASE' ? 'COLLECTION' : item.entryType}
                      size="small"
                      color={item.entryType === 'PURCHASE' ? 'info' : item.entryType === 'SALE' ? 'success' : 'default'}
                      sx={{ fontSize: '0.65rem', fontWeight: 700 }}
                    />
                    <Typography variant="caption" color="text.secondary">{dayjs(item.date).format('DD MM YYYY HH:mm:ss')}</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.referenceNumber}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    In: {item.inQuantity > 0 ? `+${item.inQuantity}` : '-'} &nbsp;|&nbsp; Out: {item.outQuantity > 0 ? `-${item.outQuantity}` : '-'}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main', mt: 0.5 }}>Closing: {item.closingStock}</Typography>
                </CardContent>
              </Card>
            )) : <Card sx={{ p: 3, textAlign: 'center' }}><Typography color="text.secondary">No stock ledger logs matching criteria</Typography></Card>
          )}
        </Box>
        </>
      )}
    </Box>
  );
};
export default ReportsDashboard;
