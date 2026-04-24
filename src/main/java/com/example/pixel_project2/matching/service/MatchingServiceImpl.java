package com.example.pixel_project2.matching.service;

import com.example.pixel_project2.matching.dto.MatchingPolicyResponse;
import org.springframework.stereotype.Service;

@Service
public class MatchingServiceImpl implements MatchingService {
    @Override
    public MatchingPolicyResponse getCounterProposalPolicy() {
        return new MatchingPolicyResponse(true, true, true);
    }
}
