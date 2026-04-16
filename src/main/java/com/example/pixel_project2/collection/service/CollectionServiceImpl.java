package com.example.pixel_project2.collection.service;

import com.example.pixel_project2.collection.dto.CollectionPolicyResponse;
import org.springframework.stereotype.Service;

@Service
public class CollectionServiceImpl implements CollectionService {
    @Override
    public CollectionPolicyResponse getCollectionPolicy() {
        return new CollectionPolicyResponse(true, true);
    }
}
