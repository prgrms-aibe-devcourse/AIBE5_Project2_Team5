package com.example.pixel_project2.profile.dto;

import jakarta.validation.constraints.Size;

public record UpdateDesignerProfileRequest(
        @Size(max = 50, message = "Job must be 50 characters or less.")
        String job,

        String introduction,

        String workStatus,

        String workType,

        @Size(max = 255, message = "Figma URL must be 255 characters or less.")
        String figmaUrl,

        @Size(max = 255, message = "Photoshop URL must be 255 characters or less.")
        String photoshopUrl,

        @Size(max = 255, message = "Adobe URL must be 255 characters or less.")
        String adobeUrl
) {
}
