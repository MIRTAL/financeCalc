package com.calc.repository;

import com.calc.entity.RecurringOperation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface RecurringOperationRepository extends JpaRepository<RecurringOperation, Long> {
    List<RecurringOperation> findByUserId(Long userId);
    List<RecurringOperation> findByActiveTrueAndNextDateLessThanEqual(LocalDate date);
}
