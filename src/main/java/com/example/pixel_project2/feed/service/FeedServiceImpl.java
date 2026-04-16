package com.example.pixel_project2.feed.service;

import com.example.pixel_project2.feed.dto.FeedPolicyResponse;
import org.springframework.stereotype.Service;

@Service
public class FeedServiceImpl implements FeedService {
    @Override
    public FeedPolicyResponse getFeedDetailPolicy() {
        return new FeedPolicyResponse(true, true, true);
    }
}
