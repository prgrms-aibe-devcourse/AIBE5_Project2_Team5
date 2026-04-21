package com.example.pixel_project2.feed.service;

import com.example.pixel_project2.common.entity.enums.PostType;
import com.example.pixel_project2.feed.dto.FeedListResponse;
import com.example.pixel_project2.feed.dto.FeedPolicyResponse;

public interface FeedService {
    FeedListResponse getFeeds(PostType postType, int page, int size);

    FeedPolicyResponse getFeedDetailPolicy();
}
