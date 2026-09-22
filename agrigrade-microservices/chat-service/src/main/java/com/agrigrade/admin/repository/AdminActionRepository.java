package com.agrigrade.admin.repository;

import com.agrigrade.admin.entity.AdminAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminActionRepository extends JpaRepository<AdminAction, Long> {
    List<AdminAction> findAllByOrderByExecutedAtDesc();
}
