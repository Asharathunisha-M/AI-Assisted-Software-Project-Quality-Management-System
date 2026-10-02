package com.asharathunisha.projectmanagement.service;

import com.asharathunisha.projectmanagement.entity.Requirement;
import com.asharathunisha.projectmanagement.repository.RequirementRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RequirementService {

    private final RequirementRepository requirementRepository;

    public RequirementService(RequirementRepository requirementRepository) {
        this.requirementRepository = requirementRepository;
    }

    public Requirement createRequirement(Requirement requirement) {
        return requirementRepository.save(requirement);
    }

    public List<Requirement> getAllRequirements() {
        return requirementRepository.findAll();
    }

    public Requirement getRequirementById(Long id) {
        return requirementRepository.findById(id).orElse(null);
    }
    public Requirement updateRequirement(Long id, Requirement updatedRequirement) {
        Requirement existingRequirement =
                requirementRepository.findById(id).orElse(null);

        if (existingRequirement == null) {
            return null;
        }

        existingRequirement.setTitle(updatedRequirement.getTitle());
        existingRequirement.setDescription(updatedRequirement.getDescription());
        existingRequirement.setPriority(updatedRequirement.getPriority());
        existingRequirement.setStatus(updatedRequirement.getStatus());
        existingRequirement.setType(updatedRequirement.getType());

        return requirementRepository.save(existingRequirement);
    }
    public void deleteRequirement(Long id) {
        requirementRepository.deleteById(id);
    }
    public List<Requirement> getRequirementsByProjectId(Long projectId) {
        return requirementRepository.findByProjectId(projectId);
    }
}