package com.calc.service;

import com.calc.dto.dtos.*;
import com.calc.entity.*;
import com.calc.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class GoalService {

    private static final Logger logger = LoggerFactory.getLogger(GoalService.class);

    private final FinancialGoalRepository goalRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public GoalService(FinancialGoalRepository goalRepository,
                       CategoryRepository categoryRepository,
                       UserRepository userRepository) {
        this.goalRepository = goalRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
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
        goal.setCurrentAmount(request.currentAmount() != null ? request.currentAmount() : BigDecimal.ZERO);
        goal.setTargetDate(request.targetDate());
        if (request.categoryId() != null) {
            Category category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            goal.setCategory(category);
        }
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
        goal.setCurrentAmount(request.currentAmount());
        goal.setTargetDate(request.targetDate());
        if (request.categoryId() != null) {
            Category category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            goal.setCategory(category);
        } else {
            goal.setCategory(null);
        }
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
    public GoalResponse addToGoal(Long id, Long userId, BigDecimal amount) {
        FinancialGoal goal = goalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Goal not found"));
        if (!goal.getUser().getId().equals(userId)) {
            logger.warn("User with id {} trying to delete not his account with id = {}", userId, id);
            throw new RuntimeException("Access denied");
        }
        goal.setCurrentAmount(goal.getCurrentAmount().add(amount));
        goal = goalRepository.save(goal);
        logger.info("User with id = {} successfully deposit goal with id = {}", userId, id);
        return toResponse(goal);
    }

    private GoalResponse toResponse(FinancialGoal g) {
        double progress = g.getTargetAmount().compareTo(BigDecimal.ZERO) > 0 ?
                g.getCurrentAmount().multiply(BigDecimal.valueOf(100))
                        .divide(g.getTargetAmount(), 2, java.math.RoundingMode.HALF_UP)
                        .doubleValue() : 0;
        return new GoalResponse(g.getId(), g.getName(), g.getTargetAmount(),
                g.getCurrentAmount(), Math.min(progress, 100), g.getTargetDate(),
                g.getCategory() != null ? g.getCategory().getId() : null,
                g.getCategory() != null ? g.getCategory().getName() : null,
                g.getCreatedAt());
    }
}
