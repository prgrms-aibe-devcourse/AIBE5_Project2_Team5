package com.example.pixel_project2.landing.service;

import com.example.pixel_project2.landing.dto.LandingInfoResponse;
import org.springframework.stereotype.Service;

@Service
public class LandingServiceImpl implements LandingService {
    @Override
    public LandingInfoResponse getLandingInfo() {
        return new LandingInfoResponse("로그인 전 사용자용 랜딩 소개 문구입니다.", true);
    }
}
