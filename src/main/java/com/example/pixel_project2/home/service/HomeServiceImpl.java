package com.example.pixel_project2.home.service;

import com.example.pixel_project2.home.dto.HomeFeedPolicyResponse;
import org.springframework.stereotype.Service;

@Service
public class HomeServiceImpl implements HomeService {
    @Override
    public HomeFeedPolicyResponse getHomeFeedPolicy() {
        return new HomeFeedPolicyResponse("follow-first-then-latest-random", true);
    }
}
