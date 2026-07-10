import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CategoryIcon from '@mui/icons-material/Category';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SavingsIcon from '@mui/icons-material/Savings';
import FlagIcon from '@mui/icons-material/Flag';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import LogoutIcon from '@mui/icons-material/Logout';
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CURRENCIES } from '../utils/constants';
import { useCurrency } from '../context/CurrencyContext';

const drawerWidth = 260;

const navItems = [
  { to: '/', label: 'Главная', icon: <DashboardIcon /> },
  { to: '/accounts', label: 'Счета', icon: <AccountBalanceWalletIcon /> },
  { to: '/categories', label: 'Категории', icon: <CategoryIcon /> },
  { to: '/transactions', label: 'Транзакции', icon: <ReceiptLongIcon /> },
  { to: '/budgets', label: 'Бюджеты', icon: <SavingsIcon /> },
  { to: '/goals', label: 'Цели', icon: <FlagIcon /> },
  { to: '/recurring', label: 'Периодические', icon: <AutorenewIcon /> },
];

export default function Layout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const navigate = useNavigate();

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar>
        <Typography variant="h6" fontWeight={700} color="primary">
          FinanceCalc
        </Typography>
      </Toolbar>
      <List sx={{ flex: 1, px: 1 }}>
        {navItems.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            end={item.to === '/'}
            onClick={() => setMobileOpen(false)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&.active': { bgcolor: 'primary.main', color: 'white', '& .MuiListItemIcon-root': { color: 'white' } },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
      <List sx={{ px: 1, pb: 2 }}>
        <ListItemButton
          onClick={() => {
            logout();
            navigate('/login');
          }}
          sx={{ borderRadius: 2 }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Выйти" />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Калькулятор финансов
          </Typography>
          <Select
            size="small"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            sx={{ mr: 2, minWidth: 80, '& .MuiSelect-select': { py: 0.5 } }}
          >
            {CURRENCIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </Select>
          <Typography variant="body2" color="text.secondary">
            {user?.username}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
