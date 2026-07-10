import {
  Alert, Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, MenuItem, Tab, Tabs, Table, TableBody, TableCell, TableHead, TableRow,
  TextField, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { useEffect, useState } from 'react';
import { accountsApi, categoriesApi, transactionsApi } from '../api/services';
import { formatDate, formatMoney, getErrorMessage, todayISO, TRANSACTION_TYPES } from '../utils/constants';

export default function TransactionsPage() {
  const [tab, setTab] = useState(0);
  const [items, setItems] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ accountId: '', categoryId: '', amount: '', type: 'EXPENSE', transactionDate: todayISO(), description: '' });
  const [transfer, setTransfer] = useState({ fromAccountId: '', toAccountId: '', amount: '', transactionDate: todayISO(), description: '' });

  const load = async () => {
    try {
      const [tx, acc, cat] = await Promise.all([transactionsApi.list(), accountsApi.list(), categoriesApi.list()]);
      setItems(tx.data);
      setAccounts(acc.data);
      setCategories(cat.data);
    } catch (e) { setError(getErrorMessage(e)); }
  };

  useEffect(() => { load(); }, []);

  const filteredCategories = categories.filter((c) =>
    form.type === 'INCOME' ? c.type === 'INCOME' : c.type === 'EXPENSE'
  );

  const handleCreate = async () => {
    try {
      await transactionsApi.create({
        ...form,
        accountId: Number(form.accountId),
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        amount: Number(form.amount),
      });
      setOpen(false);
      load();
    } catch (e) { setError(getErrorMessage(e)); }
  };

  const handleTransfer = async () => {
    try {
      await transactionsApi.create({
        accountId: Number(transfer.fromAccountId),
        targetAccountId: Number(transfer.toAccountId),
        amount: Number(transfer.amount),
        transactionDate: transfer.transactionDate,
        description: transfer.description,
        type: 'TRANSFER',
      });
      setOpen(false);
      load();
    } catch (e) { setError(getErrorMessage(e)); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить транзакцию?')) return;
    try { await transactionsApi.remove(id); load(); } catch (e) { setError(getErrorMessage(e)); }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Транзакции</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setTab(0); setOpen(true); }}>Добавить</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Дата</TableCell>
              <TableCell>Тип</TableCell>
              <TableCell>Счёт</TableCell>
              <TableCell>Категория</TableCell>
              <TableCell>Сумма</TableCell>
              <TableCell>Описание</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{formatDate(item.transactionDate)}</TableCell>
                <TableCell>
                  <Chip
                    label={item.type === 'TRANSFER' ? 'Перевод' : item.type === 'INCOME' ? 'Доход' : 'Расход'}
                    color={item.type === 'INCOME' ? 'success' : item.type === 'EXPENSE' ? 'error' : 'info'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{item.accountName}</TableCell>
                <TableCell>{item.categoryName || '—'}</TableCell>
                <TableCell>{formatMoney(item.amount)}</TableCell>
                <TableCell>{item.description || '—'}</TableCell>
                <TableCell align="right">
                  <IconButton color="error" onClick={() => handleDelete(item.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Новая операция</DialogTitle>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3 }}>
          <Tab label="Доход/Расход" />
          <Tab label="Перевод" icon={<SwapHorizIcon />} iconPosition="start" />
        </Tabs>
        <DialogContent>
          {tab === 0 ? (
            <>
              <TextField fullWidth select label="Тип" margin="normal" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, categoryId: '' })}>
                {TRANSACTION_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
              <TextField fullWidth select label="Счёт" margin="normal" value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })}>
                {accounts.map((a) => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
              </TextField>
              <TextField fullWidth select label="Категория" margin="normal" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                {filteredCategories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
              <TextField fullWidth label="Сумма" type="number" margin="normal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              <TextField fullWidth label="Дата" type="date" margin="normal" InputLabelProps={{ shrink: true }} value={form.transactionDate} onChange={(e) => setForm({ ...form, transactionDate: e.target.value })} />
              <TextField fullWidth label="Описание" margin="normal" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </>
          ) : (
            <>
              <TextField fullWidth select label="Со счёта" margin="normal" value={transfer.fromAccountId} onChange={(e) => setTransfer({ ...transfer, fromAccountId: e.target.value })}>
                {accounts.map((a) => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
              </TextField>
              <TextField fullWidth select label="На счёт" margin="normal" value={transfer.toAccountId} onChange={(e) => setTransfer({ ...transfer, toAccountId: e.target.value })}>
                {accounts.map((a) => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
              </TextField>
              <TextField fullWidth label="Сумма" type="number" margin="normal" value={transfer.amount} onChange={(e) => setTransfer({ ...transfer, amount: e.target.value })} />
              <TextField fullWidth label="Дата" type="date" margin="normal" InputLabelProps={{ shrink: true }} value={transfer.transactionDate} onChange={(e) => setTransfer({ ...transfer, transactionDate: e.target.value })} />
              <TextField fullWidth label="Описание" margin="normal" value={transfer.description} onChange={(e) => setTransfer({ ...transfer, description: e.target.value })} />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={tab === 0 ? handleCreate : handleTransfer}>Сохранить</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
