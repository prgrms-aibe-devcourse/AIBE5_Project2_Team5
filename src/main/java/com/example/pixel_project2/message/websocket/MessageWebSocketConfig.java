package com.example.pixel_project2.message.websocket;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Bean;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.server.standard.ServletServerContainerFactoryBean;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class MessageWebSocketConfig implements WebSocketConfigurer {
    private static final int MAX_MESSAGE_BUFFER_SIZE = 6 * 1024 * 1024;
    private static final long MAX_SESSION_IDLE_TIMEOUT_MILLIS = 120_000L;
    private static final long ASYNC_SEND_TIMEOUT_MILLIS = 15_000L;

    private final MessageSocketHandler messageSocketHandler;
    private final MessageSocketHandshakeInterceptor handshakeInterceptor;

    @Bean
    public ServletServerContainerFactoryBean webSocketContainer() {
        ServletServerContainerFactoryBean container = new ServletServerContainerFactoryBean();
        container.setMaxTextMessageBufferSize(MAX_MESSAGE_BUFFER_SIZE);
        container.setMaxBinaryMessageBufferSize(MAX_MESSAGE_BUFFER_SIZE);
        container.setMaxSessionIdleTimeout(MAX_SESSION_IDLE_TIMEOUT_MILLIS);
        container.setAsyncSendTimeout(ASYNC_SEND_TIMEOUT_MILLIS);
        return container;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(messageSocketHandler, "/ws/messages")
                .addInterceptors(handshakeInterceptor)
                .setAllowedOriginPatterns("*");
    }
}
