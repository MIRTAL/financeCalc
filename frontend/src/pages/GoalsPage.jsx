import {
  Alert, Box, Button, Card, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, LinearProgress, MenuItem, Table, TableBody, TableCell, TableHead, TableRow,
  TextField, Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { categoriesApi, goalsApi } from '../api/services';
import { useCurrency } from '../context/CurrencyContext';
import SvgIcon from '../utils/SvgIcon';
import MoneyDisplay from '../utils/MoneyDisplay';
import { formatDate, getErrorMessage, todayISO } from '../utils/constants';

const emptyForm = { name: '', targetAmount: '', targetDate: todayISO(), categoryId: '' };

export default function GoalsPage() {
  const { currency } = useCurrency();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [contrib, setContrib] = useState({ id: null, amount: '' });
  const [open, setOpen] = useState(false);
  const [openContrib, setOpenContrib] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [g, c] = await Promise.all([goalsApi.list(), categoriesApi.list()]);
      setItems(g.data);
      setCategories(c.data);
    } catch (e) { setError(getErrorMessage(e)); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    try {
      await goalsApi.create({
        ...form,
        targetAmount: Number(form.targetAmount),
        categoryId: form.categoryId ? Number(form.categoryId) : null,
      });
      setOpen(false);
      load();
    } catch (e) { setError(getErrorMessage(e)); }
  };

  const handleContribute = async () => {
    try {
      await goalsApi.contribute(contrib.id, Number(contrib.amount));
      setOpenContrib(false);
      load();
    } catch (e) { setError(getErrorMessage(e)); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить цель?')) return;
    try { await goalsApi.remove(id); load(); } catch (e) { setError(getErrorMessage(e)); }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Финансовые цели</Typography>
        <Button variant="contained" startIcon={<SvgIcon name="Add" />} onClick={() => setOpen(true)}>Добавить</Button>
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
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell><MoneyDisplay amount={item.targetAmount} currency={currency} /></TableCell>
                <TableCell><MoneyDisplay amount={item.currentAmount} currency={currency} /></TableCell>
                <TableCell>{formatDate(item.targetDate)}</TableCell>
                <TableCell sx={{ minWidth: 180 }}>
                  <LinearProgress variant="determinate" value={Math.min(item.progressPercent, 100)} color="secondary" />
                  <Typography variant="caption">{item.progressPercent.toFixed(0)}%</Typography>
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => { setContrib({ id: item.id, amount: '' }); setOpenContrib(true); }}><SvgIcon name="Savings" /></IconButton>
                  <IconButton color="error" onClick={() => handleDelete(item.id)}><SvgIcon name="Delete" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Новая цель</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Название" margin="normal" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField fullWidth label="Целевая сумма" type="number" margin="normal" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} />
          <TextField fullWidth label="Дата достижения" type="date" margin="normal" InputLabelProps={{ shrink: true }} value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} />
          <TextField fullWidth select label="Категория (опционально)" margin="normal" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
            <MenuItem value="">Нет</MenuItem>
            {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleSave}>Сохранить</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openContrib} onClose={() => setOpenContrib(false)} fullWidth maxWidth="xs">
        <DialogTitle>Пополнить цель</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Сумма" type="number" margin="normal" value={contrib.amount} onChange={(e) => setContrib({ ...contrib, amount: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenContrib(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleContribute}>Пополнить</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
