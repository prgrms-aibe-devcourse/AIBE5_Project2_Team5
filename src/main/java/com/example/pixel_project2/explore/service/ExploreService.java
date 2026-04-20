package com.example.pixel_project2.explore.service;

import com.example.pixel_project2.explore.dto.DesignerPostCount;
import com.example.pixel_project2.explore.dto.ExplorePolicyResponse;

import java.util.List;

public interface ExploreService {
    ExplorePolicyResponse getExplorePolicy();

    List<DesignerPostCount> getDesignerListWithPostCount();
}
