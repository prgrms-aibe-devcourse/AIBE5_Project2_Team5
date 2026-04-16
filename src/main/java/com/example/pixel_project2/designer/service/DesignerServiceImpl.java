package com.example.pixel_project2.designer.service;

import com.example.pixel_project2.designer.dto.DesignerPolicyResponse;
import org.springframework.stereotype.Service;

@Service
public class DesignerServiceImpl implements DesignerService {
    @Override
    public DesignerPolicyResponse getDesignerDetailPolicy() {
        return new DesignerPolicyResponse(true, true);
    }
}
