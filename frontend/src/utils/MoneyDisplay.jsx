import { Box } from '@mui/material';
import SvgIcon from './SvgIcon';

export default function MoneyDisplay({ amount, currency, sx }) {
  const num = Number(amount ?? 0);
  const formatted = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, ...sx }}>
      <span>{formatted}</span>
      <SvgIcon name={currency} sx={{ height: '1em', width: 'auto' }} />
    </Box>
  );
}
