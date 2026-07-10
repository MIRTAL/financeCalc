package com.calc.dto;

import com.calc.entity.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class dtos {

    public record RegisterRequest(String username, String password, String email) {}
    public record AuthRequest(String username, String password) {}
    public record AuthResponse(String token, Long userId, String username) {}

    public record AccountRequest(String name, Account.AccountType type, BigDecimal initialBalance, String currency) {}
    public record AccountResponse(Long id, String name, Account.AccountType type, BigDecimal initialBalance, String currency, BigDecimal currentBalance, LocalDateTime createdAt) {}

    public record CategoryRequest(String name, Category.CategoryType type, Long parentId, String icon, String color) {}
    public record CategoryResponse(Long id, String name, Category.CategoryType type, Long parentId, String icon, String color, LocalDateTime createdAt) {}

    public record TransactionRequest(Long accountId, Long categoryId, Transaction.TransactionType type, BigDecimal amount, String description, LocalDate transactionDate, Long targetAccountId) {}
    public record TransactionResponse(Long id, Long accountId, String accountName, Long categoryId, String categoryName, Transaction.TransactionType type, BigDecimal amount, String description, LocalDate transactionDate, Long relatedTransactionId, LocalDateTime createdAt) {}

    public record BudgetRequest(Long categoryId, BigDecimal amount, Budget.BudgetPeriod period, LocalDate startDate, LocalDate endDate) {}
    public record BudgetResponse(Long id, Long categoryId, String categoryName, BigDecimal amount, BigDecimal spent, BigDecimal remaining, double progressPercent, Budget.BudgetPeriod period, LocalDate startDate, LocalDate endDate) {}

    public record GoalRequest(String name, BigDecimal targetAmount, BigDecimal currentAmount, LocalDate targetDate, Long categoryId) {}
    public record GoalResponse(Long id, String name, BigDecimal targetAmount, BigDecimal currentAmount, double progressPercent, LocalDate targetDate, Long categoryId, String categoryName, LocalDateTime createdAt) {}

    public record RecurringRequest(Long accountId, Long categoryId, RecurringOperation.OperationType type, BigDecimal amount, String description, RecurringOperation.Frequency frequency, LocalDate startDate, LocalDate endDate) {}
    public record RecurringResponse(Long id, Long accountId, String accountName, Long categoryId, String categoryName, RecurringOperation.OperationType type, BigDecimal amount, String description, RecurringOperation.Frequency frequency, LocalDate nextDate, LocalDate startDate, LocalDate endDate, boolean active, LocalDateTime createdAt) {}

    public record DashboardResponse(BigDecimal totalBalance, BigDecimal totalIncome, BigDecimal totalExpense, BigDecimal netIncome, List<CategorySummary> expensesByCategory, List<MonthlySummary> monthlyData, BigDecimal forecast) {}
    public record CategorySummary(Long categoryId, String categoryName, String color, String icon, BigDecimal amount, double percent) {}
    public record MonthlySummary(String month, BigDecimal income, BigDecimal expense) {}
}
