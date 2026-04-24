package com.example.pixel_project2.message.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record SaveMessageProcessesRequest(
        @NotNull(message = "processes are required.")
        @Valid
        List<MessageProcessRequest> processes
) {
}
