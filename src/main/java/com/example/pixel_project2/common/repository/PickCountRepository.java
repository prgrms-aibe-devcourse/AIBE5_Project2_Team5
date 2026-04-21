package com.example.pixel_project2.common.repository;

import com.example.pixel_project2.common.entity.PickCount;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PickCountRepository extends JpaRepository<PickCount, Long> {
}