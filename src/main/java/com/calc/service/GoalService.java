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
public class GoalService {

    private static final Logger logger = LoggerFactory.getLogger(GoalService.class);

    private final FinancialGoalRepository goalRepository;
    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;

    public GoalService(FinancialGoalRepository goalRepository,
                       UserRepository userRepository,
                       AccountRepository accountRepository,
                       TransactionRepository transactionRepository) {
        this.goalRepository = goalRepository;
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
    }

    @Transactional(readOnly = true)
    public List<GoalResponse> getUserGoals(Long userId) {
        return goalRepository.findByUserId(userId).stream()
                .map(this::toResponse).toList();
    }

    @Transactional
    public GoalResponse createGoal(Long userId, GoalRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        FinancialGoal goal = new FinancialGoal();
        goal.setUser(user);
        goal.setName(request.name());
        goal.setTargetAmount(request.targetAmount());
        goal.setCurrentAmount(BigDecimal.ZERO);
        goal.setTargetDate(request.targetDate());
        goal = goalRepository.save(goal);
        logger.info("User with id = {} create new goal", userId);
        return toResponse(goal);
    }

    @Transactional
    public GoalResponse updateGoal(Long id, Long userId, GoalRequest request) {
        FinancialGoal goal = goalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Goal not found"));
        if (!goal.getUser().getId().equals(userId)) {
            logger.warn("User with id {} trying to update not his goal with id = {}", userId, id);
            throw new RuntimeException("Access denied");
        }
        goal.setName(request.name());
        goal.setTargetAmount(request.targetAmount());
        goal.setTargetDate(request.targetDate());
        goal.setCategory(null);
        goal = goalRepository.save(goal);
        logger.info("User with id = {} update goal with id = {}", userId, id);
        return toResponse(goal);
    }

    @Transactional
    public void deleteGoal(Long id, Long userId) {
        FinancialGoal goal = goalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Goal not found"));
        if (!goal.getUser().getId().equals(userId)) {
            logger.warn("User with id {} trying to delete not his goal with id = {}", userId, id);
            throw new RuntimeException("Access denied");
        }
        goalRepository.delete(goal);
        logger.info("User with id = {} successfully deleted goal with id = {}", userId, id);
    }

    @Transactional
    public GoalResponse addToGoal(Long id, Long userId, BigDecimal amount, Long accountId) {
        FinancialGoal goal = goalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Goal not found"));
        if (!goal.getUser().getId().equals(userId)) {
            logger.warn("User with id {} trying to delete not his account with id = {}", userId, id);
            throw new RuntimeException("Access denied");
        }
        goal.setCurrentAmount(goal.getCurrentAmount().add(amount));
        goal = goalRepository.save(goal);

        Account sourceAccount = accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));

        Transaction debit = new Transaction();
        debit.setUser(goal.getUser());
        debit.setAccount(sourceAccount);
        debit.setType(Transaction.TransactionType.TRANSFER);
        debit.setAmount(amount);
        debit.setDescription("Пополнение цели: " + goal.getName());
        debit.setTransactionDate(LocalDate.now());
        transactionRepository.save(debit);

        logger.info("User with id = {} successfully deposit goal with id = {}", userId, id);
        return toResponse(goal);
    }

    @Transactional
    public GoalResponse withdrawFromGoal(Long id, Long userId, BigDecimal amount, Long accountId) {
        FinancialGoal goal = goalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Goal not found"));
        if (!goal.getUser().getId().equals(userId)) {
            logger.warn("User with id {} trying to withdraw not his goal with id = {}", userId, id);
            throw new RuntimeException("Access denied");
        }
        goal.setCurrentAmount(goal.getCurrentAmount().subtract(amount));
        goal = goalRepository.save(goal);

        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));
        Transaction transaction = new Transaction();
        transaction.setUser(goal.getUser());
        transaction.setAccount(account);
        transaction.setType(Transaction.TransactionType.INCOME);
        transaction.setAmount(amount);
        transaction.setDescription("Снятие с цели: " + goal.getName());
        transaction.setTransactionDate(LocalDate.now());
        transactionRepository.save(transaction);

        logger.info("User with id = {} withdrew from goal with id = {}", userId, id);
        return toResponse(goal);
    }

    @Transactional
    public GoalResponse spendFromGoal(Long id, Long userId, BigDecimal amount, Long accountId) {
        FinancialGoal goal = goalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Goal not found"));
        if (!goal.getUser().getId().equals(userId)) {
            logger.warn("User with id {} trying to spend not his goal with id = {}", userId, id);
            throw new RuntimeException("Access denied");
        }
        goal.setCurrentAmount(goal.getCurrentAmount().subtract(amount));
        goal = goalRepository.save(goal);

        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));
        Transaction transaction = new Transaction();
        transaction.setUser(goal.getUser());
        transaction.setAccount(account);
        transaction.setType(Transaction.TransactionType.EXPENSE);
        transaction.setAmount(amount);
        transaction.setDescription("Трата с цели: " + goal.getName());
        transaction.setTransactionDate(LocalDate.now());
        transactionRepository.save(transaction);

        logger.info("User with id = {} spent from goal with id = {}", userId, id);
        return toResponse(goal);
    }

    private GoalResponse toResponse(FinancialGoal g) {
        double progress = g.getTargetAmount().compareTo(BigDecimal.ZERO) > 0 ?
                g.getCurrentAmount().multiply(BigDecimal.valueOf(100))
                        .divide(g.getTargetAmount(), 2, java.math.RoundingMode.HALF_UP)
                        .doubleValue() : 0;
        return new GoalResponse(g.getId(), g.getName(), g.getTargetAmount(),
                g.getCurrentAmount(), Math.min(progress, 100), g.getTargetDate(),
                g.getCreatedAt());
    }
}
