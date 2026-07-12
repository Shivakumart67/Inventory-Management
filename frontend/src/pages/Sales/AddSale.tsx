import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as ArrowBackIcon, Info as InfoIcon } from '@mui/icons-material';
import api from '../../services/api';
import dayjs from 'dayjs';
import { useSiteConfig } from '../../context/SiteConfigContext';

const salesSchema = z.object({
  salesDate: z.string().min(1, 'Date is required'),
  buyerName: z.string().min(2, 'Buyer name must be at least 2 characters'),
  buyerMobile: z.string().optional(),
  quantity: z.coerce.number().min(0.01, 'Quantity must be greater than 0'),
  unitSellingRate: z.coerce.number().min(0, 'Rate cannot be negative'),
  totalSaleAmount: z.coerce.number().optional(),
  notes: z.string().optional(),
});

type SalesFormValues = z.infer<typeof salesSchema>;

export const AddSale: React.FC = () => {
  const navigate = useNavigate();
  const { config } = useSiteConfig();
  const currencySymbol = config?.currencySymbol || '₹';
  
  const [submitting, setSubmitting] = useState(false);
  const [availableStock, setAvailableStock] = useState<number | null>(null);
  const [loadingStock, setLoadingStock] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<SalesFormValues>({
    resolver: zodResolver(salesSchema),
    defaultValues: {
      salesDate: dayjs().format('YYYY-MM-DD'),
      buyerName: '',
      buyerMobile: '',
      quantity: 0,
      unitSellingRate: 0,
      totalSaleAmount: 0,
      notes: '',
    },
  });

  const watchQuantity = watch('quantity');
  const watchRate = watch('unitSellingRate');

  // Fetch Available Stock from Backend
  useEffect(() => {
    const fetchStock = async () => {
      setLoadingStock(true);
      try {
        const response = await api.get('/stock/summary');
        if (response.data?.success) {
          setAvailableStock(response.data.summary?.currentStock || 0);
        }
      } catch (err) {
        console.error('Failed to load stock summary:', err);
        setSubmitError('Failed to retrieve current stock level. Please check connection.');
      } finally {
        setLoadingStock(false);
      }
    };
    fetchStock();
  }, []);

  // Autocalculate Net Totals
  useEffect(() => {
    const qty = Number(watchQuantity || 0);
    const rate = Number(watchRate || 0);
    const total = qty * rate;
    setValue('totalSaleAmount', total);
  }, [watchQuantity, watchRate, setValue]);

  const onSubmit = async (data: SalesFormValues) => {
    if (availableStock === null) {
      setSubmitError('Could not verify stock level. Submit blocked.');
      return;
    }

    // Critical Business Rule: Sales quantity must never exceed available stock
    if (data.quantity > availableStock) {
      setError('quantity', {
        type: 'custom',
        message: `Quantity exceeds available stock. Current available: ${availableStock} units.`,
      });
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await api.post('/sales', data);
      if (response.data?.success) {
        setSuccessToast(true);
        setTimeout(() => {
          navigate('/manager/dashboard');
        }, 1500);
      }
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, maxWidth: 800, mx: 'auto', p: { xs: 1, sm: 2 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          Back
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          New Sale (Outward Stock Entry)
        </Typography>
      </Box>

      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {submitError}
        </Alert>
      )}

      {/* Stock warning if zero stock */}
      {!loadingStock && availableStock === 0 && (
        <Alert severity="warning" icon={<InfoIcon />} sx={{ mb: 3 }}>
          Stock is currently empty. You cannot register any sales until a purchase entry is logged.
        </Alert>
      )}

      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              {/* Available Stock Indicator */}
              <Grid item xs={12}>
                <Box
                  sx={{
                    bgcolor: 'primary.light',
                    color: 'primary.contrastText',
                    p: 2,
                    borderRadius: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    opacity: 0.9,
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Available Stock
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    {loadingStock ? <CircularProgress size={20} color="inherit" /> : `${availableStock} Units`}
                  </Typography>
                </Box>
              </Grid>

              {/* Date & Buyer info */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Sales Date"
                  {...register('salesDate')}
                  error={!!errors.salesDate}
                  helperText={errors.salesDate?.message}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Buyer Name"
                  placeholder="e.g. John Doe"
                  {...register('buyerName')}
                  error={!!errors.buyerName}
                  helperText={errors.buyerName?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Buyer Mobile Number (Optional)"
                  placeholder="e.g. 9876543210"
                  {...register('buyerMobile')}
                  error={!!errors.buyerMobile}
                  helperText={errors.buyerMobile?.message}
                />
              </Grid>

              {/* Quantities & Pricing */}
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  type="number"
                  inputProps={{ step: 'any' }}
                  label="Quantity Sold"
                  {...register('quantity')}
                  error={!!errors.quantity}
                  helperText={errors.quantity?.message}
                  disabled={availableStock === 0}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  type="number"
                  inputProps={{ step: 'any' }}
                  label={`Unit Selling Rate (${currencySymbol})`}
                  {...register('unitSellingRate')}
                  error={!!errors.unitSellingRate}
                  helperText={errors.unitSellingRate?.message}
                  disabled={availableStock === 0}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  disabled
                  label={`Total Sales Value (${currencySymbol})`}
                  value={((watchQuantity || 0) * (watchRate || 0)).toFixed(2)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Notes */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Notes / Remarks"
                  placeholder="e.g. Special sales discounts, customer invoice tags, etc."
                  {...register('notes')}
                />
              </Grid>

              <Grid item xs={12} sx={{ mt: 2 }}>
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={submitting || availableStock === 0}
                  startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                >
                  {submitting ? 'Registering Sale...' : 'Save Sales Entry'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      {/* Success Notification */}
      <Snackbar
        open={successToast}
        autoHideDuration={1500}
        onClose={() => setSuccessToast(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="success"
          variant="filled"
          sx={{
            width: '100%',
            maxWidth: { xs: '90vw', sm: 400 },
            '& .MuiAlert-message': {
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              fontSize: '0.875rem'
            },
            boxShadow: 4,
            borderRadius: 2
          }}
        >
          Sales entry successfully saved! Redirecting...
        </Alert>
      </Snackbar>
    </Box>
  );
};
export default AddSale;
