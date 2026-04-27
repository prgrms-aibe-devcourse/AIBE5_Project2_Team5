package com.example.pixel_project2.matching;

import com.example.pixel_project2.common.entity.Post;
import com.example.pixel_project2.common.entity.PostImage;
import com.example.pixel_project2.common.repository.PostImageRepository;
import com.example.pixel_project2.common.repository.PostRepository;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private PostImageRepository postImageRepository;

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
                .andExpect(jsonPath("$.data.categories.length()").value(1))
                .andReturn();

        JsonNode createdProject = readData(createResult);
        long postId = createdProject.path("postId").asLong();

        assertThat(createdProject.path("categories").isArray()).isTrue();
        assertThat(createdProject.path("categories")).hasSize(1);
        assertThat(createdProject.path("category").asText()).isEqualTo(createdProject.path("categories").get(0).asText());

        MvcResult detailResult = mockMvc.perform(get("/api/projects/{postId}", postId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.categories.length()").value(1))
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
        assertThat(createdMyPost.path("categories")).hasSize(1);
        assertThat(createdMyPost.path("category").asText()).isEqualTo(createdMyPost.path("categories").get(0).asText());

        MvcResult listResult = mockMvc.perform(get("/api/projects")
                        .header(HttpHeaders.AUTHORIZATION, BEARER + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();

        JsonNode listedProjects = readData(listResult);
        JsonNode createdListedProject = findProjectById(listedProjects, postId);

        assertThat(createdListedProject).isNotNull();
        assertThat(createdListedProject.path("categories")).hasSize(1);
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
        assertThat(savedApplication.path("categories")).hasSize(1);

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
                .andExpect(jsonPath("$.success").value(false));

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
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void clientCanUpdateAndDeleteOwnProject() throws Exception {
        signUp("edit-client@test.io", "Edit Client", "editCli", "CLIENT");
        String clientToken = login("edit-client@test.io", "testPass1!");

        MvcResult createResult = mockMvc.perform(post("/api/projects/create")
                        .header(HttpHeaders.AUTHORIZATION, BEARER + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.ofEntries(
                                entry("postType", "JOB_POST"),
                                entry("title", "Original project"),
                                entry("category", "CRAFT"),
                                entry("categories", List.of("CRAFT")),
                                entry("jobState", "LONG"),
                                entry("experienceLevel", "SENIOR"),
                                entry("budget", 500),
                                entry("overview", "Original overview"),
                                entry("fullDescription", "Original full description"),
                                entry("skills", List.of("Figma")),
                                entry("responsibilities", List.of("Original task")),
                                entry("qualifications", List.of("Original qualification")),
                                entry("state", "OPEN"),
                                entry("deadline", "2034-06-26")
                        ))))
                .andExpect(status().isOk())
                .andReturn();

        long postId = readData(createResult).path("postId").asLong();

        mockMvc.perform(patch("/api/projects/{postId}/edit", postId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.ofEntries(
                                entry("title", "Updated project"),
                                entry("category", "ADVERTISEMENT"),
                                entry("categories", List.of("ADVERTISEMENT", "UI_UX")),
                                entry("jobState", "MID"),
                                entry("experienceLevel", "JUNIOR"),
                                entry("budget", 700),
                                entry("overview", "Updated overview"),
                                entry("fullDescription", "Updated full description"),
                                entry("skills", List.of("Photoshop", "Illustrator")),
                                entry("responsibilities", List.of("Updated task")),
                                entry("qualifications", List.of("Updated qualification")),
                                entry("state", "OPEN"),
                                entry("deadline", "2034-07-15")
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Updated project"))
                .andExpect(jsonPath("$.data.budget").value(700))
                .andExpect(jsonPath("$.data.categories.length()").value(1));

        mockMvc.perform(get("/api/projects/{postId}", postId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Updated project"))
                .andExpect(jsonPath("$.data.overview").value("Updated overview"))
                .andExpect(jsonPath("$.data.skills.length()").value(2))
                .andExpect(jsonPath("$.data.deadline").value("2034-07-15"));

        mockMvc.perform(delete("/api/projects/{postId}/delete", postId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        MvcResult myPostsResult = mockMvc.perform(get("/api/projects/my-posts")
                        .header(HttpHeaders.AUTHORIZATION, BEARER + clientToken))
                .andExpect(status().isOk())
                .andReturn();

        assertThat(findProjectByPostId(readData(myPostsResult), postId)).isNull();
    }

    @Test
    void clientCanDeleteOwnProjectWithImageAndApplications() throws Exception {
        signUp("delete-client@test.io", "Delete Client", "deleteCli", "CLIENT");
        String clientToken = login("delete-client@test.io", "testPass1!");

        MvcResult createResult = mockMvc.perform(post("/api/projects/create")
                        .header(HttpHeaders.AUTHORIZATION, BEARER + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.ofEntries(
                                entry("postType", "JOB_POST"),
                                entry("title", "Delete project with image"),
                                entry("category", "CRAFT"),
                                entry("categories", List.of("CRAFT")),
                                entry("jobState", "LONG"),
                                entry("experienceLevel", "SENIOR"),
                                entry("budget", 500),
                                entry("overview", "Delete overview"),
                                entry("fullDescription", "Delete full description"),
                                entry("skills", List.of("Figma")),
                                entry("responsibilities", List.of("Delete task")),
                                entry("qualifications", List.of("Delete qualification")),
                                entry("state", "OPEN"),
                                entry("deadline", "2034-06-26")
                        ))))
                .andExpect(status().isOk())
                .andReturn();

        long postId = readData(createResult).path("postId").asLong();
        Post post = postRepository.findById(postId).orElseThrow();
        postImageRepository.save(PostImage.builder()
                .post(post)
                .imageUrl("https://example.com/delete-project-image.png")
                .sortOrder(0)
                .build());

        signUp("delete-designer@test.io", "Delete Designer", "deleteDes", "DESIGNER");
        String designerToken = login("delete-designer@test.io", "testPass1!");

        mockMvc.perform(post("/api/projects/{postId}/apply", postId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + designerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "coverLetter", "Please review my application.",
                                "summary", "Ready to start right away.",
                                "expectedBudget", 450,
                                "portfolioUrl", "https://portfolio.example.com/delete-test",
                                "startDate", "2034-06-10"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(delete("/api/projects/{postId}/delete", postId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        MvcResult myPostsResult = mockMvc.perform(get("/api/projects/my-posts")
                        .header(HttpHeaders.AUTHORIZATION, BEARER + clientToken))
                .andExpect(status().isOk())
                .andReturn();

        assertThat(findProjectByPostId(readData(myPostsResult), postId)).isNull();

        assertThat(postRepository.findById(postId)).isEmpty();
        assertThat(postImageRepository.findByPost_IdOrderBySortOrderAsc(postId)).isEmpty();

        MvcResult unreadNotificationsResult = mockMvc.perform(get("/api/notifications/unread-count")
                        .header(HttpHeaders.AUTHORIZATION, BEARER + clientToken))
                .andExpect(status().isOk())
                .andReturn();

        assertThat(readData(unreadNotificationsResult).asLong()).isZero();
    }

    @Test
    void designerCanUpdateAndDeleteOwnApplication() throws Exception {
        String suffix = Long.toString(System.nanoTime());
        String suffixTail = suffix.substring(Math.max(0, suffix.length() - 4));
        String clientLoginId = "eac" + suffixTail + "@t.io";
        String designerLoginId = "ead" + suffixTail + "@t.io";
        String clientNickname = "eaC" + suffixTail;
        String designerNickname = "eaD" + suffixTail;

        signUp(clientLoginId, "Edit Apply Client", clientNickname, "CLIENT");
        String clientToken = login(clientLoginId, "testPass1!");

        MvcResult createResult = mockMvc.perform(post("/api/projects/create")
                        .header(HttpHeaders.AUTHORIZATION, BEARER + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.ofEntries(
                                entry("postType", "JOB_POST"),
                                entry("title", "Editable application project"),
                                entry("category", "CRAFT"),
                                entry("categories", List.of("CRAFT")),
                                entry("jobState", "LONG"),
                                entry("experienceLevel", "SENIOR"),
                                entry("budget", 500),
                                entry("overview", "Application edit test"),
                                entry("fullDescription", "Application edit test description"),
                                entry("skills", List.of("Figma")),
                                entry("responsibilities", List.of("Task one")),
                                entry("qualifications", List.of("Qualification one")),
                                entry("state", "OPEN"),
                                entry("deadline", "2034-06-26")
                        ))))
                .andExpect(status().isOk())
                .andReturn();

        long postId = readData(createResult).path("postId").asLong();

        signUp(designerLoginId, "Edit Apply Designer", designerNickname, "DESIGNER");
        String designerToken = login(designerLoginId, "testPass1!");

        mockMvc.perform(post("/api/projects/{postId}/apply", postId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + designerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "coverLetter", "Original cover letter",
                                "summary", "Original summary",
                                "expectedBudget", 300,
                                "portfolioUrl", "https://portfolio.example.com/original",
                                "startDate", "2034-06-01"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(patch("/api/projects/{postId}/apply", postId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + designerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "coverLetter", "Updated cover letter",
                                "summary", "Updated summary",
                                "expectedBudget", 450,
                                "portfolioUrl", "https://portfolio.example.com/updated",
                                "startDate", "2034-06-15"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        MvcResult myApplicationsResult = mockMvc.perform(get("/api/projects/my-applications")
                        .header(HttpHeaders.AUTHORIZATION, BEARER + designerToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode updatedApplication = findApplicationByPostId(readData(myApplicationsResult), postId);
        assertThat(updatedApplication).isNotNull();
        assertThat(updatedApplication.path("summary").asText()).isEqualTo("Updated summary");
        assertThat(updatedApplication.path("coverLetter").asText()).isEqualTo("Updated cover letter");
        assertThat(updatedApplication.path("expectedBudget").asInt()).isEqualTo(450);
        assertThat(updatedApplication.path("portfolioUrl").asText()).isEqualTo("https://portfolio.example.com/updated");
        assertThat(updatedApplication.path("startDate").asText()).isEqualTo("2034-06-15");

        MvcResult projectApplicationsResult = mockMvc.perform(get("/api/projects/{postId}/applications", postId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + clientToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode applicationList = readData(projectApplicationsResult);
        assertThat(applicationList).hasSize(1);
        assertThat(applicationList.get(0).path("designerNickname").asText()).isEqualTo(designerNickname);
        assertThat(applicationList.get(0).path("summary").asText()).isEqualTo("Updated summary");

        mockMvc.perform(delete("/api/projects/{postId}/apply", postId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + designerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        MvcResult deletedApplicationsResult = mockMvc.perform(get("/api/projects/my-applications")
                        .header(HttpHeaders.AUTHORIZATION, BEARER + designerToken))
                .andExpect(status().isOk())
                .andReturn();

        assertThat(findApplicationByPostId(readData(deletedApplicationsResult), postId)).isNull();

        MvcResult emptyProjectApplicationsResult = mockMvc.perform(get("/api/projects/{postId}/applications", postId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + clientToken))
                .andExpect(status().isOk())
                .andReturn();

        assertThat(readData(emptyProjectApplicationsResult)).isEmpty();
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
                .andReturn();

        JsonNode response = objectMapper.readTree(result.getResponse().getContentAsString());
        if (result.getResponse().getStatus() == 200 && response.path("success").asBoolean()) {
            return response.path("data");
        }

        if ((result.getResponse().getStatus() == 400 || result.getResponse().getStatus() == 409)
                && !response.path("success").asBoolean()) {
            return null;
        }

        throw new AssertionError("Unexpected signup response: " + result.getResponse().getContentAsString());
    }

    private String login(String loginId, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "loginId", loginId,
                                "password", password
                        ))))
                .andReturn();

        JsonNode response = objectMapper.readTree(result.getResponse().getContentAsString());
        if (result.getResponse().getStatus() == 200
                && response.path("success").asBoolean()
                && response.path("data").path("accessToken").isTextual()) {
            return response.path("data").path("accessToken").asText();
        }

        throw new AssertionError("Unexpected login response for " + loginId + ": " + result.getResponse().getContentAsString());
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
