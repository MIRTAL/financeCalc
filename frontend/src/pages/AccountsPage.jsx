import {
  Alert, Box, Button, Card, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, MenuItem, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { accountsApi } from '../api/services';
import SvgIcon from '../utils/SvgIcon';
import MoneyDisplay from '../utils/MoneyDisplay';
import ConfirmDialog from '../components/ConfirmDialog';
import { ACCOUNT_TYPES, CURRENCIES, getErrorMessage } from '../utils/constants';

const emptyForm = { name: '', type: 'CASH', initialBalance: '', currency: 'RUB' };

export default function AccountsPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [confirmId, setConfirmId] = useState(null);

  const load = () => accountsApi.list().then((r) => setItems(r.data)).catch((e) => setError(getErrorMessage(e)));

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (item) => {
    setEditId(item.id);
    setForm({ name: item.name, type: item.type, initialBalance: item.initialBalance, currency: item.currency });
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = { ...form, initialBalance: Number(form.initialBalance) };
      if (editId) await accountsApi.update(editId, payload);
      else await accountsApi.create(payload);
      setOpen(false);
      load();
    } catch (e) { setError(getErrorMessage(e)); }
  };

  const handleDelete = async () => {
    try { await accountsApi.remove(confirmId); load(); setConfirmId(null); } catch (e) { setError(getErrorMessage(e)); setConfirmId(null); }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Счета</Typography>
        <Button variant="contained" startIcon={<SvgIcon name="Add" />} onClick={openCreate}>Добавить</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Название</TableCell>
              <TableCell>Тип</TableCell>
              <TableCell>Баланс</TableCell>
              <TableCell>Валюта</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {item.type === 'E_WALLET' ? (
                      <Box component="img" src="/icons/ewallet.png" alt="ewallet" sx={{ height: 40, width: 40 }} />
                    ) : (
                      <SvgIcon
                        name={item.type === 'BANK_CARD' ? 'credit-card' : 'money-cash'}
                        sx={{ height: '40px', width: '40px'}}
                      />
                    )}
                    {item.name}
                  </Box>
                </TableCell>
                <TableCell>{ACCOUNT_TYPES.find((t) => t.value === item.type)?.label}</TableCell>
                <TableCell><MoneyDisplay amount={item.currentBalance} currency={item.currency} /></TableCell>
                <TableCell>{item.currency}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => openEdit(item)}><SvgIcon name="Edit" /></IconButton>
                  <IconButton color="error" onClick={() => setConfirmId(item.id)}><SvgIcon name="Delete" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editId ? 'Редактировать счёт' : 'Новый счёт'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Название" margin="normal" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField fullWidth select label="Тип" margin="normal" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {ACCOUNT_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
          </TextField>
          {!editId && (
            <TextField fullWidth label="Начальный баланс" type="number" margin="normal" value={form.initialBalance} onChange={(e) => setForm({ ...form, initialBalance: e.target.value })} />
          )}
          <TextField fullWidth select label="Валюта" margin="normal" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
            {CURRENCIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleSave}>Сохранить</Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog open={!!confirmId} title="Удалить счёт?" onConfirm={handleDelete} onCancel={() => setConfirmId(null)} />
    </Box>
  );
}
