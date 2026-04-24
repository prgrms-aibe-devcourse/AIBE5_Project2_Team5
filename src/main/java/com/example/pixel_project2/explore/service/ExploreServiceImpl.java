package com.example.pixel_project2.explore.service;

import com.example.pixel_project2.explore.dto.ExplorePolicyResponse;
import org.springframework.stereotype.Service;

@Service
public class ExploreServiceImpl implements ExploreService {
    @Override
    public ExplorePolicyResponse getExplorePolicy() {
        return new ExplorePolicyResponse(true, true, true);
    }
}
