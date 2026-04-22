package com.example.pixel_project2.common.repository;

import com.example.pixel_project2.common.entity.Collection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CollectionRepository extends JpaRepository<Collection, Long> {
    @Modifying
    @Query("delete from Collection c where c.post.id = :postId")
    void deleteByPostId(@Param("postId") Long postId);

    @Query("select count(c) from Collection c where c.folder.folder_id = :folderId")
    long countByFolderId(@Param("folderId") Long folderId);

    @Query("select distinct c from Collection c " +
            "join fetch c.post p " +
            "join fetch p.user u " +
            "left join fetch p.feed feed " +
            "left join fetch p.images image " +
            "where c.folder.folder_id = :folderId " +
            "order by c.collection_id desc")
    List<Collection> findByFolderIdWithPostDetails(@Param("folderId") Long folderId);

    @Query("select c from Collection c where c.folder.folder_id = :folderId and c.post.id = :postId")
    Optional<Collection> findByFolderIdAndPostId(@Param("folderId") Long folderId, @Param("postId") Long postId);

    @Query("select count(c) from Collection c where c.folder.folder_id = :folderId and c.post.id = :postId")
    long countByFolderIdAndPostId(@Param("folderId") Long folderId, @Param("postId") Long postId);

    @Modifying
    @Query("delete from Collection c where c.folder.folder_id = :folderId")
    void deleteByFolderId(@Param("folderId") Long folderId);

    @Modifying
    @Query("delete from Collection c where c.folder.folder_id = :folderId and c.post.id = :postId")
    void deleteByFolderIdAndPostId(@Param("folderId") Long folderId, @Param("postId") Long postId);
}

