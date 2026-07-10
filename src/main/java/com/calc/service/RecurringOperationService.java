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
public class RecurringOperationService {

    private final RecurringOperationRepository recurringRepository;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;

    public RecurringOperationService(RecurringOperationRepository recurringRepository,
                                     AccountRepository accountRepository,
                                     CategoryRepository categoryRepository,
                                     UserRepository userRepository,
                                     TransactionRepository transactionRepository) {
        this.recurringRepository = recurringRepository;
        this.accountRepository = accountRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
    }

    @Transactional(readOnly = true)
    public List<RecurringResponse> getUserRecurring(Long userId) {
        return recurringRepository.findByUserId(userId).stream()
                .map(this::toResponse).toList();
    }

    @Transactional
    public RecurringResponse createRecurring(Long userId, RecurringRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Account account = accountRepository.findById(request.accountId())
                .orElseThrow(() -> new RuntimeException("Account not found"));

        RecurringOperation op = new RecurringOperation();
        op.setUser(user);
        op.setAccount(account);
        op.setType(request.type());
        op.setAmount(request.amount());
        op.setDescription(request.description());
        op.setFrequency(request.frequency());
        op.setStartDate(request.startDate());
        op.setEndDate(request.endDate());
        op.setNextDate(request.startDate());

        if (request.categoryId() != null) {
            Category category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            op.setCategory(category);
        }

        op = recurringRepository.save(op);
        return toResponse(op);
    }

    @Transactional
    public RecurringResponse updateRecurring(Long id, Long userId, RecurringRequest request) {
        RecurringOperation op = recurringRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Recurring operation not found"));
        if (!op.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }
        Account account = accountRepository.findById(request.accountId())
                .orElseThrow(() -> new RuntimeException("Account not found"));
        op.setAccount(account);
        op.setType(request.type());
        op.setAmount(request.amount());
        op.setDescription(request.description());
        op.setFrequency(request.frequency());
        op.setStartDate(request.startDate());
        op.setEndDate(request.endDate());

        if (request.categoryId() != null) {
            Category category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            op.setCategory(category);
        } else {
            op.setCategory(null);
        }

        op = recurringRepository.save(op);
        return toResponse(op);
    }

    @Transactional
    public void deleteRecurring(Long id, Long userId) {
        RecurringOperation op = recurringRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Recurring operation not found"));
        if (!op.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }
        recurringRepository.delete(op);
    }

    @Transactional
    public void toggleActive(Long id, Long userId) {
        RecurringOperation op = recurringRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Recurring operation not found"));
        if (!op.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }
        op.setActive(!op.isActive());
        recurringRepository.save(op);
    }

    @Transactional
    public int processDueOperations() {
        List<RecurringOperation> due = recurringRepository
                .findByActiveTrueAndNextDateLessThanEqual(LocalDate.now());
        int count = 0;
        for (RecurringOperation op : due) {
            Transaction t = new Transaction();
            t.setUser(op.getUser());
            t.setAccount(op.getAccount());
            t.setCategory(op.getCategory());
            t.setType(op.getType() == RecurringOperation.OperationType.INCOME ?
                    Transaction.TransactionType.INCOME : Transaction.TransactionType.EXPENSE);
            t.setAmount(op.getAmount());
            t.setDescription(op.getDescription() + " (recurring)");
            t.setTransactionDate(op.getNextDate());
            transactionRepository.save(t);

            op.setNextDate(calculateNextDate(op.getNextDate(), op.getFrequency()));

            if (op.getEndDate() != null && op.getNextDate().isAfter(op.getEndDate())) {
                op.setActive(false);
            }
            recurringRepository.save(op);
            count++;
        }
        return count;
    }

    private LocalDate calculateNextDate(LocalDate current, RecurringOperation.Frequency frequency) {
        return switch (frequency) {
            case DAILY -> current.plusDays(1);
            case WEEKLY -> current.plusWeeks(1);
            case MONTHLY -> current.plusMonths(1);
        };
    }

    private RecurringResponse toResponse(RecurringOperation op) {
        return new RecurringResponse(op.getId(), op.getAccount().getId(),
                op.getAccount().getName(),
                op.getCategory() != null ? op.getCategory().getId() : null,
                op.getCategory() != null ? op.getCategory().getName() : null,
                op.getType(), op.getAmount(), op.getDescription(),
                op.getFrequency(), op.getNextDate(), op.getStartDate(),
                op.getEndDate(), op.isActive(), op.getCreatedAt());
    }
}
