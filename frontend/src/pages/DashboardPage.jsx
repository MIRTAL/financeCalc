import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { Alert, Box, Card, CardContent, CircularProgress, Grid, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Doughnut, Line } from 'react-chartjs-2';
import { dashboardApi } from '../api/services';
import { useCurrency } from '../context/CurrencyContext';
import { getErrorMessage } from '../utils/constants';
import MoneyDisplay from '../utils/MoneyDisplay';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend);

function StatCard({ title, value, color }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="body2" color="text.secondary">{title}</Typography>
        <Typography variant="h5" fontWeight={700} color={color || 'text.primary'}>{value}</Typography>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { currency } = useCurrency();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.get()
      .then((res) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return null;

  const pieData = {
    labels: data.expensesByCategory.map((c) => c.categoryName),
    datasets: [{
      data: data.expensesByCategory.map((c) => Number(c.amount)),
      backgroundColor: data.expensesByCategory.map((c) => c.color || '#90a4ae'),
    }],
  };

  const lineData = {
    labels: data.monthlyData.map((d) => d.month),
    datasets: [
      {
        label: 'Доходы',
        data: data.monthlyData.map((d) => Number(d.income)),
        borderColor: '#2e7d32',
        backgroundColor: 'rgba(46,125,50,0.1)',
        tension: 0.3,
      },
      {
        label: 'Расходы',
        data: data.monthlyData.map((d) => Number(d.expense)),
        borderColor: '#c62828',
        backgroundColor: 'rgba(198,40,40,0.1)',
        tension: 0.3,
      },
    ],
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Дашборд</Typography>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Общий баланс" value={<MoneyDisplay amount={data.totalBalance} currency={currency} />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Доходы за период" value={<MoneyDisplay amount={data.totalIncome} currency={currency} />} color="success.main" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Расходы за период" value={<MoneyDisplay amount={data.totalExpense} currency={currency} />} color="error.main" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Чистый поток"
            value={<MoneyDisplay amount={data.netIncome} currency={currency} />}
            color={Number(data.netIncome) >= 0 ? 'success.main' : 'error.main'}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Расходы по категориям</Typography>
              {data.expensesByCategory.length ? (
                <Box sx={{ maxHeight: 280, display: 'flex', justifyContent: 'center' }}>
                  <Doughnut data={pieData} options={{ maintainAspectRatio: true }} />
                </Box>
              ) : (
                <Typography color="text.secondary">Нет данных за период</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={9}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Динамика доходов и расходов</Typography>
              {data.monthlyData.length ? (
                <Box sx={{ maxHeight: 280 }}>
                  <Line data={lineData} options={{ responsive: true, maintainAspectRatio: true }} />
                </Box>
              ) : (
                <Typography color="text.secondary">Нет данных за период</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {data.forecast != null && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Прогноз накоплений</Typography>
            <Typography variant="body2" color="text.secondary">Прогнозируемый остаток</Typography>
            <Typography fontWeight={600}><MoneyDisplay amount={data.forecast} currency={currency} /></Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
