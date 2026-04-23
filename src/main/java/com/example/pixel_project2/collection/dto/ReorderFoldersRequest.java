package com.example.pixel_project2.collection.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record ReorderFoldersRequest(
        @NotEmpty(message = "순서 변경을 위한 폴더 ID 리스트가 필요합니다.")
        List<Long> folderIds
) {
}
