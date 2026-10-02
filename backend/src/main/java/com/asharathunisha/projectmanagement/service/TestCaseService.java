package com.asharathunisha.projectmanagement.service;

import com.asharathunisha.projectmanagement.entity.TestCase;
import com.asharathunisha.projectmanagement.repository.TestCaseRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TestCaseService {

    private final TestCaseRepository testCaseRepository;

    public TestCaseService(TestCaseRepository testCaseRepository) {
        this.testCaseRepository = testCaseRepository;
    }

    public TestCase createTestCase(TestCase testCase) {
        return testCaseRepository.save(testCase);
    }

    public List<TestCase> getAllTestCases() {
        return testCaseRepository.findAll();
    }

    public TestCase getTestCaseById(Long id) {
        return testCaseRepository.findById(id).orElse(null);
    }

    public TestCase updateTestCase(Long id, TestCase updatedTestCase) {

        TestCase existingTestCase = testCaseRepository.findById(id).orElse(null);

        if (existingTestCase == null) {
            return null;
        }

        existingTestCase.setTitle(updatedTestCase.getTitle());
        existingTestCase.setDescription(updatedTestCase.getDescription());
        existingTestCase.setPreconditions(updatedTestCase.getPreconditions());
        existingTestCase.setExpectedResult(updatedTestCase.getExpectedResult());
        existingTestCase.setActualResult(updatedTestCase.getActualResult());
        existingTestCase.setStatus(updatedTestCase.getStatus());
        existingTestCase.setPriority(updatedTestCase.getPriority());

        return testCaseRepository.save(existingTestCase);
    }

    public void deleteTestCase(Long id) {
        testCaseRepository.deleteById(id);
    }

    public List<TestCase> getTestCasesByProjectId(Long projectId) {
        return testCaseRepository.findByProjectId(projectId);
    }
}