package com.asharathunisha.projectmanagement.service;

import com.asharathunisha.projectmanagement.entity.Project;
import com.asharathunisha.projectmanagement.repository.ProjectRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;

    public ProjectService(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    public Project createProject(Project project) {
        return projectRepository.save(project);
    }

    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    public Project getProjectById(Long id) {
        return projectRepository.findById(id).orElse(null);
    }
    public Project updateProject(Long id, Project updatedProject) {
        Project existingProject = projectRepository.findById(id).orElse(null);

        if (existingProject == null) {
            return null;
        }

        existingProject.setName(updatedProject.getName());
        existingProject.setDescription(updatedProject.getDescription());
        existingProject.setStatus(updatedProject.getStatus());
        existingProject.setStartDate(updatedProject.getStartDate());
        existingProject.setEndDate(updatedProject.getEndDate());

        return projectRepository.save(existingProject);
    }
    public void deleteProject(Long id) {
        projectRepository.deleteById(id);
    }
}
