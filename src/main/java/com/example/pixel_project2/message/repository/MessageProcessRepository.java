package com.example.pixel_project2.message.repository;

import com.example.pixel_project2.message.entity.MessageProcess;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MessageProcessRepository extends JpaRepository<MessageProcess, Long> {
    @Query("select distinct p from MessageProcess p " +
            "left join fetch p.tasks t " +
            "where p.conversation.id = :conversationId " +
            "order by p.sortOrder asc, t.sortOrder asc")
    List<MessageProcess> findAllByConversationId(@Param("conversationId") Long conversationId);

    @Modifying
    @Query("delete from MessageProcess p where p.conversation.id = :conversationId")
    void deleteAllByConversationId(@Param("conversationId") Long conversationId);
}
