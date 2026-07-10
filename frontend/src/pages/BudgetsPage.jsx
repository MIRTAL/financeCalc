import {
  Alert, Box, Button, Card, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, LinearProgress, MenuItem, Table, TableBody, TableCell, TableHead, TableRow,
  TextField, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useEffect, useState } from 'react';
import { budgetsApi, categoriesApi } from '../api/services';
import { BUDGET_PERIODS, formatMoney, getErrorMessage, todayISO } from '../utils/constants';

const emptyForm = { categoryId: '', amount: '', period: 'MONTHLY', startDate: todayISO() };

export default function BudgetsPage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [b, c] = await Promise.all([budgetsApi.list(), categoriesApi.list()]);
      setItems(b.data);
      setCategories(c.data.filter((cat) => cat.type === 'EXPENSE'));
    } catch (e) { setError(getErrorMessage(e)); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    try {
      await budgetsApi.create({ ...form, categoryId: Number(form.categoryId), amount: Number(form.amount) });
      setOpen(false);
      load();
    } catch (e) { setError(getErrorMessage(e)); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить бюджет?')) return;
    try { await budgetsApi.remove(id); load(); } catch (e) { setError(getErrorMessage(e)); }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Бюджеты</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>Добавить</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Категория</TableCell>
              <TableCell>Лимит</TableCell>
              <TableCell>Потрачено</TableCell>
              <TableCell>Период</TableCell>
              <TableCell>Прогресс</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.categoryName}</TableCell>
                <TableCell>{formatMoney(item.amount)}</TableCell>
                <TableCell>{formatMoney(item.spent)}</TableCell>
                <TableCell>{item.period === 'MONTHLY' ? 'Месяц' : 'Год'}</TableCell>
                <TableCell sx={{ minWidth: 180 }}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(item.progressPercent, 100)}
                    color={item.progressPercent >= 100 ? 'error' : item.progressPercent >= 80 ? 'warning' : 'primary'}
                  />
                  <Typography variant="caption">{item.progressPercent.toFixed(0)}%</Typography>
                </TableCell>
                <TableCell align="right">
                  <IconButton color="error" onClick={() => handleDelete(item.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Новый бюджет</DialogTitle>
        <DialogContent>
          <TextField fullWidth select label="Категория" margin="normal" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
            {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </TextField>
          <TextField fullWidth label="Сумма" type="number" margin="normal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <TextField fullWidth select label="Период" margin="normal" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })}>
            {BUDGET_PERIODS.map((p) => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
          </TextField>
          <TextField fullWidth label="Дата начала" type="date" margin="normal" InputLabelProps={{ shrink: true }} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleSave}>Сохранить</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
