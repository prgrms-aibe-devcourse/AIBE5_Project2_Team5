package com.example.pixel_project2.common.repository;

import com.example.pixel_project2.common.entity.Collection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CollectionRepository extends JpaRepository<Collection, Long> {
    @Modifying
    @Query("delete from Collection c where c.post.id = :postId")
    void deleteByPostId(@Param("postId") Long postId);

    boolean existsByFolder_Folder_idAndPost_Id(Long folderId, Long postId);

    List<Collection> findByFolder_User_Id(Long userId);
}
