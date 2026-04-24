package com.example.pixel_project2.message.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MessageProcessTaskRequest(
        Long id,

        @NotBlank(message = "task text is required.")
        @Size(max = 500, message = "task text can be up to 500 characters.")
        String text,

        boolean completed
) {
}
