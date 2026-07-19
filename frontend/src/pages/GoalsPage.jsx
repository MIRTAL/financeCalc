import {
  Alert, Box, Button, Card, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, LinearProgress, Menu, MenuItem, Table, TableBody, TableCell, TableHead, TableRow,
  TextField, Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { accountsApi, goalsApi } from '../api/services';
import { useCurrency } from '../context/CurrencyContext';
import SvgIcon from '../utils/SvgIcon';
import MoneyDisplay from '../utils/MoneyDisplay';
import { formatDate, getErrorMessage, todayISO } from '../utils/constants';

const emptyForm = { name: '', targetAmount: '', targetDate: todayISO() };

export default function GoalsPage() {
  const { currency } = useCurrency();
  const [items, setItems] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [open, setOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState(''); // contribute | withdraw | spend
  const [dialogGoalId, setDialogGoalId] = useState(null);
  const [dialogAmount, setDialogAmount] = useState('');
  const [dialogAccountId, setDialogAccountId] = useState('');
  const [error, setError] = useState('');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuGoalId, setMenuGoalId] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  const load = async () => {
    try {
      const [g, a] = await Promise.all([goalsApi.list(), accountsApi.list()]);
      setItems(g.data);
      setAccounts(a.data);
    } catch (e) { setError(getErrorMessage(e)); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    try {
      const payload = { ...form, targetAmount: Number(form.targetAmount) };
      if (editId) await goalsApi.update(editId, payload);
      else await goalsApi.create(payload);
      setOpen(false);
      load();
    } catch (e) { setError(getErrorMessage(e)); }
  };

  const openCreate = () => { setEditId(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (item) => { setEditId(item.id); setForm({ name: item.name, targetAmount: item.targetAmount, targetDate: item.targetDate }); setOpen(true); };

  const handleDialogAction = async () => {
    try {
      const amount = Number(dialogAmount);
      const accountId = Number(dialogAccountId);
      if (dialogMode === 'contribute') await goalsApi.contribute(dialogGoalId, amount, accountId);
      else if (dialogMode === 'withdraw') await goalsApi.withdraw(dialogGoalId, amount, accountId);
      else await goalsApi.spend(dialogGoalId, amount, accountId);
      setOpenDialog(false);
      load();
    } catch (e) { setError(getErrorMessage(e)); }
  };

  const openActionDialog = (mode) => {
    const moneyBox = accounts.find((a) => a.type === 'MONEY_BOX');
    setDialogMode(mode);
    setDialogGoalId(menuGoalId);
    setDialogAmount('');
    setDialogAccountId(moneyBox?.id?.toString() || '');
    setMenuAnchor(null);
    setOpenDialog(true);
  };

  const dialogTitle = dialogMode === 'contribute' ? 'Пополнить цель'
    : dialogMode === 'withdraw' ? 'Снять с цели'
    : 'Потратить с цели';

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Финансовые цели</Typography>
        <Button variant="contained" startIcon={<SvgIcon name="Add" />} onClick={openCreate}>Добавить</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Название</TableCell>
              <TableCell>Цель</TableCell>
              <TableCell>Накоплено</TableCell>
              <TableCell>Дата</TableCell>
              <TableCell>Прогресс</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => {
              const overdue = item.targetDate && item.targetDate < today;
              return (
              <TableRow key={item.id} sx={overdue ? { bgcolor: '#ffebee', '&:hover': { bgcolor: '#ffcdd2' } } : {}}>
                <TableCell>{item.name}</TableCell>
                <TableCell><MoneyDisplay amount={item.targetAmount} currency={currency} /></TableCell>
                <TableCell><MoneyDisplay amount={item.currentAmount} currency={currency} /></TableCell>
                <TableCell>{formatDate(item.targetDate)}</TableCell>
                <TableCell sx={{ minWidth: 180 }}>
                  <LinearProgress variant="determinate" value={Math.min(item.progressPercent, 100)} color="secondary" />
                  <Typography variant="caption">{item.progressPercent.toFixed(0)}%</Typography>
                </TableCell>
                <TableCell align="right">
                  {overdue && (
                    <IconButton onClick={() => openEdit(item)}><SvgIcon name="Edit" /></IconButton>
                  )}
                  <IconButton onClick={(e) => { setMenuAnchor(e.currentTarget); setMenuGoalId(item.id); }}>
                    <SvgIcon name="more-vertical" />
                  </IconButton>
                  <Menu anchorEl={menuAnchor} open={!!menuAnchor && menuGoalId === item.id} onClose={() => { setMenuAnchor(null); setMenuGoalId(null); }}>
                    <MenuItem onClick={() => openActionDialog('contribute')}>Пополнить</MenuItem>
                    <MenuItem onClick={() => openActionDialog('withdraw')}>Взять</MenuItem>
                    <MenuItem onClick={() => openActionDialog('spend')}>Потратить</MenuItem>
                  </Menu>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editId ? 'Редактировать цель' : 'Новая цель'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Название" margin="normal" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField fullWidth label="Целевая сумма" type="number" margin="normal" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} />
          <TextField fullWidth label="Дата достижения" type="date" margin="normal" InputLabelProps={{ shrink: true }} value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleSave}>Сохранить</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="xs">
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
          <TextField fullWidth select label={dialogMode === 'contribute' ? 'Со счёта' : 'На счёт'} margin="normal" value={dialogAccountId} onChange={(e) => setDialogAccountId(e.target.value)}>
            {accounts.filter((a) => a.type !== 'MONEY_BOX').map((a) => (
              <MenuItem key={a.id} value={a.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {a.type === 'E_WALLET' ? (
                    <Box component="img" src="/icons/ewallet.png" alt="ewallet" sx={{ height: 20, width: 20, filter: 'brightness(0.6)' }} />
                  ) : (
                    <SvgIcon name={a.type === 'BANK_CARD' ? 'credit-card' : 'money-cash'} sx={{ height: '20px', width: '20px', filter: 'brightness(0.6)' }} />
                  )}
                  {a.name}
                </Box>
              </MenuItem>
            ))}
          </TextField>
          <TextField fullWidth label="Сумма" type="number" margin="normal" value={dialogAmount} onChange={(e) => setDialogAmount(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleDialogAction}>Подтвердить</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
