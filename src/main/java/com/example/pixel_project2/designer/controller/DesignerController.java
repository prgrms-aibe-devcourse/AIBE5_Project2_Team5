package com.example.pixel_project2.designer.controller;

import com.example.pixel_project2.common.dto.ApiResponse;
import com.example.pixel_project2.designer.dto.DesignerPolicyResponse;
import com.example.pixel_project2.designer.service.DesignerService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/designers")
@RequiredArgsConstructor
public class DesignerController {
    private final DesignerService designerService;

    @GetMapping("/{designerId}")
    public ApiResponse<DesignerPolicyResponse> getDesignerDetail(@PathVariable Long designerId) {
        return ApiResponse.ok("디자이너 상세 정책을 조회했습니다. designerId=" + designerId, designerService.getDesignerDetailPolicy());
    }
}
