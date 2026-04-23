package com.example.pixel_project2.message.dto;

import java.util.List;

public record SaveMessageProcessesRequest(
        List<MessageProcessRequest> processes
) {
}
