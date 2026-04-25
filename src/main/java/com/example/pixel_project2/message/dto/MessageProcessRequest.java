package com.example.pixel_project2.message.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record MessageProcessRequest(
        Long id,

        @NotBlank(message = "process title is required.")
        @Size(max = 200, message = "process title can be up to 200 characters.")
        String title,

        @Valid
        MessageProcessConfirmationsRequest confirmations,

        @NotEmpty(message = "process tasks are required.")
        @Valid
        List<MessageProcessTaskRequest> tasks
) {
}
