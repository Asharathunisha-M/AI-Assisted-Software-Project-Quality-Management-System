package com.asharathunisha.projectmanagement.repository;

import com.asharathunisha.projectmanagement.entity.Bug;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BugRepository extends JpaRepository<Bug, Long> {

    List<Bug> findByProjectId(Long projectId);
}