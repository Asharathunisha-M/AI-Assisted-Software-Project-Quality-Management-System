package com.asharathunisha.projectmanagement.repository;

import com.asharathunisha.projectmanagement.entity.Requirement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RequirementRepository extends JpaRepository<Requirement, Long> {

    List<Requirement> findByProjectId(Long projectId);
}