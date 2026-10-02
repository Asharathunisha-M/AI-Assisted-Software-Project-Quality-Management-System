package com.asharathunisha.projectmanagement.service;

import com.asharathunisha.projectmanagement.repository.BugRepository;
import com.asharathunisha.projectmanagement.repository.MilestoneRepository;
import com.asharathunisha.projectmanagement.repository.ProjectRepository;
import com.asharathunisha.projectmanagement.repository.RequirementRepository;
import com.asharathunisha.projectmanagement.repository.TaskRepository;
import com.asharathunisha.projectmanagement.repository.TestCaseRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class DashboardService {

    private final ProjectRepository projectRepository;
    private final RequirementRepository requirementRepository;
    private final TaskRepository taskRepository;
    private final MilestoneRepository milestoneRepository;
    private final TestCaseRepository testCaseRepository;
    private final BugRepository bugRepository;

    public DashboardService(
            ProjectRepository projectRepository,
            RequirementRepository requirementRepository,
            TaskRepository taskRepository,
            MilestoneRepository milestoneRepository,
            TestCaseRepository testCaseRepository,
            BugRepository bugRepository) {

        this.projectRepository = projectRepository;
        this.requirementRepository = requirementRepository;
        this.taskRepository = taskRepository;
        this.milestoneRepository = milestoneRepository;
        this.testCaseRepository = testCaseRepository;
        this.bugRepository = bugRepository;
    }

    public Map<String, Long> getDashboardSummary() {

        Map<String, Long> summary = new HashMap<>();

        summary.put("totalProjects", projectRepository.count());
        summary.put("totalRequirements", requirementRepository.count());
        summary.put("totalTasks", taskRepository.count());
        summary.put("totalMilestones", milestoneRepository.count());
        summary.put("totalTestCases", testCaseRepository.count());
        summary.put("totalBugs", bugRepository.count());

        return summary;
    }
}