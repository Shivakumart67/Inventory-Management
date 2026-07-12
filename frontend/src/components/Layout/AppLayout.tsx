import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  ShoppingCart as ShoppingCartIcon,
  MonetizationOn as MonetizationOnIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  Inventory as InventoryIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  History as HistoryIcon,
  ExitToApp as ExitToAppIcon,
  AddBox as AddBoxIcon,
  ReceiptLong as ReceiptLongIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useSiteConfig } from '../../context/SiteConfigContext';

const drawerWidth = 240; // reduced from 260 for better mobile screen space

interface MenuItemData {
  text: string;
  path: string;
  icon: React.ReactNode;
  roles: Array<'ADMIN' | 'MANAGER'>;
}

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { config } = useSiteConfig();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleProfileMenuClose();
    await logout();
  };

  const menuItems: MenuItemData[] = [
    // ADMIN MENUS
    {
      text: 'Dashboard',
      path: '/admin/dashboard',
      icon: <DashboardIcon />,
      roles: ['ADMIN'],
    },
    {
      text: 'MIS Dashboard',
      path: '/admin/mis-dashboard',
      icon: <AssessmentIcon />,
      roles: ['ADMIN'],
    },
    {
      text: 'Egg Collections',
      path: '/admin/purchases',
      icon: <ShoppingCartIcon />,
      roles: ['ADMIN'],
    },
    {
      text: 'Sales List',
      path: '/admin/sales',
      icon: <MonetizationOnIcon />,
      roles: ['ADMIN'],
    },
    {
      text: 'Expenses List',
      path: '/admin/expenses',
      icon: <AccountBalanceWalletIcon />,
      roles: ['ADMIN'],
    },
    {
      text: 'Stock Summary',
      path: '/admin/stock-summary',
      icon: <InventoryIcon />,
      roles: ['ADMIN'],
    },
    {
      text: 'Stock Ledger',
      path: '/admin/stock-ledger',
      icon: <ReceiptLongIcon />,
      roles: ['ADMIN'],
    },
    {
      text: 'Export Reports',
      path: '/admin/reports',
      icon: <AssessmentIcon />,
      roles: ['ADMIN'],
    },
    {
      text: 'User Management',
      path: '/admin/users',
      icon: <PeopleIcon />,
      roles: ['ADMIN'],
    },
    {
      text: 'Activity Logs',
      path: '/admin/activities',
      icon: <HistoryIcon />,
      roles: ['ADMIN'],
    },

    // MANAGER MENUS
    {
      text: 'My Dashboard',
      path: '/manager/dashboard',
      icon: <DashboardIcon />,
      roles: ['MANAGER'],
    },
    {
      text: 'MIS Dashboard',
      path: '/manager/mis-dashboard',
      icon: <AssessmentIcon />,
      roles: ['MANAGER'],
    },
    {
      text: 'Add Egg Collection',
      path: '/manager/add-purchase',
      icon: <AddBoxIcon />,
      roles: ['MANAGER'],
    },
    {
      text: 'Add Sale',
      path: '/manager/add-sale',
      icon: <MonetizationOnIcon />,
      roles: ['MANAGER'],
    },
    {
      text: 'Add Expense',
      path: '/manager/add-expense',
      icon: <AccountBalanceWalletIcon />,
      roles: ['MANAGER'],
    },
    {
      text: 'My Egg Collections',
      path: '/manager/my-purchases',
      icon: <ShoppingCartIcon />,
      roles: ['MANAGER'],
    },
    {
      text: 'My Sales',
      path: '/manager/my-sales',
      icon: <ReceiptLongIcon />,
      roles: ['MANAGER'],
    },
    {
      text: 'My Expenses',
      path: '/manager/my-expenses',
      icon: <ReceiptLongIcon />,
      roles: ['MANAGER'],
    },
    {
      text: 'Export Reports',
      path: '/manager/my-reports',
      icon: <AssessmentIcon />,
      roles: ['MANAGER'],
    },
  ];

  const filteredMenuItems = menuItems.filter((item) => user && item.roles.includes(user.role));

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ justifyContent: 'center', py: 1.5 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', px: 2 }}>
          <Typography variant="h6" align="center" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: 0.5, fontSize: '1.05rem', lineHeight: 1.2 }}>
            {config?.companyName || 'Business Management System'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mt: 0.5 }}>
            Management Panel
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      
      {/* Sidebar Nav Items */}
      <List sx={{ px: 1, py: 2, flexGrow: 1 }}>
        {filteredMenuItems.map((item) => {
          const isSelected = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 2,
                  bgcolor: isSelected ? 'primary.light' : 'transparent',
                  color: isSelected ? 'primary.contrastText' : 'text.primary',
                  '&:hover': {
                    bgcolor: isSelected ? 'primary.light' : 'rgba(15, 118, 110, 0.08)',
                  },
                  '& .MuiListItemIcon-root': {
                    color: isSelected ? 'primary.contrastText' : 'primary.main',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: isSelected ? 600 : 500 }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider />
      
      {/* User Info footer in sidebar */}
      {user && (
        <Box sx={{ p: 2, bgcolor: '#f8fafc', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: '0.9rem' }}>
            {user.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
              {user.name}
            </Typography>
            <Chip
              label={user.role}
              size="small"
              color={user.role === 'ADMIN' ? 'secondary' : 'default'}
              sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
            />
          </Box>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <CssBaseline />
      
      {/* Top Navbar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {filteredMenuItems.find((item) => item.path === location.pathname)?.text || 'Operations Panel'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              onClick={handleProfileMenuOpen}
              sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.primary' }}
            >
              <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                {user?.name.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 600 }}>
                {user?.name}
              </Typography>
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              sx={{ '& .MuiPaper-root': { width: 180, mt: 1.5 } }}
            >
              <MenuItem disabled sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 1.5 }}>
                <Typography variant="caption" color="text.secondary">Logged in as</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{user?.username}</Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                <ListItemIcon sx={{ color: 'error.main', minWidth: 30 }}><ExitToAppIcon fontSize="small" /></ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer containers */}
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        {/* Mobile View */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawerContent}
        </Drawer>
        {/* Desktop View */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid #e2e8f0' },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Workspace content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Spacer matching the fixed AppBar's actual height at the current breakpoint */}
        <Toolbar />
        <Box sx={{ flexGrow: 1, p: { xs: 1.5, sm: 3 } }}>{children}</Box>
      </Box>
    </Box>
  );
};
export default AppLayout;
