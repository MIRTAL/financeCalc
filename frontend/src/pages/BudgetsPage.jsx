import {
  Alert, Box, Button, Card, Dialog, DialogActions, DialogContent, DialogTitle,
  LinearProgress, Table, TableBody, TableCell, TableHead, TableRow,
  TextField, Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { budgetsApi, categoriesApi } from '../api/services';
import { useCurrency } from '../context/CurrencyContext';
import SvgIcon from '../utils/SvgIcon';
import MoneyDisplay from '../utils/MoneyDisplay';
import { getErrorMessage } from '../utils/constants';

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(ym) {
  const [y, m] = ym.split('-').map(Number);
  const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
  return `${months[m - 1]} ${y}`;
}

function monthFromDate(dateStr) {
  return dateStr.substring(0, 7);
}

export default function BudgetsPage() {
  const { currency } = useCurrency();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [distributeOpen, setDistributeOpen] = useState(false);
  const [distributeAmounts, setDistributeAmounts] = useState({});
  const [availableMonths, setAvailableMonths] = useState([]);
  const [existingBudgets, setExistingBudgets] = useState({});

  const load = async () => {
    try {
      const [y, m] = selectedMonth.split('-').map(Number);
      const [b, c, allBudgets] = await Promise.all([
        budgetsApi.list({ year: y, month: m }),
        categoriesApi.list(),
        budgetsApi.list(),
      ]);
      setItems(b.data);
      setExistingBudgets(Object.fromEntries(b.data.map((item) => [item.categoryId, item])));
      const expenseCats = c.data.filter((cat) => cat.type === 'EXPENSE');
      setCategories(expenseCats);
      setDistributeAmounts(Object.fromEntries(expenseCats.map((cat) => {
        const existing = b.data.find((item) => item.categoryId === cat.id);
        return [cat.id, existing ? String(existing.amount) : ''];
      })));
      const months = new Set();
      months.add(currentMonth());
      const now = new Date();
      for (let i = 1; i <= 3; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }
      allBudgets.data.forEach((budget) => {
        const ym = monthFromDate(budget.startDate);
        const [y, m] = ym.split('-').map(Number);
        const d = new Date(y, m - 1, 1);
        const diffMonths = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
        if (diffMonths >= 0 && diffMonths <= 3) months.add(ym);
      });
      setAvailableMonths([...months].sort());
    } catch (e) { setError(getErrorMessage(e)); }
  };

  useEffect(() => { load(); }, [selectedMonth]);

  const openDistribute = () => {
    setDistributeAmounts(Object.fromEntries(categories.map((cat) => {
      const existing = existingBudgets[cat.id];
      return [cat.id, existing ? String(existing.amount) : ''];
    })));
    setDistributeOpen(true);
  };

  const handleDistribute = async () => {
    try {
      const [y, m] = selectedMonth.split('-').map(Number);
      const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
      const promises = Object.entries(distributeAmounts).map(([categoryId, amount]) => {
        const existing = existingBudgets[Number(categoryId)];
        const numAmount = Number(amount) || 0;
        if (existing) return budgetsApi.update(existing.id, { categoryId: Number(categoryId), amount: numAmount, period: 'MONTHLY', startDate });
        return budgetsApi.create({ categoryId: Number(categoryId), amount: numAmount, period: 'MONTHLY', startDate });
      });
      await Promise.all(promises);
      setDistributeOpen(false);
      load();
    } catch (e) { setError(getErrorMessage(e)); }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Бюджеты</Typography>
        <Box display="flex" gap={2} alignItems="center">
          <Box display="flex" gap={0.5}>
            {availableMonths.map((ym) => (
              <Button
                key={ym}
                size="small"
                variant={selectedMonth === ym ? 'contained' : 'outlined'}
                onClick={() => setSelectedMonth(ym)}
                sx={{ minWidth: 80, fontWeight: selectedMonth === ym ? 600 : 400 }}
              >
                {monthLabel(ym)}
              </Button>
            ))}
          </Box>
          <Button variant="contained" startIcon={<SvgIcon name={items.length === 0 ? 'Add' : 'Autorenew'} />} onClick={openDistribute}>
            {items.length === 0 ? 'Распределить бюджет' : 'Перераспределить бюджет'}
          </Button>
        </Box>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Категория</TableCell>
              <TableCell>Лимит</TableCell>
              <TableCell>Потрачено</TableCell>
              <TableCell>Разница</TableCell>
              <TableCell>Период</TableCell>
              <TableCell>Прогресс</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SvgIcon name={categories.find((c) => c.id === item.categoryId)?.icon} folder="category" sx={{ height: '40px', width: '40px' }} />
                    {item.categoryName}
                  </Box>
                </TableCell>
                <TableCell><MoneyDisplay amount={item.amount} currency={currency} /></TableCell>
                <TableCell><MoneyDisplay amount={item.spent} currency={currency} /></TableCell>
                <TableCell>
                  <Typography color={item.remaining >= 0 ? 'success.main' : 'error.main'} fontWeight={600}>
                    {item.remaining >= 0 ? '+' : ''}<MoneyDisplay amount={item.remaining} currency={currency} />
                  </Typography>
                </TableCell>
                <TableCell>{item.period === 'MONTHLY' ? 'Месяц' : 'Год'}</TableCell>
                <TableCell sx={{ minWidth: 180 }}>
                  <LinearProgress
                    variant="determinate"
                    value={item.amount <= 0 ? 100 : Math.min(item.progressPercent, 100)}
                    color={item.amount <= 0 || item.progressPercent >= 100 ? 'error' : item.progressPercent >= 80 ? 'warning' : 'primary'}
                  />
                  <Typography variant="caption">{item.amount <= 0 ? 100 : item.progressPercent.toFixed(0)}%</Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={distributeOpen} onClose={() => setDistributeOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Распределение бюджета на {selectedMonth}</DialogTitle>
        <DialogContent>
          {categories.map((cat) => (
            <Box key={cat.id} display="flex" alignItems="center" gap={2} mt={2}>
              <Box display="flex" alignItems="center" gap={1} minWidth={180}>
                <SvgIcon name={cat.icon} folder="category" sx={{ height: '24px', width: '24px' }} />
                <Typography>{cat.name}</Typography>
              </Box>
              <TextField
                type="number"
                size="small"
                placeholder="0"
                fullWidth
                value={distributeAmounts[cat.id] ?? ''}
                onChange={(e) => setDistributeAmounts({ ...distributeAmounts, [cat.id]: e.target.value })}
              />
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDistributeOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleDistribute}>Распределить</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
