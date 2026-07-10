import {
  Alert, Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, MenuItem, Switch, FormControlLabel, Table, TableBody, TableCell, TableHead, TableRow,
  TextField, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useEffect, useState } from 'react';
import { accountsApi, categoriesApi, recurringApi } from '../api/services';
import { formatDate, formatMoney, getErrorMessage, RECURRENCE_FREQUENCIES, todayISO, TRANSACTION_TYPES } from '../utils/constants';

const emptyForm = {
  accountId: '', categoryId: '', amount: '', type: 'EXPENSE', frequency: 'MONTHLY',
  startDate: todayISO(), description: '',
};

export default function RecurringPage() {
  const [items, setItems] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [r, a, c] = await Promise.all([recurringApi.list(), accountsApi.list(), categoriesApi.list()]);
      setItems(r.data);
      setAccounts(a.data);
      setCategories(c.data);
    } catch (e) { setError(getErrorMessage(e)); }
  };

  useEffect(() => { load(); }, []);

  const filteredCategories = categories.filter((cat) =>
    form.type === 'INCOME' ? cat.type === 'INCOME' : cat.type === 'EXPENSE'
  );

  const handleSave = async () => {
    try {
      await recurringApi.create({
        ...form,
        accountId: Number(form.accountId),
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        amount: Number(form.amount),
      });
      setOpen(false);
      load();
    } catch (e) { setError(getErrorMessage(e)); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить периодическую операцию?')) return;
    try { await recurringApi.remove(id); load(); } catch (e) { setError(getErrorMessage(e)); }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Периодические операции</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>Добавить</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Тип</TableCell>
              <TableCell>Счёт</TableCell>
              <TableCell>Категория</TableCell>
              <TableCell>Сумма</TableCell>
              <TableCell>Частота</TableCell>
              <TableCell>Следующий запуск</TableCell>
              <TableCell>Активна</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Chip label={item.type === 'INCOME' ? 'Доход' : 'Расход'} color={item.type === 'INCOME' ? 'success' : 'error'} size="small" />
                </TableCell>
                <TableCell>{item.accountName}</TableCell>
                <TableCell>{item.categoryName || '—'}</TableCell>
                <TableCell>{formatMoney(item.amount)}</TableCell>
                <TableCell>{RECURRENCE_FREQUENCIES.find((f) => f.value === item.frequency)?.label}</TableCell>
                <TableCell>{formatDate(item.nextDate)}</TableCell>
                <TableCell>{item.active ? 'Да' : 'Нет'}</TableCell>
                <TableCell align="right">
                  <IconButton color="error" onClick={() => handleDelete(item.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Новая периодическая операция</DialogTitle>
        <DialogContent>
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
          <TextField fullWidth select label="Частота" margin="normal" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
            {RECURRENCE_FREQUENCIES.map((f) => <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>)}
          </TextField>
          <TextField fullWidth label="Дата начала" type="date" margin="normal" InputLabelProps={{ shrink: true }} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          <TextField fullWidth label="Описание" margin="normal" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <FormControlLabel control={<Switch defaultChecked />} label="Активна" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleSave}>Сохранить</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
