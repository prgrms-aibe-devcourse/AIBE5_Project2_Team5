package com.example.pixel_project2.matching;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.Map;

import static java.util.Map.entry;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class MatchingFlowIntegrationTest {
    private static final String BEARER = "Bearer ";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void projectCanBeCreatedWithMultipleCategories() throws Exception {
        signUp("matching-client@test.io", "Matching Client", "matchCli", "CLIENT");
        String token = login("matching-client@test.io", "testPass1!");

        MvcResult createResult = mockMvc.perform(post("/api/projects/create")
                        .header(HttpHeaders.AUTHORIZATION, BEARER + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.ofEntries(
                                entry("postType", "JOB_POST"),
                                entry("title", "Multi category project"),
                                entry("category", "CRAFT"),
                                entry("categories", List.of("CRAFT", "ADVERTISEMENT")),
                                entry("jobState", "LONG"),
                                entry("experienceLevel", "SENIOR"),
                                entry("budget", 500),
                                entry("overview", "Need a cross-category campaign"),
                                entry("fullDescription", "Looking for a designer across multiple categories."),
                                entry("skills", List.of("Figma")),
                                entry("responsibilities", List.of("Create the first draft")),
                                entry("qualifications", List.of("Portfolio required")),
                                entry("state", "OPEN"),
                                entry("deadline", "2034-06-26")
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.categories.length()").value(2))
                .andReturn();

        JsonNode createdProject = readData(createResult);
        long postId = createdProject.path("postId").asLong();

        assertThat(createdProject.path("categories").isArray()).isTrue();
        assertThat(createdProject.path("categories")).hasSize(2);
        assertThat(createdProject.path("category").asText()).isEqualTo(createdProject.path("categories").get(0).asText());

        MvcResult detailResult = mockMvc.perform(get("/api/projects/{postId}", postId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.categories.length()").value(2))
                .andReturn();

        JsonNode detailProject = readData(detailResult);
        assertThat(detailProject.path("category").asText()).isEqualTo(detailProject.path("categories").get(0).asText());

        MvcResult myPostsResult = mockMvc.perform(get("/api/projects/my-posts")
                        .header(HttpHeaders.AUTHORIZATION, BEARER + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();

        JsonNode myPosts = readData(myPostsResult);
        JsonNode createdMyPost = findProjectByPostId(myPosts, postId);

        assertThat(createdMyPost).isNotNull();
        assertThat(createdMyPost.path("categories")).hasSize(2);
        assertThat(createdMyPost.path("category").asText()).isEqualTo(createdMyPost.path("categories").get(0).asText());

        MvcResult listResult = mockMvc.perform(get("/api/projects")
                        .header(HttpHeaders.AUTHORIZATION, BEARER + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();

        JsonNode listedProjects = readData(listResult);
        JsonNode createdListedProject = findProjectById(listedProjects, postId);

        assertThat(createdListedProject).isNotNull();
        assertThat(createdListedProject.path("categories")).hasSize(2);
        assertThat(createdListedProject.path("category").asText()).isEqualTo(createdListedProject.path("categories").get(0).asText());
    }

    @Test
    void projectApplicationCanBeSavedAndRetrieved() throws Exception {
        signUp("apply-client@test.io", "Apply Client", "applyCli", "CLIENT");
        String clientToken = login("apply-client@test.io", "testPass1!");

        MvcResult createResult = mockMvc.perform(post("/api/projects/create")
                        .header(HttpHeaders.AUTHORIZATION, BEARER + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.ofEntries(
                                entry("postType", "JOB_POST"),
                                entry("title", "Application enabled project"),
                                entry("category", "CRAFT"),
                                entry("categories", List.of("CRAFT", "ADVERTISEMENT")),
                                entry("jobState", "LONG"),
                                entry("experienceLevel", "SENIOR"),
                                entry("budget", 500),
                                entry("overview", "Need a designer who can start soon"),
                                entry("fullDescription", "This project should accept real applications."),
                                entry("skills", List.of("Figma")),
                                entry("responsibilities", List.of("Prepare the first concept")),
                                entry("qualifications", List.of("Portfolio required")),
                                entry("state", "OPEN"),
                                entry("deadline", "2034-06-26")
                        ))))
                .andExpect(status().isOk())
                .andReturn();

        long postId = readData(createResult).path("postId").asLong();

        signUp("apply-designer@test.io", "Apply Designer", "applyDes", "DESIGNER");
        String designerToken = login("apply-designer@test.io", "testPass1!");

        mockMvc.perform(post("/api/projects/{postId}/apply", postId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + designerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "coverLetter", "I can help with this project.",
                                "summary", "Five years of branding experience.",
                                "expectedBudget", 300,
                                "portfolioUrl", "https://portfolio.example.com/apply-designer",
                                "startDate", "2034-06-01"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        MvcResult myApplicationsResult = mockMvc.perform(get("/api/projects/my-applications")
                        .header(HttpHeaders.AUTHORIZATION, BEARER + designerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();

        JsonNode myApplications = readData(myApplicationsResult);
        JsonNode savedApplication = findApplicationByPostId(myApplications, postId);

        assertThat(savedApplication).isNotNull();
        assertThat(savedApplication.path("title").asText()).isEqualTo("Application enabled project");
        assertThat(savedApplication.path("overview").asText()).isEqualTo("Need a designer who can start soon");
        assertThat(savedApplication.path("categories")).hasSize(2);

        MvcResult projectApplicationsResult = mockMvc.perform(get("/api/projects/{postId}/applications", postId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();

        JsonNode projectApplications = readData(projectApplicationsResult);
        assertThat(projectApplications).hasSize(1);
        assertThat(projectApplications.get(0).path("designerNickname").asText()).isEqualTo("applyDes");
        assertThat(projectApplications.get(0).path("summary").asText()).isEqualTo("Five years of branding experience.");
        assertThat(projectApplications.get(0).path("coverLetter").asText()).isEqualTo("I can help with this project.");
        assertThat(projectApplications.get(0).path("expectedBudget").asInt()).isEqualTo(300);
        assertThat(projectApplications.get(0).path("portfolioUrl").asText()).isEqualTo("https://portfolio.example.com/apply-designer");
        assertThat(projectApplications.get(0).path("startDate").asText()).isEqualTo("2034-06-01");

        mockMvc.perform(get("/api/projects/{postId}/applications", postId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + designerToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("본인 공고의 지원 내역만 볼 수 있습니다."));

        MvcResult unreadNotificationsResult = mockMvc.perform(get("/api/notifications/unread-count")
                        .header(HttpHeaders.AUTHORIZATION, BEARER + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value(1))
                .andReturn();

        assertThat(readData(unreadNotificationsResult).asLong()).isEqualTo(1L);

        MvcResult notificationsResult = mockMvc.perform(get("/api/notifications")
                        .header(HttpHeaders.AUTHORIZATION, BEARER + clientToken)
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();

        JsonNode notifications = objectMapper.readTree(notificationsResult.getResponse().getContentAsString())
                .path("data")
                .path("content");
        JsonNode applicationNotification = findNotificationByTypeAndReferenceId(notifications, "PROJECT_APPLY", postId);

        assertThat(applicationNotification).isNotNull();
        assertThat(applicationNotification.path("senderNickname").asText()).isEqualTo("applyDes");
        assertThat(applicationNotification.path("referenceId").asLong()).isEqualTo(postId);
    }

    @Test
    void designerCannotCreateProject() throws Exception {
        signUp("matching-designer@test.io", "Matching Designer", "matchDes", "DESIGNER");
        String token = login("matching-designer@test.io", "testPass1!");

        mockMvc.perform(post("/api/projects/create")
                        .header(HttpHeaders.AUTHORIZATION, BEARER + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.ofEntries(
                                entry("postType", "JOB_POST"),
                                entry("title", "Designer should be blocked"),
                                entry("category", "CRAFT"),
                                entry("categories", List.of("CRAFT")),
                                entry("jobState", "LONG"),
                                entry("experienceLevel", "SENIOR"),
                                entry("budget", 500),
                                entry("overview", "This should fail"),
                                entry("fullDescription", "Designers must not create job projects."),
                                entry("skills", List.of("Figma")),
                                entry("responsibilities", List.of("Create the first draft")),
                                entry("qualifications", List.of("Portfolio required")),
                                entry("state", "OPEN"),
                                entry("deadline", "2034-06-26")
                        ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("클라이언트만 프로젝트를 등록할 수 있습니다."));
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
                .andReturn();

        return readData(result);
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

        return readData(result).path("accessToken").asText();
    }

    private JsonNode readData(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString()).path("data");
    }

    private JsonNode findProjectByPostId(JsonNode projects, long postId) {
        for (JsonNode project : projects) {
            if (project.path("postId").asLong() == postId) {
                return project;
            }
        }
        return null;
    }

    private JsonNode findProjectById(JsonNode projects, long postId) {
        for (JsonNode project : projects) {
            if (project.path("id").asLong() == postId) {
                return project;
            }
        }
        return null;
    }

    private JsonNode findApplicationByPostId(JsonNode applications, long postId) {
        for (JsonNode application : applications) {
            if (application.path("postId").asLong() == postId) {
                return application;
            }
        }
        return null;
    }

    private JsonNode findNotificationByTypeAndReferenceId(JsonNode notifications, String type, long referenceId) {
        for (JsonNode notification : notifications) {
            if (type.equals(notification.path("type").asText()) && notification.path("referenceId").asLong() == referenceId) {
                return notification;
            }
        }
        return null;
    }

    private String json(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }
}
