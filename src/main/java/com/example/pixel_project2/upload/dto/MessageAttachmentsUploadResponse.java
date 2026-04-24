package com.example.pixel_project2.upload.dto;

import java.util.List;

public record MessageAttachmentsUploadResponse(
        Long conversationId,
        List<MessageAttachmentUploadItemResponse> attachments
) {
}
