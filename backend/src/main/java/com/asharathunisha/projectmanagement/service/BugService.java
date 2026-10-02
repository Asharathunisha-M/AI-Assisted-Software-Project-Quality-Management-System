package com.asharathunisha.projectmanagement.service;

import com.asharathunisha.projectmanagement.entity.Bug;
import com.asharathunisha.projectmanagement.repository.BugRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BugService {

    private final BugRepository bugRepository;

    public BugService(BugRepository bugRepository) {
        this.bugRepository = bugRepository;
    }

    public Bug createBug(Bug bug) {
        return bugRepository.save(bug);
    }

    public List<Bug> getAllBugs() {
        return bugRepository.findAll();
    }

    public Bug getBugById(Long id) {
        return bugRepository.findById(id).orElse(null);
    }

    public Bug updateBug(Long id, Bug updatedBug) {

        Bug existingBug = bugRepository.findById(id).orElse(null);

        if (existingBug == null) {
            return null;
        }

        existingBug.setTitle(updatedBug.getTitle());
        existingBug.setDescription(updatedBug.getDescription());
        existingBug.setSeverity(updatedBug.getSeverity());
        existingBug.setPriority(updatedBug.getPriority());
        existingBug.setStatus(updatedBug.getStatus());
        existingBug.setAssignedTo(updatedBug.getAssignedTo());
        existingBug.setReportedBy(updatedBug.getReportedBy());
        existingBug.setCreatedDate(updatedBug.getCreatedDate());

        return bugRepository.save(existingBug);
    }

    public void deleteBug(Long id) {
        bugRepository.deleteById(id);
    }

    public List<Bug> getBugsByProjectId(Long projectId) {
        return bugRepository.findByProjectId(projectId);
    }
}