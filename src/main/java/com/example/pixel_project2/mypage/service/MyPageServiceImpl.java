package com.example.pixel_project2.mypage.service;

import com.example.pixel_project2.mypage.dto.MyPagePolicyResponse;
import org.springframework.stereotype.Service;

@Service
public class MyPageServiceImpl implements MyPageService {
    @Override
    public MyPagePolicyResponse getMyPagePolicy() {
        return new MyPagePolicyResponse(true, true);
    }
}
