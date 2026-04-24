package com.example.pixel_project2.message.entity;

import com.example.pixel_project2.common.entity.BaseTimeEntity;
import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "message_process_tasks")
@AttributeOverride(
        name = "createdAt",
        column = @Column(name = "created_message_process_task", nullable = false, updatable = false)
)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class MessageProcessTask extends BaseTimeEntity {
    @Id
    @SequenceGenerator(
            name = "message_process_task_seq_generator",
            sequenceName = "MESSAGE_PROCESS_TASK_SEQ",
            allocationSize = 1
    )
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "message_process_task_seq_generator")
    @Column(name = "task_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "process_id", nullable = false)
    private MessageProcess process;

    @Column(name = "task_text", nullable = false, length = 500)
    private String taskText;

    @Column(name = "completed", nullable = false)
    private boolean completed;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;
}
