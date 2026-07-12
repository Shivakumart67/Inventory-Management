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
import { Save as SaveIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import api from '../../services/api';
import dayjs from 'dayjs';
import { useSiteConfig } from '../../context/SiteConfigContext';

const purchaseSchema = z.object({
  purchaseDate: z.string().min(1, 'Collection date is required'),
  quantity: z.coerce.number().min(0.01, 'Quantity must be greater than 0'),
  ratePerUnit: z.coerce.number().min(0, 'Rate cannot be negative'),
  totalAmount: z.coerce.number().optional(),
  notes: z.string().optional(),
});

type PurchaseFormValues = z.infer<typeof purchaseSchema>;

export const AddPurchase: React.FC = () => {
  const navigate = useNavigate();
  const { config } = useSiteConfig();
  const currencySymbol = config?.currencySymbol || '₹';
  
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      purchaseDate: dayjs().format('YYYY-MM-DD'),
      quantity: 0,
      ratePerUnit: 0,
      totalAmount: 0,
      notes: '',
    },
  });

  const watchQuantity = watch('quantity');
  const watchRatePerUnit = watch('ratePerUnit');

  // Autocalculate Net Totals
  useEffect(() => {
    const qty = Number(watchQuantity || 0);
    const rate = Number(watchRatePerUnit || 0);
    const total = qty * rate;
    setValue('totalAmount', total);
  }, [watchQuantity, watchRatePerUnit, setValue]);

  const onSubmit = async (data: PurchaseFormValues) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await api.post('/purchases', data);
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
          New Egg Collection (Inward Stock Entry)
        </Typography>
      </Box>

      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {submitError}
        </Alert>
      )}

      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              {/* Date Info */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="date"
                  label="Collection Date"
                  {...register('purchaseDate')}
                  error={!!errors.purchaseDate}
                  helperText={errors.purchaseDate?.message}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Quantities & Pricing */}
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  inputProps={{ step: 'any' }}
                  label="Quantity Collected (Eggs)"
                  {...register('quantity')}
                  error={!!errors.quantity}
                  helperText={errors.quantity?.message}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  inputProps={{ step: 'any' }}
                  label={`Rate Per Egg (${currencySymbol})`}
                  {...register('ratePerUnit')}
                  error={!!errors.ratePerUnit}
                  helperText={errors.ratePerUnit?.message}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  disabled
                  label={`Total Amount (${currencySymbol})`}
                  value={((watchQuantity || 0) * (watchRatePerUnit || 0)).toFixed(2)}
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
                  placeholder="e.g. Broke details, collection point tags, etc."
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
                  disabled={submitting}
                  startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                >
                  {submitting ? 'Registering Collection...' : 'Save Collection Entry'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      {/* Success Toast */}
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
          Egg collection successfully saved! Redirecting...
        </Alert>
      </Snackbar>
    </Box>
  );
};
export default AddPurchase;
