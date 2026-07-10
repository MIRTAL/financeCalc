package com.calc.controller;

import com.calc.dto.dtos.*;
import com.calc.security.SecurityUtil;
import com.calc.service.RecurringOperationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recurring")
public class RecurringController {

    private final RecurringOperationService recurringService;
    private final SecurityUtil securityUtil;

    public RecurringController(RecurringOperationService recurringService, SecurityUtil securityUtil) {
        this.recurringService = recurringService;
        this.securityUtil = securityUtil;
    }

    @GetMapping
    public ResponseEntity<List<RecurringResponse>> getAll(Authentication auth) {
        return ResponseEntity.ok(recurringService.getUserRecurring(securityUtil.getCurrentUserId(auth)));
    }

    @PostMapping
    public ResponseEntity<RecurringResponse> create(@RequestBody RecurringRequest request,
                                                     Authentication auth) {
        return ResponseEntity.ok(recurringService.createRecurring(securityUtil.getCurrentUserId(auth), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RecurringResponse> update(@PathVariable Long id,
                                                     @RequestBody RecurringRequest request,
                                                     Authentication auth) {
        return ResponseEntity.ok(recurringService.updateRecurring(id, securityUtil.getCurrentUserId(auth), request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        recurringService.deleteRecurring(id, securityUtil.getCurrentUserId(auth));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/toggle")
    public ResponseEntity<Void> toggle(@PathVariable Long id, Authentication auth) {
        recurringService.toggleActive(id, securityUtil.getCurrentUserId(auth));
        return ResponseEntity.ok().build();
    }
}
