import {
  Alert, Box, Button, Card, Dialog, DialogActions, DialogContent, DialogTitle,
  LinearProgress, Tab, Table, TableBody, TableCell, TableHead, TableRow,
  Tabs, TextField, Typography,
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
  const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  return `${months[m - 1]} ${y}`;
}

function monthFromDate(dateStr) {
  return dateStr.substring(0, 7);
}

export default function BudgetsPage() {
  const { currency } = useCurrency();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [distributeOpen, setDistributeOpen] = useState(false);
  const [distributeAmounts, setDistributeAmounts] = useState({});
  const [availableMonths, setAvailableMonths] = useState([]);
  const [existingBudgets, setExistingBudgets] = useState({});
  const [tab, setTab] = useState(0);

  const catType = tab === 0 ? 'INCOME' : 'EXPENSE';
  const filteredItems = items.filter((item) => {
    const cat = allCategories.find((c) => c.id === item.categoryId);
    return cat?.type === catType;
  });
  const filteredCats = categories.filter((c) => c.type === catType);

  const load = async () => {
    try {
      const [y, m] = selectedMonth.split('-').map(Number);
      const [b, c, allBudgets] = await Promise.all([
        budgetsApi.list({ year: y, month: m }),
        categoriesApi.list(),
        budgetsApi.list(),
      ]);
      setItems(b.data);
      setAllCategories(c.data);
      setExistingBudgets(Object.fromEntries(b.data.map((item) => [item.categoryId, item])));
      setCategories(c.data);
      const curCatType = tab === 0 ? 'INCOME' : 'EXPENSE';
      setDistributeAmounts(Object.fromEntries(c.data.filter((cat) => cat.type === curCatType).map((cat) => {
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

  useEffect(() => { load(); }, [selectedMonth, tab]);

  const openDistribute = () => {
    setDistributeAmounts(Object.fromEntries(filteredCats.map((cat) => {
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
        const cat = allCategories.find((c) => c.id === Number(categoryId));
        if (cat?.type !== catType) return Promise.resolve();
        const existing = existingBudgets[Number(categoryId)];
        const numAmount = Number(amount) || 0;
        if (existing) return budgetsApi.update(existing.id, { categoryId: Number(categoryId), amount: numAmount, startDate });
        return budgetsApi.create({ categoryId: Number(categoryId), amount: numAmount, startDate });
      });
      await Promise.all(promises);
      setDistributeOpen(false);
      load();
    } catch (e) { setError(getErrorMessage(e)); }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Планирование бюджета</Typography>
        <Box display="flex" gap={0.5}>
          {availableMonths.map((ym) => (
            <Button
              key={ym}
              size="small"
              variant={selectedMonth === ym ? 'contained' : 'outlined'}
              onClick={() => setSelectedMonth(ym)}
              sx={{ minWidth: 120, fontWeight: selectedMonth === ym ? 600 : 400 }}
            >
              {monthLabel(ym)}
            </Button>
          ))}
        </Box>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Доходы" />
          <Tab label="Расходы" />
        </Tabs>
        <Button variant="contained" startIcon={<SvgIcon name={filteredItems.length === 0 ? 'Add' : 'Autorenew'} />} onClick={openDistribute}>
          {filteredItems.length === 0 ? `Распределить ${tab === 1 ? 'расходы' : 'доходы'}` : `Перераспределить ${tab === 1 ? 'расходы' : 'доходы'}`}
        </Button>
      </Box>
      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Категория</TableCell>
              <TableCell>{tab === 0 ? 'Ожидаемая сумма' : 'Лимит'}</TableCell>
              <TableCell>{tab === 0 ? 'Получено' : 'Потрачено'}</TableCell>
              {tab === 1 && <TableCell>Разница</TableCell>}
              {tab === 1 && <TableCell>Прогресс</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SvgIcon name={allCategories.find((c) => c.id === item.categoryId)?.icon} folder="category" sx={{ height: '40px', width: '40px' }} />
                    {item.categoryName}
                  </Box>
                </TableCell>
                <TableCell><MoneyDisplay amount={item.amount} currency={currency} /></TableCell>
                <TableCell><MoneyDisplay amount={item.spent} currency={currency} /></TableCell>
                {tab === 1 && (
                  <TableCell>
                    <Typography color={item.remaining >= 0 ? 'success.main' : 'error.main'} fontWeight={600}>
                      {item.remaining >= 0 ? '+' : ''}<MoneyDisplay amount={item.remaining} currency={currency} />
                    </Typography>
                  </TableCell>
                )}
                {tab === 1 && (
                  <TableCell sx={{ minWidth: 180 }}>
                    <LinearProgress
                      variant="determinate"
                      value={item.amount <= 0 ? 100 : Math.min(item.progressPercent, 100)}
                      color={item.amount <= 0 || item.progressPercent >= 100 ? 'error' : item.progressPercent >= 80 ? 'warning' : 'primary'}
                    />
                    <Typography variant="caption">{item.amount <= 0 ? 100 : item.progressPercent.toFixed(0)}%</Typography>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={distributeOpen} onClose={() => setDistributeOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Планирование {tab === 1 ? 'расходов' : 'доходов'} на {monthLabel(selectedMonth)}</DialogTitle>
        <DialogContent>
          {filteredCats.map((cat) => (
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
