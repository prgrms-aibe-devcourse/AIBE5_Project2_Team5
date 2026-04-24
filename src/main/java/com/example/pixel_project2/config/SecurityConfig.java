package com.example.pixel_project2.config;

import com.example.pixel_project2.config.jwt.JwtAuthenticationFilter;
import com.example.pixel_project2.config.oauth.GoogleAuthorizationRequestResolver;
import com.example.pixel_project2.config.oauth.OAuth2LoginFailureHandler;
import com.example.pixel_project2.config.oauth.OAuth2LoginSuccessHandler;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

// 💡 CORS 설정을 위한 import 추가
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Value("${app.cors.allowed-origins}")
    private List<String> corsAllowedOrigins;


    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationFilter jwtAuthenticationFilter,
            OAuth2LoginSuccessHandler oauth2LoginSuccessHandler,
            OAuth2LoginFailureHandler oauth2LoginFailureHandler,
            GoogleAuthorizationRequestResolver googleAuthorizationRequestResolver
    ) throws Exception {
        http
                // ⭐ 1. CORS 설정 활성화 (아래 정의한 Bean 사용)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                .csrf(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json;charset=UTF-8");
                            response.getWriter().write("{\"success\":false,\"message\":\"인증이 필요합니다.\",\"data\":null}");
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setContentType("application/json;charset=UTF-8");
                            response.getWriter().write("{\"success\":false,\"message\":\"접근 권한이 없습니다.\",\"data\":null}");
                        })
                )
                .authorizeHttpRequests(authorize -> authorize
                        // ⭐ 2. OPTIONS 메서드로 들어오는 예비 요청(Preflight)은 토큰 없이도 무조건 허용!
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        .requestMatchers("/error").permitAll()
                        .requestMatchers(
                        HttpMethod.GET,
                        "/api/auth/oauth2/**",
                        "/api/auth/nickname/check",
                        "/oauth2/**",
                        "/login/oauth2/**",
                        "/ws/**"
                ).permitAll()
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/auth/login",
                                "/api/auth/logout",
                                "/api/auth/signup",
                                "/api/auth/password-reset",
                                "/api/auth/password-reset/**"
                        ).permitAll()
                        .requestMatchers(SecurityConfig::isPublicAuthRequest).permitAll()
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth2 -> oauth2
                        .authorizationEndpoint(authorization -> authorization
                                .authorizationRequestResolver(googleAuthorizationRequestResolver)
                        )
                        .successHandler(oauth2LoginSuccessHandler)
                        .failureHandler(oauth2LoginFailureHandler)
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // ⭐ 3. CORS 상세 설정 Bean 추가 (프론트엔드 주소 허용)
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // 프론트엔드 로컬 개발 환경 주소 허용 (localhost와 127.0.0.1 모두 등록해두는 것이 안전합니다)
        config.setAllowedOrigins(
                corsAllowedOrigins.stream()
                        .map(String::trim)
                        .filter(origin -> !origin.isBlank())
                        .toList()
        );
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")); // 허용할 HTTP 메서드
        config.setAllowedHeaders(List.of("*")); // 모든 헤더 허용 (JWT 토큰 등을 받기 위해)
        config.setAllowCredentials(true); // 쿠키나 인증 정보 포함 허용

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config); // 모든 API 경로에 이 규칙 적용
        return source;
    }

    private static boolean isPublicAuthRequest(HttpServletRequest request) {
        if (!"POST".equals(request.getMethod())) {
            return false;
        }

        String path = request.getServletPath();
        return "/api/auth/login".equals(path)
                || "/api/auth/logout".equals(path)
                || "/api/auth/signup".equals(path)
                || "/api/auth/password-reset".equals(path)
                || path.startsWith("/api/auth/password-reset/");
    }
}
