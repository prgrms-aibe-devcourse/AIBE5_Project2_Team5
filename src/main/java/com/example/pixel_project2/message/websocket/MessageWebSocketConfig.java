package com.example.pixel_project2.message.websocket;

import jakarta.websocket.server.ServerContainer;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.web.servlet.ServletContextInitializer;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

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
    public ServletContextInitializer webSocketContainerCustomizer() {
        return servletContext -> {
            Object containerAttribute = servletContext.getAttribute("jakarta.websocket.server.ServerContainer");
            if (!(containerAttribute instanceof ServerContainer container)) {
                return;
            }

            container.setDefaultMaxTextMessageBufferSize(MAX_MESSAGE_BUFFER_SIZE);
            container.setDefaultMaxBinaryMessageBufferSize(MAX_MESSAGE_BUFFER_SIZE);
            container.setDefaultMaxSessionIdleTimeout(MAX_SESSION_IDLE_TIMEOUT_MILLIS);
            container.setAsyncSendTimeout(ASYNC_SEND_TIMEOUT_MILLIS);
        };
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(messageSocketHandler, "/ws/messages")
                .addInterceptors(handshakeInterceptor)
                .setAllowedOriginPatterns("*");
    }
}
