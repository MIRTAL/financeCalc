import {
  Alert, Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, MenuItem, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { categoriesApi, budgetsApi } from '../api/services';

import SvgIcon from '../utils/SvgIcon';
import ConfirmDialog from '../components/ConfirmDialog';
import { CATEGORY_TYPES, getErrorMessage } from '../utils/constants';

const iconModules = import.meta.glob('/public/icons/category/*.svg', { eager: true, query: '?url', import: 'default' });
const ICON_NAMES = Object.keys(iconModules).map((k) => {
  const parts = k.split('/');
  return parts[parts.length - 1].replace('.svg', '');
});

const emptyForm = { name: '', type: 'EXPENSE', icon: '' };

export default function CategoriesPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [confirmId, setConfirmId] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [nameError, setNameError] = useState(false);

  const filtered = filter === 'ALL' ? items : items.filter((c) => c.type === filter);
  const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name));

  const load = () => categoriesApi.list().then((r) => setItems(r.data)).catch((e) => setError(getErrorMessage(e)));
  useEffect(() => { load(); }, []);


  const openCreate = () => { setEditId(null); setForm(emptyForm); setError(''); setNameError(false); setOpen(true); };
  const openEdit = (item) => {
    setEditId(item.id);
    setForm({ name: item.name, type: item.type, icon: item.icon || '' });
    setError('');
    setNameError(false);
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!form.name.trim()) { setNameError(true); return; }
      setNameError(false);
      const payload = { ...form };
      if (editId) await categoriesApi.update(editId, payload);
      else {
        const res = await categoriesApi.create(payload);
        const cat = res.data;
        const now = new Date();
        const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const [y, m] = ym.split('-').map(Number);
        const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
        await budgetsApi.create({ categoryId: cat.id, amount: 0, startDate });
      }
      setOpen(false);
      load();
    } catch (e) { setError(getErrorMessage(e)); }
  };

  const handleDelete = async () => {
    try { await categoriesApi.remove(confirmId); load(); setConfirmId(null); } catch (e) { setError(getErrorMessage(e)); setConfirmId(null); }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Категории</Typography>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <Box display="flex" gap={2} alignItems="center" mb={1}>
        <TextField select size="small" value={filter} onChange={(e) => setFilter(e.target.value)} sx={{ minWidth: 200 }}>
          <MenuItem value="ALL">Все категории</MenuItem>
          <MenuItem value="INCOME">Доходы</MenuItem>
          <MenuItem value="EXPENSE">Расходы</MenuItem>
        </TextField>
        <Button variant="contained" startIcon={<SvgIcon name="Add" />} onClick={openCreate} sx={{ ml: 'auto' }}>Добавить</Button>
      </Box>
      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Название</TableCell>
              <TableCell>Тип</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SvgIcon name={item.icon} folder="category" sx={{ height: '40px', width: '40px' }} />
                    {item.name}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip label={item.type === 'INCOME' ? 'Доход' : 'Расход'} color={item.type === 'INCOME' ? 'success' : 'error'} size="small" />
                </TableCell>
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
        <DialogTitle>{editId ? 'Редактировать категорию' : 'Новая категория'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Название" margin="normal" required error={nameError} helperText={nameError ? 'Название обязательно' : ''} value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); if (nameError) setNameError(false); }} />
          <TextField fullWidth select label="Тип" margin="normal" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {CATEGORY_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
          </TextField>
          <TextField fullWidth select label="Иконка" margin="normal" value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
            SelectProps={{ MenuProps: { slotProps: { paper: { sx: { width: 320, p: 1 } } } } }}>
            <MenuItem value=""><em>Нет</em></MenuItem>
            {ICON_NAMES.map((name) => (
              <MenuItem key={name} value={name} sx={{ display: 'inline-flex', width: '20%', justifyContent: 'center', minHeight: 48 }}>
                <SvgIcon name={name} folder="category" sx={{ height: '24px', width: '24px' }} />
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleSave}>Сохранить</Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog open={!!confirmId} title="Удалить категорию?" message="Все связанные транзакции также будут удалены." onConfirm={handleDelete} onCancel={() => setConfirmId(null)} />
    </Box>
  );
}
