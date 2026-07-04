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
  MenuItem,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import api from '../../services/api';
import dayjs from 'dayjs';
import { useSiteConfig } from '../../context/SiteConfigContext';

const expenseSchema = z.object({
  expenseDate: z.string().min(1, 'Date is required'),
  category: z.string().min(1, 'Category is required'),
  customCategory: z.string().optional(),
  subcategory: z.string().optional(),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  spentFor: z.string().min(3, 'Spent for title must be at least 3 characters'),
  description: z.string().optional(),
  billNumber: z.string().optional(),
  notes: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export const AddExpense: React.FC = () => {
  const navigate = useNavigate();
  const { config } = useSiteConfig();
  const currencySymbol = config?.currencySymbol || '₹';
  
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      expenseDate: dayjs().format('YYYY-MM-DD'),
      category: '',
      customCategory: '',
      subcategory: '',
      amount: 0,
      spentFor: '',
      description: '',
      billNumber: '',
      notes: '',
    },
  });

  const watchCategory = watch('category');

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const response = await api.get('/expenses/categories');
        if (response.data?.success) {
          setCategories(response.data.categories);
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      } finally {
        setLoadingCats(false);
      }
    };
    fetchCats();
  }, []);

  const onSubmit = async (data: ExpenseFormValues) => {
    // If Custom Category option chosen, validate and replace
    if (data.category === 'CUSTOM') {
      if (!data.customCategory || data.customCategory.trim() === '') {
        setError('customCategory', {
          type: 'custom',
          message: 'Please enter custom category name',
        });
        return;
      }
      data.category = data.customCategory.trim();
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await api.post('/expenses', data);
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
          New Expense Voucher Entry
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
              {/* Date & Title */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Expense Date"
                  {...register('expenseDate')}
                  error={!!errors.expenseDate}
                  helperText={errors.expenseDate?.message}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Title / Spent For"
                  placeholder="e.g. Electric Bill July"
                  {...register('spentFor')}
                  error={!!errors.spentFor}
                  helperText={errors.spentFor?.message}
                />
              </Grid>

              {/* Dynamic Categories Dropdown */}
              <Grid item xs={12} sm={6}>
                {loadingCats ? (
                  <CircularProgress size={24} />
                ) : (
                  <TextField
                    fullWidth
                    select
                    label="Expense Category"
                    {...register('category')}
                    error={!!errors.category}
                    helperText={errors.category?.message}
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat._id} value={cat.name}>
                        {cat.name}
                      </MenuItem>
                    ))}
                    <MenuItem value="CUSTOM" sx={{ fontWeight: 600, color: 'secondary.main' }}>
                      + Add New Category (Custom)
                    </MenuItem>
                  </TextField>
                )}
              </Grid>

              {/* Show Custom Category name input if chosen */}
              {watchCategory === 'CUSTOM' && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Custom Category Name"
                    placeholder="Enter category name"
                    {...register('customCategory')}
                    error={!!errors.customCategory}
                    helperText={errors.customCategory?.message}
                  />
                </Grid>
              )}

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Subcategory (Optional)"
                  placeholder="e.g. Office, Warehouse, Repair"
                  {...register('subcategory')}
                  error={!!errors.subcategory}
                  helperText={errors.subcategory?.message}
                />
              </Grid>

              {/* Amount */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  inputProps={{ step: 'any' }}
                  label={`Amount (${currencySymbol})`}
                  {...register('amount')}
                  error={!!errors.amount}
                  helperText={errors.amount?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Bill Number / Reference Number (Optional)"
                  placeholder="e.g. BILL-987"
                  {...register('billNumber')}
                />
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Voucher Description"
                  placeholder="Add detailed information about the expense"
                  {...register('description')}
                />
              </Grid>

              {/* Notes */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Notes / Remarks"
                  placeholder="e.g. Paid in cash by store lead"
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
                  {submitting ? 'Registering Expense...' : 'Save Expense Voucher'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      <Snackbar
        open={successToast}
        autoHideDuration={1500}
        onClose={() => setSuccessToast(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" sx={{ width: '100%' }}>
          Expense entry successfully saved! Redirecting...
        </Alert>
      </Snackbar>
    </Box>
  );
};
export default AddExpense;
