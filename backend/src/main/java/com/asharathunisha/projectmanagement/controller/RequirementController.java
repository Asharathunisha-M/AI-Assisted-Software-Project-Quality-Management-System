package com.asharathunisha.projectmanagement.controller;

import com.asharathunisha.projectmanagement.entity.Requirement;
import com.asharathunisha.projectmanagement.service.RequirementService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/requirements")
public class RequirementController {

    private final RequirementService requirementService;

    public RequirementController(RequirementService requirementService) {
        this.requirementService = requirementService;
    }

    @PostMapping
    public Requirement createRequirement(@RequestBody Requirement requirement) {
        return requirementService.createRequirement(requirement);
    }

    @GetMapping
    public List<Requirement> getAllRequirements() {
        return requirementService.getAllRequirements();
    }

    @GetMapping("/{id}")
    public Requirement getRequirementById(@PathVariable Long id) {
        return requirementService.getRequirementById(id);
    }
    @PutMapping("/{id}")
    public Requirement updateRequirement(
            @PathVariable Long id,
            @RequestBody Requirement requirement) {
        return requirementService.updateRequirement(id, requirement);
    }
    @DeleteMapping("/{id}")
    public void deleteRequirement(@PathVariable Long id) {
        requirementService.deleteRequirement(id);
    }
    @GetMapping("/project/{projectId}")
    public List<Requirement> getRequirementsByProjectId(@PathVariable Long projectId) {
        return requirementService.getRequirementsByProjectId(projectId);
    }
}