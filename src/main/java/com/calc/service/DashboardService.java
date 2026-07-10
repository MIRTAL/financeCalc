package com.calc.service;

import com.calc.dto.dtos.*;
import com.calc.entity.*;
import com.calc.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
public class DashboardService {

    private static final String[] CATEGORY_COLORS = {
        "#4caf50", "#f44336", "#2196f3", "#ff9800", "#9c27b0",
        "#00bcd4", "#ff5722", "#8bc34a", "#e91e63", "#3f51b5",
        "#009688", "#ffc107", "#673ab7", "#03a9f4", "#cddc39",
    };

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;
    private final BudgetRepository budgetRepository;

    public DashboardService(TransactionRepository transactionRepository,
                            AccountRepository accountRepository,
                            CategoryRepository categoryRepository,
                            BudgetRepository budgetRepository) {
        this.transactionRepository = transactionRepository;
        this.accountRepository = accountRepository;
        this.categoryRepository = categoryRepository;
        this.budgetRepository = budgetRepository;
    }

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(Long userId, LocalDate start, LocalDate end) {
        BigDecimal income = Optional.ofNullable(
                transactionRepository.sumByUserIdAndTypeAndDateBetween(
                        userId, Transaction.TransactionType.INCOME, start, end))
                .orElse(BigDecimal.ZERO);

        BigDecimal expense = Optional.ofNullable(
                transactionRepository.sumByUserIdAndTypeAndDateBetween(
                        userId, Transaction.TransactionType.EXPENSE, start, end))
                .orElse(BigDecimal.ZERO);

        BigDecimal netIncome = income.subtract(expense);

        BigDecimal totalBalance = BigDecimal.ZERO;
        List<Account> accounts = accountRepository.findByUserId(userId);
        for (Account acc : accounts) {
            BigDecimal accIncome = Optional.ofNullable(
                    transactionRepository.sumByUserIdAndTypeAndDateBetween(
                            userId, Transaction.TransactionType.INCOME,
                            LocalDate.of(1900, 1, 1), LocalDate.of(2100, 1, 1)))
                    .orElse(BigDecimal.ZERO);
            BigDecimal accExpense = Optional.ofNullable(
                    transactionRepository.sumByUserIdAndTypeAndDateBetween(
                            userId, Transaction.TransactionType.EXPENSE,
                            LocalDate.of(1900, 1, 1), LocalDate.of(2100, 1, 1)))
                    .orElse(BigDecimal.ZERO);
            totalBalance = totalBalance.add(acc.getInitialBalance()).add(accIncome).subtract(accExpense);
        }

        List<Object[]> categoryData = transactionRepository.sumGroupByCategory(
                userId, Transaction.TransactionType.EXPENSE, start, end);

        Map<Long, Category> categoryMap = new HashMap<>();
        categoryRepository.findByUserId(userId).forEach(c -> categoryMap.put(c.getId(), c));

        List<CategorySummary> expenseByCategory = new ArrayList<>();
        for (Object[] row : categoryData) {
            Long catId = (Long) row[0];
            BigDecimal amount = (BigDecimal) row[1];
            Category cat = categoryMap.get(catId);
            if (cat != null) {
                double percent = expense.compareTo(BigDecimal.ZERO) > 0 ?
                        amount.multiply(BigDecimal.valueOf(100))
                                .divide(expense, 4, java.math.RoundingMode.HALF_UP)
                                .doubleValue() : 0;
                expenseByCategory.add(new CategorySummary(catId, cat.getName(),
                        CATEGORY_COLORS[expenseByCategory.size() % CATEGORY_COLORS.length], cat.getIcon(), amount, percent));
            }
        }

        List<Object[]> monthlyRaw = transactionRepository.sumMonthlyByType(
                userId, Transaction.TransactionType.INCOME, start, end);
        List<Object[]> monthlyExpenseRaw = transactionRepository.sumMonthlyByType(
                userId, Transaction.TransactionType.EXPENSE, start, end);

        Map<String, BigDecimal> incomeMap = new LinkedHashMap<>();
        Map<String, BigDecimal> expenseMap = new LinkedHashMap<>();

        for (Object[] row : monthlyRaw) {
            String month = row[0].toString().substring(0, 7);
            incomeMap.put(month, (BigDecimal) row[1]);
        }
        for (Object[] row : monthlyExpenseRaw) {
            String month = row[0].toString().substring(0, 7);
            expenseMap.put(month, (BigDecimal) row[1]);
        }

        Set<String> allMonths = new TreeSet<>(incomeMap.keySet());
        allMonths.addAll(expenseMap.keySet());

        List<MonthlySummary> monthlyData = new ArrayList<>();
        for (String month : allMonths) {
            monthlyData.add(new MonthlySummary(month,
                    incomeMap.getOrDefault(month, BigDecimal.ZERO),
                    expenseMap.getOrDefault(month, BigDecimal.ZERO)));
        }

        long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(start, end);
        BigDecimal dailyAvgExpense = daysBetween > 0 ?
                expense.divide(BigDecimal.valueOf(daysBetween), 2, java.math.RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        long remainingDays = java.time.temporal.ChronoUnit.DAYS.between(
                LocalDate.now(), end.plusMonths(1));
        BigDecimal forecast = dailyAvgExpense.multiply(BigDecimal.valueOf(Math.max(remainingDays, 0)));

        return new DashboardResponse(totalBalance, income, expense, netIncome,
                expenseByCategory, monthlyData, forecast);
    }
}
