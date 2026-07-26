package com.calc.controller;

import java.util.UUID;

import com.calc.dto.dtos.DashboardResponse;
import com.calc.security.SecurityUtil;
import com.calc.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;
    private final SecurityUtil securityUtil;

    public DashboardController(DashboardService dashboardService, SecurityUtil securityUtil) {
        this.dashboardService = dashboardService;
        this.securityUtil = securityUtil;
    }

    @GetMapping
    public ResponseEntity<DashboardResponse> getDashboard(
            @RequestParam(required = false) LocalDate start,
            @RequestParam(required = false) LocalDate end,
            Authentication auth) {
        UUID userId = securityUtil.getCurrentUserId(auth);
        if (start == null) start = LocalDate.now().withDayOfMonth(1);
        if (end == null) end = LocalDate.now();
        return ResponseEntity.ok(dashboardService.getDashboard(userId, start, end));
    }
}
