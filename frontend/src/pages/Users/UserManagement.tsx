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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  PersonAdd as AddIcon,
  ToggleOn as ActiveIcon,
  ToggleOff as DeactiveIcon,
  LockReset as KeyIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import dayjs from 'dayjs';

export const UserManagement: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  // Dialog States
  const [createOpen, setCreateOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Create Form Fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  // Reset Password Field
  const [resetPassword, setResetPassword] = useState('');

  const [dialogError, setDialogError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users', { params: { search } });
      if (response.data?.success) {
        setUsers(response.data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setDialogError(null);

    if (!name || !username || !password) {
      setDialogError('Name, username, and password are required');
      return;
    }

    try {
      const response = await api.post('/users', {
        name,
        username,
        password,
        mobile,
        email,
        address,
        role: 'MANAGER',
      });

      if (response.data?.success) {
        setCreateOpen(false);

        // Clear fields
        setName('');
        setUsername('');
        setPassword('');
        setMobile('');
        setEmail('');
        setAddress('');
        setDialogError(null);

        fetchUsers();
      }
    } catch (error: any) {
      setDialogError(error.response?.data?.message || 'Could not register manager');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setDialogError(null);

    if (!resetPassword || resetPassword.length < 4) {
      setDialogError('Password must be at least 4 characters long');
      return;
    }

    try {
      const response = await api.patch(`/users/${selectedUser?._id}/reset-password`, {
        password: resetPassword,
      });

      if (response.data?.success) {
        setResetOpen(false);
        setResetPassword('');
        setDialogError(null);
        alert('Password successfully reset');
      }
    } catch (error: any) {
      setDialogError(error.response?.data?.message || 'Password reset failed');
    }
  };

  const handleToggleStatus = async (user: any) => {
    const nextStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const confirmChange = window.confirm(
      `Are you sure you want to set status of ${user.name} to ${nextStatus}?`
    );
    if (!confirmChange) return;

    try {
      const response = await api.patch(`/users/${user._id}/status`, { status: nextStatus });
      if (response.data?.success) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Toggle status error:', error);
      alert('Failed to modify user status');
    }
  };

  const openResetDialog = (user: any) => {
    setSelectedUser(user);
    setResetPassword('');
    setDialogError(null);
    setResetOpen(true);
  };

  const openCreateDialog = () => {
    setDialogError(null);
    setCreateOpen(true);
  };

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 1, sm: 2, md: 0 } }}>
      {/* Search + Action Bar */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent
          sx={{
            p: { xs: 2, sm: 3 },
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', md: 'center' },
            gap: 2,
          }}
        >
          <Box
            component="form"
            onSubmit={handleSearchSubmit}
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 1.5,
              flex: 1,
              width: '100%',
            }}
          >
            <TextField
              fullWidth
              size="small"
              label="Search Users"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                endAdornment: <SearchIcon fontSize="small" color="action" />,
              }}
            />
            <Button
              variant="outlined"
              type="submit"
              sx={{
                minWidth: { xs: '100%', sm: 120 },
                whiteSpace: 'nowrap',
              }}
            >
              Search
            </Button>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreateDialog}
            sx={{
              width: { xs: '100%', md: 'auto' },
              whiteSpace: 'nowrap',
            }}
          >
            Create Inventory Manager
          </Button>
        </CardContent>
      </Card>

      {/* Loading / Empty / Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : users.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <Typography color="text.secondary">No users found</Typography>
        </Card>
      ) : isMobile ? (
        // MOBILE / TABLET CARD VIEW
        <Grid container spacing={2}>
          {users.map((u) => (
            <Grid item xs={12} key={u._id}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: 2,
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  {/* Top Row */}
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
                        variant="subtitle1"
                        sx={{
                          fontWeight: 700,
                          wordBreak: 'break-word',
                        }}
                      >
                        {u.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ wordBreak: 'break-word' }}
                      >
                        @{u.username}
                      </Typography>
                    </Box>

                    <Chip
                      label={u.status}
                      size="small"
                      color={u.status === 'ACTIVE' ? 'success' : 'error'}
                      variant="outlined"
                      sx={{ fontSize: '0.72rem', fontWeight: 700 }}
                    />
                  </Box>

                  {/* User Details */}
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Mobile
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {u.mobile || 'N/A'}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Email
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          wordBreak: 'break-word',
                        }}
                      >
                        {u.email || 'N/A'}
                      </Typography>
                    </Grid>

                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Role
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip
                          label={u.role}
                          size="small"
                          color={u.role === 'ADMIN' ? 'secondary' : 'default'}
                          sx={{ fontSize: '0.72rem', fontWeight: 700 }}
                        />
                      </Box>
                    </Grid>

                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Created
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {dayjs(u.createdAt).format('YYYY-MM-DD')}
                      </Typography>
                    </Grid>
                  </Grid>

                  {/* Actions */}
                  <Box
                    sx={{
                      mt: 2,
                      pt: 1.5,
                      borderTop: '1px solid',
                      borderColor: 'divider',
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: 1,
                    }}
                  >
                    <IconButton
                      size="small"
                      color={u.status === 'ACTIVE' ? 'error' : 'success'}
                      onClick={() => handleToggleStatus(u)}
                      title={u.status === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'}
                    >
                      {u.status === 'ACTIVE' ? <DeactiveIcon /> : <ActiveIcon />}
                    </IconButton>

                    <IconButton
                      size="small"
                      color="secondary"
                      onClick={() => openResetDialog(u)}
                      title="Reset Account Password"
                    >
                      <KeyIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        // DESKTOP TABLE VIEW
        <Card sx={{ borderRadius: 3 }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 950 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Full Name</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Mobile Number</TableCell>
                  <TableCell>Email Address</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Created Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {users.map((u) => (
                  <TableRow key={u._id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{u.name}</TableCell>
                    <TableCell>@{u.username}</TableCell>
                    <TableCell>{u.mobile || 'N/A'}</TableCell>
                    <TableCell>{u.email || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        label={u.role}
                        size="small"
                        color={u.role === 'ADMIN' ? 'secondary' : 'default'}
                        sx={{ fontSize: '0.7rem', fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell>{dayjs(u.createdAt).format('YYYY-MM-DD')}</TableCell>
                    <TableCell>
                      <Chip
                        label={u.status}
                        size="small"
                        color={u.status === 'ACTIVE' ? 'success' : 'error'}
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <IconButton
                          size="small"
                          color={u.status === 'ACTIVE' ? 'error' : 'success'}
                          onClick={() => handleToggleStatus(u)}
                          title={u.status === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'}
                        >
                          {u.status === 'ACTIVE' ? <DeactiveIcon /> : <ActiveIcon />}
                        </IconButton>

                        <IconButton
                          size="small"
                          color="secondary"
                          onClick={() => openResetDialog(u)}
                          title="Reset Account Password"
                        >
                          <KeyIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Card>
      )}

      {/* Create User Dialog */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
      >
        <form onSubmit={handleCreateUser}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            Register Inventory Manager
          </DialogTitle>

          <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
            {dialogError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {dialogError}
              </Alert>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  size="small"
                  label="Full Name"
                  placeholder="e.g. David Miller"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  size="small"
                  label="Username"
                  placeholder="e.g. davidm"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  type="password"
                  size="small"
                  label="Password"
                  placeholder="At least 4 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Mobile Number (Optional)"
                  placeholder="e.g. 9876543210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Email Address (Optional)"
                  placeholder="e.g. david@corp.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  size="small"
                  label="Postal Address (Optional)"
                  placeholder="Enter manager location details"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions
            sx={{
              p: 2,
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 1,
            }}
          >
            <Button
              variant="outlined"
              onClick={() => setCreateOpen(false)}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              type="submit"
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Register User
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        fullWidth
        maxWidth="xs"
        fullScreen={isMobile}
      >
        <form onSubmit={handleResetPassword}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            Reset Password{selectedUser?.name ? `: ${selectedUser.name}` : ''}
          </DialogTitle>

          <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
            {dialogError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {dialogError}
              </Alert>
            )}

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Configure a new password for account username:{' '}
              <strong>@{selectedUser?.username}</strong>
            </Typography>

            <TextField
              fullWidth
              required
              type="password"
              size="small"
              label="New Password"
              placeholder="At least 4 characters"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
            />
          </DialogContent>

          <DialogActions
            sx={{
              p: 2,
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 1,
            }}
          >
            <Button
              variant="outlined"
              onClick={() => setResetOpen(false)}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="secondary"
              type="submit"
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Reset Password
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default UserManagement;