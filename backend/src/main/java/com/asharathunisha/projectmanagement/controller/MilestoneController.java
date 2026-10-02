package com.asharathunisha.projectmanagement.controller;

import com.asharathunisha.projectmanagement.entity.Milestone;
import com.asharathunisha.projectmanagement.service.MilestoneService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/milestones")
public class MilestoneController {

    private final MilestoneService milestoneService;

    public MilestoneController(MilestoneService milestoneService) {
        this.milestoneService = milestoneService;
    }

    // ================= CREATE MILESTONE =================

    @PostMapping
    public Milestone createMilestone(
            @RequestBody Milestone milestone) {

        return milestoneService.createMilestone(milestone);
    }

    // ================= GET ALL MILESTONES =================

    @GetMapping
    public List<Milestone> getAllMilestones() {

        return milestoneService.getAllMilestones();
    }

    // ================= GET MILESTONE BY ID =================

    @GetMapping("/{id}")
    public Milestone getMilestoneById(
            @PathVariable Long id) {

        return milestoneService.getMilestoneById(id);
    }

    // ================= GET MILESTONES BY PROJECT =================

    @GetMapping("/project/{projectId}")
    public List<Milestone> getMilestonesByProject(
            @PathVariable Long projectId) {

        return milestoneService.getMilestonesByProjectId(projectId);
    }

    // ================= UPDATE MILESTONE =================

    @PutMapping("/{id}")
    public Milestone updateMilestone(
            @PathVariable Long id,
            @RequestBody Milestone milestone) {

        return milestoneService.updateMilestone(id, milestone);
    }

    // ================= DELETE MILESTONE =================

    @DeleteMapping("/{id}")
    public void deleteMilestone(
            @PathVariable Long id) {

        milestoneService.deleteMilestone(id);
    }
}