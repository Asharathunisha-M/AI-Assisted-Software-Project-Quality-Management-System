package com.asharathunisha.projectmanagement.repository;

import com.asharathunisha.projectmanagement.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectRepository extends JpaRepository<Project, Long> {
}