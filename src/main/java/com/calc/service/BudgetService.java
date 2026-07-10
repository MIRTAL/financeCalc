package com.calc.service;

import com.calc.dto.dtos.*;
import com.calc.entity.*;
import com.calc.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class BudgetService {

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
        budget.setPeriod(request.period());
        budget.setStartDate(request.startDate());
        budget.setEndDate(request.endDate());
        budget = budgetRepository.save(budget);
        return toResponse(budget);
    }

    @Transactional
    public BudgetResponse updateBudget(Long id, Long userId, BudgetRequest request) {
        Budget budget = budgetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Budget not found"));
        if (!budget.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }
        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));
        budget.setCategory(category);
        budget.setAmount(request.amount());
        budget.setPeriod(request.period());
        budget.setStartDate(request.startDate());
        budget.setEndDate(request.endDate());
        budget = budgetRepository.save(budget);
        return toResponse(budget);
    }

    @Transactional
    public void deleteBudget(Long id, Long userId) {
        Budget budget = budgetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Budget not found"));
        if (!budget.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }
        budgetRepository.delete(budget);
    }

    private BudgetResponse toResponse(Budget b) {
        LocalDate start = b.getStartDate();
        LocalDate end = b.getEndDate() != null ? b.getEndDate() :
                b.getPeriod() == Budget.BudgetPeriod.MONTHLY ?
                        start.withDayOfMonth(start.lengthOfMonth()) :
                        start.withDayOfYear(start.lengthOfYear());

        BigDecimal spent = transactionRepository
                .sumByUserIdAndTypeAndCategoryAndDateBetween(
                        b.getUser().getId(), Transaction.TransactionType.EXPENSE,
                        b.getCategory().getId(), start, end);
        if (spent == null) spent = BigDecimal.ZERO;

        BigDecimal remaining = b.getAmount().subtract(spent);
        double progress = b.getAmount().compareTo(BigDecimal.ZERO) > 0 ?
                spent.multiply(BigDecimal.valueOf(100))
                        .divide(b.getAmount(), 2, java.math.RoundingMode.HALF_UP)
                        .doubleValue() : 0;

        return new BudgetResponse(b.getId(), b.getCategory().getId(),
                b.getCategory().getName(), b.getAmount(), spent, remaining,
                Math.min(progress, 100), b.getPeriod(), start, end);
    }
}
