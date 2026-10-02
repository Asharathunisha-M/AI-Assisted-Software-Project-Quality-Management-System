package com.asharathunisha.projectmanagement.service;

import com.asharathunisha.projectmanagement.entity.Milestone;
import com.asharathunisha.projectmanagement.repository.MilestoneRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MilestoneService {

    private final MilestoneRepository milestoneRepository;

    public MilestoneService(MilestoneRepository milestoneRepository) {
        this.milestoneRepository = milestoneRepository;
    }

    public Milestone createMilestone(Milestone milestone) {
        return milestoneRepository.save(milestone);
    }

    public List<Milestone> getAllMilestones() {
        return milestoneRepository.findAll();
    }

    public Milestone getMilestoneById(Long id) {
        return milestoneRepository.findById(id).orElse(null);
    }

    public Milestone updateMilestone(Long id, Milestone updatedMilestone) {

        Milestone existingMilestone =
                milestoneRepository.findById(id).orElse(null);

        if (existingMilestone == null) {
            return null;
        }

        existingMilestone.setName(updatedMilestone.getName());
        existingMilestone.setDescription(updatedMilestone.getDescription());
        existingMilestone.setStatus(updatedMilestone.getStatus());
        existingMilestone.setStartDate(updatedMilestone.getStartDate());
        existingMilestone.setDueDate(updatedMilestone.getDueDate());

        return milestoneRepository.save(existingMilestone);
    }

    public void deleteMilestone(Long id) {
        milestoneRepository.deleteById(id);
    }

    public List<Milestone> getMilestonesByProjectId(Long projectId) {
        return milestoneRepository.findByProjectId(projectId);
    }
}