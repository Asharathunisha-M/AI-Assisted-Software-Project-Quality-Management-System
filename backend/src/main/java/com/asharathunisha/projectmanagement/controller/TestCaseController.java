package com.asharathunisha.projectmanagement.controller;

import com.asharathunisha.projectmanagement.entity.TestCase;
import com.asharathunisha.projectmanagement.service.TestCaseService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/testcases")
public class TestCaseController {

    private final TestCaseService testCaseService;

    public TestCaseController(TestCaseService testCaseService) {
        this.testCaseService = testCaseService;
    }

    @PostMapping
    public TestCase createTestCase(@RequestBody TestCase testCase) {
        return testCaseService.createTestCase(testCase);
    }

    @GetMapping
    public List<TestCase> getAllTestCases() {
        return testCaseService.getAllTestCases();
    }

    @GetMapping("/{id}")
    public TestCase getTestCaseById(@PathVariable Long id) {
        return testCaseService.getTestCaseById(id);
    }

    @PutMapping("/{id}")
    public TestCase updateTestCase(
            @PathVariable Long id,
            @RequestBody TestCase testCase) {
        return testCaseService.updateTestCase(id, testCase);
    }

    @DeleteMapping("/{id}")
    public void deleteTestCase(@PathVariable Long id) {
        testCaseService.deleteTestCase(id);
    }

    @GetMapping("/project/{projectId}")
    public List<TestCase> getTestCasesByProjectId(
            @PathVariable Long projectId) {
        return testCaseService.getTestCasesByProjectId(projectId);
    }
}