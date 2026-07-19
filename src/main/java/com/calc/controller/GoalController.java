package com.calc.controller;

import com.calc.dto.dtos.*;
import com.calc.security.SecurityUtil;
import com.calc.service.GoalService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/goals")
public class GoalController {

    private final GoalService goalService;
    private final SecurityUtil securityUtil;

    public GoalController(GoalService goalService, SecurityUtil securityUtil) {
        this.goalService = goalService;
        this.securityUtil = securityUtil;
    }

    @GetMapping
    public ResponseEntity<List<GoalResponse>> getAll(Authentication auth) {
        return ResponseEntity.ok(goalService.getUserGoals(securityUtil.getCurrentUserId(auth)));
    }

    @PostMapping
    public ResponseEntity<GoalResponse> create(@RequestBody GoalRequest request, Authentication auth) {
        return ResponseEntity.ok(goalService.createGoal(securityUtil.getCurrentUserId(auth), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GoalResponse> update(@PathVariable Long id,
                                                @RequestBody GoalRequest request,
                                                Authentication auth) {
        return ResponseEntity.ok(goalService.updateGoal(id, securityUtil.getCurrentUserId(auth), request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        goalService.deleteGoal(id, securityUtil.getCurrentUserId(auth));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/add")
    public ResponseEntity<GoalResponse> addAmount(@PathVariable Long id,
                                                   @RequestParam BigDecimal amount,
                                                   @RequestParam Long accountId,
                                                   Authentication auth) {
        return ResponseEntity.ok(goalService.addToGoal(id, securityUtil.getCurrentUserId(auth), amount, accountId));
    }

    @PostMapping("/{id}/withdraw")
    public ResponseEntity<GoalResponse> withdraw(@PathVariable Long id,
                                                  @RequestParam BigDecimal amount,
                                                  @RequestParam Long accountId,
                                                  Authentication auth) {
        return ResponseEntity.ok(goalService.withdrawFromGoal(id, securityUtil.getCurrentUserId(auth), amount, accountId));
    }

    @PostMapping("/{id}/spend")
    public ResponseEntity<GoalResponse> spend(@PathVariable Long id,
                                               @RequestParam BigDecimal amount,
                                               @RequestParam Long accountId,
                                               Authentication auth) {
        return ResponseEntity.ok(goalService.spendFromGoal(id, securityUtil.getCurrentUserId(auth), amount, accountId));
    }
}
