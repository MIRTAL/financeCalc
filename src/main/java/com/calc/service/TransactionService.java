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
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public TransactionService(TransactionRepository transactionRepository,
                              AccountRepository accountRepository,
                              CategoryRepository categoryRepository,
                              UserRepository userRepository) {
        this.transactionRepository = transactionRepository;
        this.accountRepository = accountRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getUserTransactions(Long userId) {
        return transactionRepository.findByUserIdOrderByTransactionDateDescCreatedAtDesc(userId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getTransactionsByPeriod(Long userId, LocalDate start, LocalDate end) {
        return transactionRepository
                .findByUserIdAndTransactionDateBetweenOrderByTransactionDateDesc(userId, start, end)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public TransactionResponse createTransaction(Long userId, TransactionRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Account account = accountRepository.findById(request.accountId())
                .orElseThrow(() -> new RuntimeException("Account not found"));

        Transaction transaction = new Transaction();
        transaction.setUser(user);
        transaction.setAccount(account);
        transaction.setType(request.type());
        transaction.setAmount(request.amount());
        transaction.setDescription(request.description());
        transaction.setTransactionDate(request.transactionDate());

        if (request.categoryId() != null) {
            Category category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            transaction.setCategory(category);
        }

        if (request.type() == Transaction.TransactionType.TRANSFER) {
            if (request.targetAccountId() == null) {
                throw new RuntimeException("Target account required for transfer");
            }
            Account targetAccount = accountRepository.findById(request.targetAccountId())
                    .orElseThrow(() -> new RuntimeException("Target account not found"));

            transaction = transactionRepository.save(transaction);

            Transaction targetTransaction = new Transaction();
            targetTransaction.setUser(user);
            targetTransaction.setAccount(targetAccount);
            targetTransaction.setType(Transaction.TransactionType.TRANSFER);
            targetTransaction.setAmount(request.amount());
            targetTransaction.setDescription("Transfer from " + account.getName());
            targetTransaction.setTransactionDate(request.transactionDate());
            targetTransaction.setRelatedTransactionId(transaction.getId());
            targetTransaction = transactionRepository.save(targetTransaction);

            transaction.setRelatedTransactionId(targetTransaction.getId());
            transaction = transactionRepository.save(transaction);
        } else {
            transaction = transactionRepository.save(transaction);
        }

        return toResponse(transaction);
    }

    @Transactional
    public TransactionResponse updateTransaction(Long id, Long userId, TransactionRequest request) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
        if (!transaction.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        Account account = accountRepository.findById(request.accountId())
                .orElseThrow(() -> new RuntimeException("Account not found"));
        transaction.setAccount(account);
        transaction.setType(request.type());
        transaction.setAmount(request.amount());
        transaction.setDescription(request.description());
        transaction.setTransactionDate(request.transactionDate());

        if (request.categoryId() != null) {
            Category category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            transaction.setCategory(category);
        } else {
            transaction.setCategory(null);
        }

        // Update related transfer transaction if it exists
        if (transaction.getRelatedTransactionId() != null) {
            Transaction related = transactionRepository.findById(transaction.getRelatedTransactionId()).orElse(null);
            if (related != null) {
                related.setAmount(request.amount());
                related.setTransactionDate(request.transactionDate());
                transactionRepository.save(related);
            }
        }

        // If the original was a transfer and user changed type, clear the relation
        if (request.type() != Transaction.TransactionType.TRANSFER && transaction.getRelatedTransactionId() != null) {
            Transaction related = transactionRepository.findById(transaction.getRelatedTransactionId()).orElse(null);
            if (related != null) {
                related.setRelatedTransactionId(null);
                transactionRepository.save(related);
            }
            transaction.setRelatedTransactionId(null);
        }

        transaction = transactionRepository.save(transaction);
        return toResponse(transaction);
    }

    @Transactional
    public void deleteTransaction(Long id, Long userId) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
        if (!transaction.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }
        if (transaction.getRelatedTransactionId() != null) {
            transactionRepository.findById(transaction.getRelatedTransactionId())
                    .ifPresent(t -> {
                        if (t.getRelatedTransactionId() != null) {
                            t.setRelatedTransactionId(null);
                            transactionRepository.save(t);
                        }
                    });
        }
        transactionRepository.delete(transaction);
    }

    private TransactionResponse toResponse(Transaction t) {
        return new TransactionResponse(t.getId(),
                t.getAccount().getId(), t.getAccount().getName(),
                t.getCategory() != null ? t.getCategory().getId() : null,
                t.getCategory() != null ? t.getCategory().getName() : null,
                t.getType(), t.getAmount(), t.getDescription(),
                t.getTransactionDate(), t.getRelatedTransactionId(), t.getCreatedAt());
    }
}
