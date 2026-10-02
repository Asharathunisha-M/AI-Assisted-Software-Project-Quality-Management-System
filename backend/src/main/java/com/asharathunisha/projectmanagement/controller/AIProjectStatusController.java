package com.asharathunisha.projectmanagement.controller;

import com.asharathunisha.projectmanagement.entity.Bug;
import com.asharathunisha.projectmanagement.entity.Milestone;
import com.asharathunisha.projectmanagement.entity.Task;
import com.asharathunisha.projectmanagement.entity.TestCase;
import com.asharathunisha.projectmanagement.repository.BugRepository;
import com.asharathunisha.projectmanagement.repository.MilestoneRepository;
import com.asharathunisha.projectmanagement.repository.TaskRepository;
import com.asharathunisha.projectmanagement.repository.TestCaseRepository;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/ai")
public class AIProjectStatusController {

    private final TaskRepository taskRepository;
    private final MilestoneRepository milestoneRepository;
    private final TestCaseRepository testCaseRepository;
    private final BugRepository bugRepository;

    public AIProjectStatusController(
            TaskRepository taskRepository,
            MilestoneRepository milestoneRepository,
            TestCaseRepository testCaseRepository,
            BugRepository bugRepository) {

        this.taskRepository = taskRepository;
        this.milestoneRepository = milestoneRepository;
        this.testCaseRepository = testCaseRepository;
        this.bugRepository = bugRepository;
    }

    @GetMapping("/project-status/{projectId}")
    public Map<String, Object> getProjectStatus(
            @PathVariable Long projectId) {

        // Get project-related data
        List<Task> tasks =
                taskRepository.findByProjectId(projectId);

        List<Milestone> milestones =
                milestoneRepository.findByProjectId(projectId);

        List<TestCase> testCases =
                testCaseRepository.findByProjectId(projectId);

        List<Bug> bugs =
                bugRepository.findByProjectId(projectId);

        // -----------------------------------------
        // TASK CALCULATION
        // -----------------------------------------

        long totalTasks = tasks.size();

        long completedTasks = tasks.stream()
                .filter(task ->
                        "COMPLETED".equalsIgnoreCase(task.getStatus()))
                .count();

        // -----------------------------------------
        // MILESTONE CALCULATION
        // -----------------------------------------

        long totalMilestones = milestones.size();

        long completedMilestones = milestones.stream()
                .filter(milestone ->
                        "COMPLETED".equalsIgnoreCase(
                                milestone.getStatus()))
                .count();

        // -----------------------------------------
        // TEST CASE CALCULATION
        // -----------------------------------------

        long totalTestCases = testCases.size();

        long passedTestCases = testCases.stream()
                .filter(testCase ->
                        "PASSED".equalsIgnoreCase(
                                testCase.getStatus()))
                .count();

        // -----------------------------------------
        // BUG CALCULATION
        // -----------------------------------------

        long totalBugs = bugs.size();

        long highSeverityBugs = bugs.stream()
                .filter(bug ->
                        "HIGH".equalsIgnoreCase(
                                bug.getSeverity())
                                ||
                                "CRITICAL".equalsIgnoreCase(
                                        bug.getSeverity()))
                .count();

        long openBugs = bugs.stream()
                .filter(bug ->
                        !"RESOLVED".equalsIgnoreCase(
                                bug.getStatus())
                                &&
                                !"CLOSED".equalsIgnoreCase(
                                        bug.getStatus()))
                .count();

        // -----------------------------------------
        // PROGRESS CALCULATION
        // -----------------------------------------

        double taskCompletion =
                percentage(completedTasks, totalTasks);

        double milestoneProgress =
                percentage(
                        completedMilestones,
                        totalMilestones
                );

        double testingProgress =
                percentage(
                        passedTestCases,
                        totalTestCases
                );

        // -----------------------------------------
        // PROJECT STATUS
        // -----------------------------------------

        String projectStatus;

        if (highSeverityBugs >= 2
                || taskCompletion < 40
                || testingProgress < 40) {

            projectStatus = "AT RISK";

        } else if (highSeverityBugs >= 1
                || taskCompletion < 70
                || testingProgress < 70) {

            projectStatus = "NEEDS ATTENTION";

        } else {

            projectStatus = "ON TRACK";
        }

        // -----------------------------------------
        // AI RECOMMENDATION
        // -----------------------------------------

        String recommendation;

        if (highSeverityBugs > 0) {

            recommendation =
                    "Prioritize resolving high-severity bugs "
                            + "before completing the next milestone.";

        } else if (taskCompletion < 70) {

            recommendation =
                    "Focus on completing pending tasks "
                            + "and monitor project progress.";

        } else if (testingProgress < 70) {

            recommendation =
                    "Increase test execution and resolve "
                            + "remaining test failures.";

        } else {

            recommendation =
                    "Project is progressing well. "
                            + "Continue monitoring tasks, testing "
                            + "and project quality.";
        }

        // -----------------------------------------
        // PROJECT SUMMARY
        // -----------------------------------------

        String summary =
                "Project Status: " + projectStatus
                        + "\n\n"

                        + "Task Completion: "
                        + formatPercentage(taskCompletion)
                        + "%\n"

                        + "Milestone Progress: "
                        + formatPercentage(milestoneProgress)
                        + "%\n"

                        + "Testing Progress: "
                        + formatPercentage(testingProgress)
                        + "%\n"

                        + "Open Bugs: "
                        + openBugs
                        + "\n"

                        + "High-Severity Bugs: "
                        + highSeverityBugs
                        + "\n\n"

                        + "AI Recommendation:\n"
                        + recommendation;

        // -----------------------------------------
        // RESPONSE
        // -----------------------------------------

        Map<String, Object> response =
                new HashMap<>();

        response.put(
                "projectStatus",
                projectStatus
        );

        response.put(
                "taskCompletion",
                taskCompletion
        );

        response.put(
                "milestoneProgress",
                milestoneProgress
        );

        response.put(
                "testingProgress",
                testingProgress
        );

        response.put(
                "totalTasks",
                totalTasks
        );

        response.put(
                "completedTasks",
                completedTasks
        );

        response.put(
                "totalMilestones",
                totalMilestones
        );

        response.put(
                "completedMilestones",
                completedMilestones
        );

        response.put(
                "totalTestCases",
                totalTestCases
        );

        response.put(
                "passedTestCases",
                passedTestCases
        );

        response.put(
                "totalBugs",
                totalBugs
        );

        response.put(
                "openBugs",
                openBugs
        );

        response.put(
                "highSeverityBugs",
                highSeverityBugs
        );

        response.put(
                "recommendation",
                recommendation
        );

        response.put(
                "summary",
                summary
        );

        return response;
    }

    // -----------------------------------------
    // PERCENTAGE CALCULATION
    // -----------------------------------------

    private double percentage(
            long completed,
            long total) {

        if (total == 0) {
            return 0;
        }

        return Math.round(
                ((double) completed / total) * 100
        );
    }

    // -----------------------------------------
    // FORMAT PERCENTAGE
    // -----------------------------------------

    private String formatPercentage(
            double value) {

        return String.format(
                "%.0f",
                value
        );
    }
}