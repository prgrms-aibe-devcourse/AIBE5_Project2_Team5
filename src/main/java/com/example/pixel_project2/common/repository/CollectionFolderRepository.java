package com.example.pixel_project2.common.repository;

import com.example.pixel_project2.common.entity.CollectionFolder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CollectionFolderRepository extends JpaRepository<CollectionFolder, Long> {
    List<CollectionFolder> findByUserId(Long userId);
}
