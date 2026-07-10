package com.calc.repository;

import com.calc.entity.Account;
import com.calc.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AccountRepository extends JpaRepository<Account, Long> {
    List<Account> findByUserOrderByCreatedAtDesc(User user);
    List<Account> findByUserId(Long userId);
}
