package com.example.pixel_project2.common.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "collection_folders")
@AttributeOverride(name = "createdAt", column = @Column(name = "created_collect", nullable = false, updatable = false))
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class CollectionFolder extends BaseTimeEntity {
    @Id
    @SequenceGenerator(
            name = "CollectionFolder_SEQ_generator",
            sequenceName = "COLLECTION_FOLDER_SEQ",
            allocationSize = 1
    )
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "CollectionFolder_SEQ_generator")
    @Column(name = "folder_id")
    private Long folder_id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "folder_name", nullable = false, length = 100)
    private String folderName;

    @Column(name = "sort_order")
    private Integer sortOrder;
}
