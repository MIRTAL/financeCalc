package com.calc.service;

import com.calc.dto.dtos.*;
import com.calc.entity.*;
import com.calc.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class BudgetService {

    private static final Logger logger = LoggerFactory.getLogger(BudgetService.class);

    private final BudgetRepository budgetRepository;
    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public BudgetService(BudgetRepository budgetRepository,
                         TransactionRepository transactionRepository,
                         CategoryRepository categoryRepository,
                         UserRepository userRepository) {
        this.budgetRepository = budgetRepository;
        this.transactionRepository = transactionRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<BudgetResponse> getUserBudgets(Long userId) {
        return budgetRepository.findByUserId(userId).stream()
                .map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<BudgetResponse> getUserBudgetsByMonth(Long userId, int year, int month) {
        LocalDate monthStart = LocalDate.of(year, month, 1);
        LocalDate monthEnd = monthStart.withDayOfMonth(monthStart.lengthOfMonth());
        return budgetRepository.findByUserId(userId).stream()
                .filter(b -> !b.getStartDate().isAfter(monthEnd) && !b.getStartDate().isBefore(monthStart))
                .map(this::toResponse).toList();
    }

    @Transactional
    public BudgetResponse createBudget(Long userId, BudgetRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));
        Budget budget = new Budget();
        budget.setUser(user);
        budget.setCategory(category);
        budget.setAmount(request.amount());
        budget.setStartDate(request.startDate());
        budget = budgetRepository.save(budget);
        logger.info("User with id = {} create new budget", userId);
        return toResponse(budget);
    }

    @Transactional
    public BudgetResponse updateBudget(Long id, Long userId, BudgetRequest request) {
        Budget budget = budgetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Budget not found"));
        if (!budget.getUser().getId().equals(userId)) {
            logger.warn("User with id {} trying to update not his budget with id = {}", userId, id);
            throw new RuntimeException("Access denied");
        }
        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));
        budget.setCategory(category);
        budget.setAmount(request.amount());
        budget.setStartDate(request.startDate());
        budget = budgetRepository.save(budget);
        logger.info("User with id = {} update budget with id = {}", userId, id);
        return toResponse(budget);
    }

    @Transactional
    public void deleteBudget(Long id, Long userId) {
        Budget budget = budgetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Budget not found"));
        if (!budget.getUser().getId().equals(userId)) {
            logger.warn("User with id {} trying to delete not his budget with id = {}", userId, id);
            throw new RuntimeException("Access denied");
        }
        budgetRepository.delete(budget);
        logger.info("User with id = {} successfully deleted budget with id = {}", userId, id);
    }

    private BudgetResponse toResponse(Budget b) {
        LocalDate start = b.getStartDate();
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
        Transaction.TransactionType txType = b.getCategory().getType() == Category.CategoryType.INCOME
                ? Transaction.TransactionType.INCOME : Transaction.TransactionType.EXPENSE;

        BigDecimal spent = transactionRepository
                .sumByUserIdAndTypeAndCategoryAndDateBetween(
                        b.getUser().getId(), txType,
                        b.getCategory().getId(), start, end);
        if (spent == null) spent = BigDecimal.ZERO;

        BigDecimal remaining = b.getAmount().subtract(spent);
        double progress = b.getAmount().compareTo(BigDecimal.ZERO) > 0 ?
                spent.multiply(BigDecimal.valueOf(100))
                        .divide(b.getAmount(), 2, java.math.RoundingMode.HALF_UP)
                        .doubleValue() : 100;

        return new BudgetResponse(b.getId(), b.getCategory().getId(),
                b.getCategory().getName(), b.getAmount(), spent, remaining,
                Math.min(progress, 100), start);
    }
}
