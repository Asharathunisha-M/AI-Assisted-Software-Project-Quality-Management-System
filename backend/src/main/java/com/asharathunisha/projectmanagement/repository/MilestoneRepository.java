package com.asharathunisha.projectmanagement.repository;

import com.asharathunisha.projectmanagement.entity.Milestone;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MilestoneRepository
        extends JpaRepository<Milestone, Long> {

    List<Milestone> findByProjectId(Long projectId);
}