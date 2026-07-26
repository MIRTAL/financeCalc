package com.calc.repository;

import com.calc.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BudgetRepository extends JpaRepository<Budget, Long> {
    List<Budget> findByUserId(UUID userId);
    Optional<Budget> findByUserIdAndCategoryId(UUID userId, Long categoryId);
}
