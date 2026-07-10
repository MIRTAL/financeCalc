package com.calc.controller;

import com.calc.dto.dtos.*;
import com.calc.security.SecurityUtil;
import com.calc.service.TransactionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;
    private final SecurityUtil securityUtil;

    public TransactionController(TransactionService transactionService, SecurityUtil securityUtil) {
        this.transactionService = transactionService;
        this.securityUtil = securityUtil;
    }

    @GetMapping
    public ResponseEntity<List<TransactionResponse>> getAll(
            @RequestParam(required = false) LocalDate start,
            @RequestParam(required = false) LocalDate end,
            Authentication auth) {
        Long userId = securityUtil.getCurrentUserId(auth);
        if (start != null && end != null) {
            return ResponseEntity.ok(transactionService.getTransactionsByPeriod(userId, start, end));
        }
        return ResponseEntity.ok(transactionService.getUserTransactions(userId));
    }

    @PostMapping
    public ResponseEntity<TransactionResponse> create(@RequestBody TransactionRequest request,
                                                       Authentication auth) {
        return ResponseEntity.ok(transactionService.createTransaction(securityUtil.getCurrentUserId(auth), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransactionResponse> update(@PathVariable Long id,
                                                       @RequestBody TransactionRequest request,
                                                       Authentication auth) {
        return ResponseEntity.ok(transactionService.updateTransaction(id, securityUtil.getCurrentUserId(auth), request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        transactionService.deleteTransaction(id, securityUtil.getCurrentUserId(auth));
        return ResponseEntity.noContent().build();
    }
}
