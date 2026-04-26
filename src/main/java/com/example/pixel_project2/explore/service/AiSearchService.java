package com.example.pixel_project2.explore.service;

import com.example.pixel_project2.common.entity.enums.Category;
import com.example.pixel_project2.explore.dto.AiSearchResponseDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class AiSearchService {

    private static final HttpClient GEMINI_HTTP_CLIENT = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Value("${app.gemini.api-key:}")
    private String geminiApiKey;

    @Value("${app.gemini.model:gemini-1.5-flash}")
    private String geminiModel;

    private final ObjectMapper objectMapper;

    public AiSearchService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public AiSearchResponseDto search(String query) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return AiSearchResponseDto.builder()
                    .category(null)
                    .keywords(List.of())
                    .message("API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.")
                    .build();
        }

        try {
            String categories = Arrays.stream(Category.values())
                    .map(Category::getLabel)
                    .collect(Collectors.joining(", "));

            String systemPrompt = "당신은 디자인 탐색 어시스턴트입니다. 사용자의 질문을 분석하여 카테고리와 검색 키워드를 추출하세요.\n" +
                    "사용 가능한 카테고리 목록: [" + categories + "]\n" +
                    "JSON 응답 스키마:\n" +
                    "{\n" +
                    "  \"category\": \"카테고리명 (또는 null)\",\n" +
                    "  \"keywords\": [\"키워드\"],\n" +
                    "  \"message\": \"답변 메시지\"\n" +
                    "}";

            ObjectNode requestBody = objectMapper.createObjectNode();
            ArrayNode contents = requestBody.putArray("contents");
            ObjectNode content = contents.addObject();
            ArrayNode parts = content.putArray("parts");
            parts.addObject().put("text", systemPrompt + "\n\n사용자 질문: " + query);

            ObjectNode generationConfig = requestBody.putObject("generationConfig");
            generationConfig.put("responseMimeType", "application/json");

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(
                            "https://generativelanguage.googleapis.com/v1beta/models/"
                                    + geminiModel.trim()
                                    + ":generateContent?key="
                                    + URLEncoder.encode(geminiApiKey.trim(), StandardCharsets.UTF_8)
                    ))
                    .timeout(Duration.ofSeconds(15))
                    .header("Content-Type", "application/json")
                    .header("x-goog-api-key", geminiApiKey.trim())
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody)))
                    .build();

            HttpResponse<String> response = GEMINI_HTTP_CLIENT.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.error("Gemini API 호출 실패 (상태 코드: {}): {}", response.statusCode(), response.body());
                return AiSearchResponseDto.builder()
                        .category(null)
                        .keywords(List.of())
                        .message("AI 서비스 호출에 실패했습니다. (상태 코드: " + response.statusCode() + ")")
                        .build();
            }

            JsonNode responseJson = objectMapper.readTree(response.body());
            String candidateText = responseJson.at("/candidates/0/content/parts/0/text").asText("");
            
            if (candidateText.isBlank()) {
                return AiSearchResponseDto.builder()
                        .category(null)
                        .keywords(List.of())
                        .message("AI가 답변을 생성하지 못했습니다.")
                        .build();
            }

            // responseMimeType: application/json 덕분에 텍스트 정규화가 훨씬 간단해짐
            String normalizedJson = candidateText.trim();
            if (normalizedJson.startsWith("```json")) {
                normalizedJson = normalizedJson.substring(7, normalizedJson.length() - 3).trim();
            } else if (normalizedJson.startsWith("```")) {
                normalizedJson = normalizedJson.substring(3, normalizedJson.length() - 3).trim();
            }

            return objectMapper.readValue(normalizedJson, AiSearchResponseDto.class);

        } catch (Exception e) {
            log.error("AI 검색 처리 중 예외 발생: ", e);
            return AiSearchResponseDto.builder()
                    .category(null)
                    .keywords(List.of())
                    .message("AI 처리 중 오류가 발생했습니다: " + e.getMessage())
                    .build();
        }
    }
}
