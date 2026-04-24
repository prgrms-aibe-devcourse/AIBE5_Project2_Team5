package com.example.pixel_project2.message.service;

import com.example.pixel_project2.message.dto.MessagePolicyResponse;
import org.springframework.stereotype.Service;

@Service
public class MessageServiceImpl implements MessageService {
    @Override
    public MessagePolicyResponse getMessagePolicy() {
        return new MessagePolicyResponse(true, true);
    }
}
