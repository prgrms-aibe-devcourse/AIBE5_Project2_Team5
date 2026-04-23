package com.example.pixel_project2.common.repository;

import com.example.pixel_project2.common.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    long countByPost_Id(Long postId);

    @Query("select c from Comment c join fetch c.user where c.post.id = :postId order by c.commentId asc")
    List<Comment> findAllByPostId(@Param("postId") Long postId);

    @Query("select c from Comment c join fetch c.user join fetch c.post where c.commentId = :commentId and c.post.id = :postId")
    Optional<Comment> findByIdWithUserAndPost(@Param("commentId") Long commentId, @Param("postId") Long postId);

    default long countByPostId(Long postId) {
        return countByPost_Id(postId);
    }

    @Modifying
    @Query("delete from Comment c where c.post.id = :postId")
    void deleteByPostId(@Param("postId") Long postId);
}
