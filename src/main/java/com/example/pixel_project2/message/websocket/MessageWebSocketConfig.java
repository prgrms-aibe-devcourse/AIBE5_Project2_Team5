package com.example.pixel_project2.message.websocket;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class MessageWebSocketConfig implements WebSocketConfigurer {
    private final MessageSocketHandler messageSocketHandler;
    private final MessageSocketHandshakeInterceptor handshakeInterceptor;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(messageSocketHandler, "/ws/messages")
                .addInterceptors(handshakeInterceptor)
                .setAllowedOriginPatterns("*");
    }
}
