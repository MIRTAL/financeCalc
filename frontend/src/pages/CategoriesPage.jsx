import {
  Alert, Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, MenuItem, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useEffect, useState } from 'react';
import { categoriesApi } from '../api/services';
import { CATEGORY_TYPES, getErrorMessage } from '../utils/constants';

const emptyForm = { name: '', type: 'EXPENSE', parentId: '', icon: '', color: '#2196f3' };

export default function CategoriesPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  const load = () => categoriesApi.list().then((r) => setItems(r.data)).catch((e) => setError(getErrorMessage(e)));
  useEffect(() => { load(); }, []);

  const parents = items.filter((c) => c.type === form.type && c.id !== editId);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (item) => {
    setEditId(item.id);
    setForm({ name: item.name, type: item.type, parentId: item.parentId || '', icon: item.icon || '', color: item.color || '#2196f3' });
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = { ...form, parentId: form.parentId || null };
      if (editId) await categoriesApi.update(editId, payload);
      else await categoriesApi.create(payload);
      setOpen(false);
      load();
    } catch (e) { setError(getErrorMessage(e)); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить категорию?')) return;
    try { await categoriesApi.remove(id); load(); } catch (e) { setError(getErrorMessage(e)); }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Категории</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Добавить</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Название</TableCell>
              <TableCell>Тип</TableCell>
              <TableCell>Родитель</TableCell>
              <TableCell>Цвет</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>
                  <Chip label={item.type === 'INCOME' ? 'Доход' : 'Расход'} color={item.type === 'INCOME' ? 'success' : 'error'} size="small" />
                </TableCell>
                <TableCell>{item.parentId ? items.find(p => p.id === item.parentId)?.name || '—' : '—'}</TableCell>
                <TableCell><Box sx={{ width: 24, height: 24, borderRadius: 1, bgcolor: item.color }} /></TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => openEdit(item)}><EditIcon /></IconButton>
                  <IconButton color="error" onClick={() => handleDelete(item.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editId ? 'Редактировать категорию' : 'Новая категория'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Название" margin="normal" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField fullWidth select label="Тип" margin="normal" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, parentId: '' })}>
            {CATEGORY_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
          </TextField>
          <TextField fullWidth select label="Родительская категория" margin="normal" value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
            <MenuItem value="">Нет</MenuItem>
            {parents.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
          </TextField>
          <TextField fullWidth label="Иконка (MUI name)" margin="normal" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
          <TextField fullWidth label="Цвет" type="color" margin="normal" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleSave}>Сохранить</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
