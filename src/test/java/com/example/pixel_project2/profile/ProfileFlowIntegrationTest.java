package com.example.pixel_project2.profile;

import com.example.pixel_project2.config.jwt.AuthenticatedUser;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ProfileFlowIntegrationTest {
    private static final String BEARER = "Bearer ";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void designerCanCompleteProfileFlow() throws Exception {
        mockMvc.perform(get("/api/profiles/me"))
                .andExpect(status().isUnauthorized());

        signUp("flow1@test.io", "흐름사용자", "흐름닉", "DESIGNER");
        String token = login("flow1@test.io", "testPass1!");

        mockMvc.perform(get("/api/profiles/me").header(HttpHeaders.AUTHORIZATION, BEARER + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.loginId").value("flow1@test.io"))
                .andExpect(jsonPath("$.data.name").value("흐름사용자"))
                .andExpect(jsonPath("$.data.owner").value(true));

        mockMvc.perform(patch("/api/profiles/me")
                        .header(HttpHeaders.AUTHORIZATION, BEARER + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "name", "프로필검증",
                                "nickname", "검증닉",
                                "url", "https://pickxel.example/profile",
                                "location", "서울 마포구"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("프로필검증"))
                .andExpect(jsonPath("$.data.nickname").value("검증닉"))
                .andExpect(jsonPath("$.data.url").value("https://pickxel.example/profile"))
                .andExpect(jsonPath("$.data.location").value("서울 마포구"));

        mockMvc.perform(put("/api/profiles/me/designer")
                        .header(HttpHeaders.AUTHORIZATION, BEARER + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "job", "공예가",
                                "introduction", "손으로 오래 남는 물건을 만듭니다.",
                                "workStatus", "AVAILABLE",
                                "workType", "FREELANCER",
                                "figmaUrl", "https://figma.com/@pickxel",
                                "photoshopUrl", "https://behance.net/pickxel",
                                "adobeUrl", "https://adobe.com/pickxel"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.job").value("공예가"))
                .andExpect(jsonPath("$.data.introduction").value("손으로 오래 남는 물건을 만듭니다."))
                .andExpect(jsonPath("$.data.workStatus").value("AVAILABLE"))
                .andExpect(jsonPath("$.data.workType").value("FREELANCER"))
                .andExpect(jsonPath("$.data.figmaUrl").value("https://figma.com/@pickxel"))
                .andExpect(jsonPath("$.data.photoshopUrl").value("https://behance.net/pickxel"))
                .andExpect(jsonPath("$.data.adobeUrl").value("https://adobe.com/pickxel"));

        mockMvc.perform(get("/api/profiles/me").header(HttpHeaders.AUTHORIZATION, BEARER + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.nickname").value("검증닉"))
                .andExpect(jsonPath("$.data.location").value("서울 마포구"))
                .andExpect(jsonPath("$.data.job").value("공예가"));

        mockMvc.perform(get("/api/profiles/검증닉").header(HttpHeaders.AUTHORIZATION, BEARER + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.owner").value(true))
                .andExpect(jsonPath("$.data.loginId").value("flow1@test.io"));

        mockMvc.perform(get("/api/profiles/me/feeds").header(HttpHeaders.AUTHORIZATION, BEARER + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());

        mockMvc.perform(get("/api/profiles/me/reviews").header(HttpHeaders.AUTHORIZATION, BEARER + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());

        mockMvc.perform(post("/api/auth/logout")
                        .header(HttpHeaders.AUTHORIZATION, BEARER + token)
                        .session(new MockHttpSession()))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("JSESSIONID=")))
                .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("Max-Age=0")));

        mockMvc.perform(get("/api/profiles/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void bearerTokenWinsOverStaleSessionForMyProfile() throws Exception {
        JsonNode firstUser = signUp("flowa@test.io", "첫사용자", "첫닉", "DESIGNER");
        signUp("flowb@test.io", "둘사용자", "둘닉", "DESIGNER");
        String secondToken = login("flowb@test.io", "testPass1!");

        MockHttpSession staleSession = new MockHttpSession();
        AuthenticatedUser staleUser = new AuthenticatedUser(
                firstUser.path("userId").asLong(),
                "flowa@test.io",
                "첫사용자",
                "첫닉",
                com.example.pixel_project2.common.entity.enums.UserRole.DESIGNER
        );
        UsernamePasswordAuthenticationToken staleAuthentication = new UsernamePasswordAuthenticationToken(
                staleUser,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_DESIGNER"))
        );
        staleSession.setAttribute(
                HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
                new SecurityContextImpl(staleAuthentication)
        );

        mockMvc.perform(get("/api/profiles/me")
                        .session(staleSession)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + secondToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.loginId").value("flowb@test.io"))
                .andExpect(jsonPath("$.data.nickname").value("둘닉"));
    }

    private JsonNode signUp(String loginId, String name, String nickname, String role) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "loginId", loginId,
                                "password", "testPass1!",
                                "name", name,
                                "nickname", nickname,
                                "role", role
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.loginId").value(loginId))
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString()).path("data");
    }

    private String login(String loginId, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "loginId", loginId,
                                "password", password
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isString())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data")
                .path("accessToken")
                .asText();
    }

    private String json(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }
}
