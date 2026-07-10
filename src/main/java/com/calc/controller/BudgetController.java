package com.calc.controller;

import com.calc.dto.dtos.*;
import com.calc.security.SecurityUtil;
import com.calc.service.BudgetService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/budgets")
public class BudgetController {

    private final BudgetService budgetService;
    private final SecurityUtil securityUtil;

    public BudgetController(BudgetService budgetService, SecurityUtil securityUtil) {
        this.budgetService = budgetService;
        this.securityUtil = securityUtil;
    }

    @GetMapping
    public ResponseEntity<List<BudgetResponse>> getAll(Authentication auth) {
        return ResponseEntity.ok(budgetService.getUserBudgets(securityUtil.getCurrentUserId(auth)));
    }

    @PostMapping
    public ResponseEntity<BudgetResponse> create(@RequestBody BudgetRequest request, Authentication auth) {
        return ResponseEntity.ok(budgetService.createBudget(securityUtil.getCurrentUserId(auth), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BudgetResponse> update(@PathVariable Long id,
                                                  @RequestBody BudgetRequest request,
                                                  Authentication auth) {
        return ResponseEntity.ok(budgetService.updateBudget(id, securityUtil.getCurrentUserId(auth), request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        budgetService.deleteBudget(id, securityUtil.getCurrentUserId(auth));
        return ResponseEntity.noContent().build();
    }
}
