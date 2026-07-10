package com.calc.controller;

import com.calc.dto.dtos.*;
import com.calc.security.SecurityUtil;
import com.calc.service.AccountService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private final AccountService accountService;
    private final SecurityUtil securityUtil;

    public AccountController(AccountService accountService, SecurityUtil securityUtil) {
        this.accountService = accountService;
        this.securityUtil = securityUtil;
    }

    @GetMapping
    public ResponseEntity<List<AccountResponse>> getAll(Authentication auth) {
        return ResponseEntity.ok(accountService.getUserAccounts(securityUtil.getCurrentUserId(auth)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AccountResponse> getById(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(accountService.getAccount(id, securityUtil.getCurrentUserId(auth)));
    }

    @PostMapping
    public ResponseEntity<AccountResponse> create(@RequestBody AccountRequest request, Authentication auth) {
        return ResponseEntity.ok(accountService.createAccount(securityUtil.getCurrentUserId(auth), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AccountResponse> update(@PathVariable Long id,
                                                   @RequestBody AccountRequest request,
                                                   Authentication auth) {
        return ResponseEntity.ok(accountService.updateAccount(id, securityUtil.getCurrentUserId(auth), request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        accountService.deleteAccount(id, securityUtil.getCurrentUserId(auth));
        return ResponseEntity.noContent().build();
    }
}
