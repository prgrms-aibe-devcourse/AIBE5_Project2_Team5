package com.example.pixel_project2.collection.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RenameCollectionFolderRequest(
        @NotBlank(message = "폴더 이름을 입력해주세요.")
        @Size(max = 100, message = "폴더 이름은 100자 이하로 입력해주세요.")
        String folderName
) {
}
