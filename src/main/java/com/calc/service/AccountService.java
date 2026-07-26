package com.calc.service;

import com.calc.dto.dtos.*;
import com.calc.entity.Account;
import com.calc.entity.User;
import com.calc.repository.AccountRepository;
import com.calc.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class AccountService {

    private static final Logger logger = LoggerFactory.getLogger(AccountService.class);

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    public AccountService(AccountRepository accountRepository,
                          UserRepository userRepository) {
        this.accountRepository = accountRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<AccountResponse> getUserAccounts(Long userId) {
        List<Account> accounts = accountRepository.findByUserId(userId);
        return accounts.stream().map(this::toResponse).toList();
    }

    @Transactional
    public AccountResponse createAccount(Long userId, AccountRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Account account = new Account();
        account.setUser(user);
        account.setName(request.name());
        account.setType(request.type());
        account.setBalance(request.balance());
        account.setCurrency(request.currency());
        account = accountRepository.save(account);
        logger.info("User with id = {} create new account", userId);
        return toResponse(account);
    }

    @Transactional
    public AccountResponse updateAccount(Long id, Long userId, AccountRequest request) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Account not found"));
        if (!account.getUser().getId().equals(userId)) {
            logger.warn("User with id {} trying to update not his account with id = {}", userId, id);
            throw new RuntimeException("Access denied");
        }
        account.setName(request.name());
        account.setType(request.type());
        account.setBalance(request.balance());
        account.setCurrency(request.currency());
        account = accountRepository.save(account);
        logger.info("User with id = {} update account with id = {}", userId, id);
        return toResponse(account);
    }

    @Transactional
    public void deleteAccount(Long id, Long userId) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Account not found"));
        if (!account.getUser().getId().equals(userId)) {
            logger.warn("User with id {} trying to delete not his account with id = {}", userId, id);
            throw new RuntimeException("Access denied");
        }
        accountRepository.delete(account);
        logger.info("User with id = {} successfully deleted account with id = {}", userId, id);
    }

    @Transactional(readOnly = true)
    public AccountResponse getAccount(Long id, Long userId) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Account not found"));
        if (!account.getUser().getId().equals(userId)) {
            logger.warn("User with id {} trying to get not his account with id = {}", userId, id);
            throw new RuntimeException("Access denied");
        }
        return toResponse(account);
    }

    private AccountResponse toResponse(Account account) {
        return new AccountResponse(account.getId(), account.getName(), account.getType(),
                account.getBalance(), account.getCurrency(), account.getBalance(), account.getCreatedAt());
    }
}
