export const ACCOUNT_TYPES = [
  { value: 'CASH', label: 'Наличные' },
  { value: 'BANK_CARD', label: 'Банковская карта' },
  { value: 'DEPOSIT', label: 'Депозит' },
  { value: 'E_WALLET', label: 'Электронный кошелёк' },
];

export const CATEGORY_TYPES = [
  { value: 'INCOME', label: 'Доход' },
  { value: 'EXPENSE', label: 'Расход' },
];

export const TRANSACTION_TYPES = [
  { value: 'INCOME', label: 'Доход' },
  { value: 'EXPENSE', label: 'Расход' },
];

export const BUDGET_PERIODS = [
  { value: 'MONTHLY', label: 'Месяц' },
  { value: 'YEARLY', label: 'Год' },
];

export const RECURRENCE_FREQUENCIES = [
  { value: 'DAILY', label: 'Ежедневно' },
  { value: 'WEEKLY', label: 'Еженедельно' },
  { value: 'MONTHLY', label: 'Ежемесячно' },
];

export const CURRENCIES = ['RUB', 'USD', 'EUR', 'BYN'];

export function formatMoney(amount, currency = 'RUB') {
  const num = Number(amount ?? 0);
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(num);
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('ru-RU');
}

export function todayISO() {
  return new Date().toISOString().split('T')[0];
}

export function getErrorMessage(error) {
  return error?.response?.data?.error
    || Object.values(error?.response?.data?.message || {})
    || error?.message
    || 'Произошла ошибка';
}
