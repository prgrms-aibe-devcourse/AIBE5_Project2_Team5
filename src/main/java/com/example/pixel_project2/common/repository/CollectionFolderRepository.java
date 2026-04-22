package com.example.pixel_project2.common.repository;

import com.example.pixel_project2.common.entity.CollectionFolder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CollectionFolderRepository extends JpaRepository<CollectionFolder, Long> {
    @Query("select f from CollectionFolder f join fetch f.user where f.folder_id = :folderId")
    Optional<CollectionFolder> findByIdWithUser(@Param("folderId") Long folderId);

    @Query("select f from CollectionFolder f where f.user.id = :userId order by f.createdAt desc")
    List<CollectionFolder> findByUserId(@Param("userId") Long userId);

    @Query("select f from CollectionFolder f where f.user.id = :userId and f.folderName = :folderName")
    Optional<CollectionFolder> findByUserIdAndFolderName(
            @Param("userId") Long userId,
            @Param("folderName") String folderName
    );
}
