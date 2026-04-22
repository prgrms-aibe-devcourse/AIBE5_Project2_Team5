package com.example.pixel_project2.profile.dto;

import jakarta.validation.constraints.Size;

public record UpdateDesignerProfileRequest(
        @Size(max = 50, message = "Job must be 50 characters or less.")
        String job,

        String introduction,

        String workStatus,

        String workType
) {
}
