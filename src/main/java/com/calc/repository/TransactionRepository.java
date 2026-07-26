package com.calc.repository;

import com.calc.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByUserIdOrderByTransactionDateDescCreatedAtDesc(UUID userId);

    List<Transaction> findByUserIdAndTransactionDateBetweenOrderByTransactionDateDesc(
            UUID userId, LocalDate start, LocalDate end);

    List<Transaction> findByUserIdAndAccountIdOrderByTransactionDateDesc(
            UUID userId, Long accountId);

    List<Transaction> findByUserIdAndCategoryIdOrderByTransactionDateDesc(
            UUID userId, Long categoryId);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
           "WHERE t.user.id = :userId AND t.type = :type " +
           "AND t.transactionDate BETWEEN :start AND :end")
    BigDecimal sumByUserIdAndTypeAndDateBetween(
            @Param("userId") UUID userId,
            @Param("type") Transaction.TransactionType type,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
           "WHERE t.user.id = :userId AND t.type = :type " +
           "AND t.category.id = :categoryId " +
           "AND t.transactionDate BETWEEN :start AND :end")
    BigDecimal sumByUserIdAndTypeAndCategoryAndDateBetween(
            @Param("userId") UUID userId,
            @Param("type") Transaction.TransactionType type,
            @Param("categoryId") Long categoryId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    @Query("SELECT t.category.id, COALESCE(SUM(t.amount), 0) FROM Transaction t " +
           "WHERE t.user.id = :userId AND t.type = :type " +
           "AND t.transactionDate BETWEEN :start AND :end " +
           "GROUP BY t.category.id")
    List<Object[]> sumGroupByCategory(
            @Param("userId") UUID userId,
            @Param("type") Transaction.TransactionType type,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    @Query("SELECT FUNCTION('DATE_TRUNC', 'month', t.transactionDate), COALESCE(SUM(t.amount), 0) " +
           "FROM Transaction t " +
           "WHERE t.user.id = :userId AND t.type = :type " +
           "AND t.transactionDate BETWEEN :start AND :end " +
           "GROUP BY FUNCTION('DATE_TRUNC', 'month', t.transactionDate) " +
           "ORDER BY FUNCTION('DATE_TRUNC', 'month', t.transactionDate)")
    List<Object[]> sumMonthlyByType(
            @Param("userId") UUID userId,
            @Param("type") Transaction.TransactionType type,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);
}
