package com.example.pixel_project2.config.oauth;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class GoogleAuthorizationRequestResolver implements OAuth2AuthorizationRequestResolver {
    private static final String AUTHORIZATION_REQUEST_BASE_URI = "/oauth2/authorization";

    private final OAuth2AuthorizationRequestResolver delegate;

    public GoogleAuthorizationRequestResolver(ClientRegistrationRepository clientRegistrationRepository) {
        this.delegate = new DefaultOAuth2AuthorizationRequestResolver(
                clientRegistrationRepository,
                AUTHORIZATION_REQUEST_BASE_URI
        );
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request) {
        return customizePrompt(delegate.resolve(request));
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request, String clientRegistrationId) {
        return customizePrompt(delegate.resolve(request, clientRegistrationId));
    }

    private OAuth2AuthorizationRequest customizePrompt(OAuth2AuthorizationRequest authorizationRequest) {
        if (authorizationRequest == null) {
            return null;
        }

        Map<String, Object> additionalParameters = new LinkedHashMap<>(authorizationRequest.getAdditionalParameters());
        String authorizationUri = authorizationRequest.getAuthorizationUri();
        if (authorizationUri.contains("accounts.google.com")) {
            additionalParameters.put("prompt", "select_account");
        } else if (authorizationUri.contains("kauth.kakao.com")) {
            additionalParameters.put("prompt", "login");
        } else {
            return authorizationRequest;
        }

        return OAuth2AuthorizationRequest.from(authorizationRequest)
                .additionalParameters(additionalParameters)
                .build();
    }
}
