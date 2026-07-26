package com.calc.repository;

import com.calc.entity.RecurringOperation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface RecurringOperationRepository extends JpaRepository<RecurringOperation, Long> {
    List<RecurringOperation> findByUserId(UUID userId);
    List<RecurringOperation> findByActiveTrueAndNextDateLessThanEqual(LocalDate date);
}
