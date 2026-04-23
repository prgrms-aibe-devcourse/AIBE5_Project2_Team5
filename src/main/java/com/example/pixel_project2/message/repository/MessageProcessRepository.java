package com.example.pixel_project2.message.repository;

import com.example.pixel_project2.message.entity.MessageProcess;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MessageProcessRepository extends JpaRepository<MessageProcess, Long> {
    @Query("select distinct p from MessageProcess p " +
            "left join fetch p.tasks t " +
            "where p.conversation.id = :conversationId " +
            "order by p.sortOrder asc, p.id asc, t.sortOrder asc, t.id asc")
    List<MessageProcess> findAllByConversationIdWithTasks(@Param("conversationId") Long conversationId);

    @Query("select distinct p from MessageProcess p " +
            "left join fetch p.tasks t " +
            "where p.id = :processId and p.conversation.id = :conversationId " +
            "order by t.sortOrder asc, t.id asc")
    Optional<MessageProcess> findByIdAndConversationIdWithTasks(
            @Param("processId") Long processId,
            @Param("conversationId") Long conversationId
    );
}
