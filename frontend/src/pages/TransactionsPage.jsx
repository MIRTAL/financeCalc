import {
  Alert, Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, MenuItem, Tab, Tabs, Table, TableBody, TableCell, TableHead, TableRow,
  TextField, Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { accountsApi, categoriesApi, transactionsApi } from '../api/services';
import { useCurrency } from '../context/CurrencyContext';
import SvgIcon from '../utils/SvgIcon';
import MoneyDisplay from '../utils/MoneyDisplay';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatDate, getErrorMessage, todayISO, TRANSACTION_TYPES } from '../utils/constants';

export default function TransactionsPage() {
  const { currency } = useCurrency();
  const [tab, setTab] = useState(0);
  const [items, setItems] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ accountId: '', categoryId: '', amount: '', type: 'EXPENSE', transactionDate: todayISO(), description: '' });
  const [transfer, setTransfer] = useState({ fromAccountId: '', toAccountId: '', amount: '', transactionDate: todayISO(), description: '' });
  const [confirmId, setConfirmId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [filterTab, setFilterTab] = useState(0);

  const filtered = filterTab === 0 ? items : items.filter((t) => t.type === (filterTab === 1 ? 'INCOME' : 'EXPENSE'));

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
      const payload = {
        ...form,
        accountId: Number(form.accountId),
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        amount: Number(form.amount),
      };
      if (editId) await transactionsApi.update(editId, payload);
      else await transactionsApi.create(payload);
      setOpen(false);
      setEditId(null);
      load();
    } catch (e) { setError(getErrorMessage(e)); }
  };

  const handleTransfer = async () => {
    try {
      const payload = {
        accountId: Number(transfer.fromAccountId),
        targetAccountId: Number(transfer.toAccountId),
        amount: Number(transfer.amount),
        transactionDate: transfer.transactionDate,
        description: transfer.description,
        type: 'TRANSFER',
      };
      if (editId) await transactionsApi.update(editId, payload);
      else await transactionsApi.create(payload);
      setOpen(false);
      setEditId(null);
      load();
    } catch (e) { setError(getErrorMessage(e)); }
  };

  const handleDelete = async () => {
    try { await transactionsApi.remove(confirmId); load(); setConfirmId(null); } catch (e) { setError(getErrorMessage(e)); setConfirmId(null); }
  };

  const openCreate = () => { setEditId(null); setForm({ accountId: '', categoryId: '', amount: '', type: 'EXPENSE', transactionDate: todayISO(), description: '' }); setTab(0); setOpen(true); };
  const openEdit = (item) => {
    setEditId(item.id);
    setForm({
      accountId: item.accountId?.toString() || '',
      categoryId: item.categoryId?.toString() || '',
      amount: item.amount?.toString() || '',
      type: item.type === 'TRANSFER' ? 'EXPENSE' : item.type,
      transactionDate: item.transactionDate || todayISO(),
      description: item.description || '',
    });
    setTab(0);
    setOpen(true);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Транзакции</Typography>
        <Button variant="contained" startIcon={<SvgIcon name="Add" />} onClick={openCreate}>Добавить</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <Tabs value={filterTab} onChange={(_, v) => setFilterTab(v)} sx={{ mb: 1 }}>
        <Tab label="Все транзакции" />
        <Tab label="Доходы" />
        <Tab label="Расходы" />
      </Tabs>
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
            {filtered.map((item) => (
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
                <TableCell><MoneyDisplay amount={item.amount} currency={currency} /></TableCell>
                <TableCell>{item.description || '—'}</TableCell>
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
        <DialogTitle>{editId ? 'Редактировать операцию' : 'Новая операция'}</DialogTitle>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3 }}>
          <Tab label="Доход/Расход" />
          <Tab label="Перевод" icon={<SvgIcon name="SwapHoriz" />} iconPosition="start" />
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
              <TextField fullWidth label="Описание" margin="normal" multiline rows={3} inputProps={{ maxLength: 255 }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
              <TextField fullWidth label="Описание" margin="normal" multiline rows={3} inputProps={{ maxLength: 255 }} value={transfer.description} onChange={(e) => setTransfer({ ...transfer, description: e.target.value })} />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpen(false); setEditId(null); }}>Отмена</Button>
          <Button variant="contained" onClick={tab === 0 ? handleCreate : handleTransfer}>Сохранить</Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog open={!!confirmId} title="Удалить транзакцию?" onConfirm={handleDelete} onCancel={() => setConfirmId(null)} />
    </Box>
  );
}
