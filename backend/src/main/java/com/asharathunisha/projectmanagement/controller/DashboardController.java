package com.asharathunisha.projectmanagement.controller;

import com.asharathunisha.projectmanagement.service.DashboardService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    public Map<String, Long> getDashboardSummary() {
        return dashboardService.getDashboardSummary();
    }
}