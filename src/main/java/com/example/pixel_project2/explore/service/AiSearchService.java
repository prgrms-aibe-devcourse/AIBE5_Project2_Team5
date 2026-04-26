package com.example.pixel_project2.explore.service;

import com.example.pixel_project2.common.entity.enums.Category;
import com.example.pixel_project2.explore.dto.AiSearchRequestDto;
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

    @Value("${app.gemini.model:gemini-2.0-flash}") // 최신 모델 권장
    private String geminiModel;

    private final ObjectMapper objectMapper;

    public AiSearchService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public AiSearchResponseDto search(AiSearchRequestDto request) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return AiSearchResponseDto.builder()
                    .category(null)
                    .keywords(List.of())
                    .message("API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.")
                    .build();
        }

        try {
            String categoryLabels = Arrays.stream(Category.values())
                    .map(Category::getLabel)
                    .collect(Collectors.joining(", "));

            // 1. 시스템 프롬프트 구성 (메시지 페이지 스타일의 고도화된 페르소나 부여)
            StringBuilder promptBuilder = new StringBuilder();
            promptBuilder.append("당신은 디자인 프로젝트 탐색 플랫폼 '피켈(Pickxel)'의 전문 큐레이터입니다.\n");
            promptBuilder.append("사용자의 질문과 이전 대화 내역을 분석하여 최적의 디자인 작업물과 디자이너를 추천하세요.\n\n");
            
            promptBuilder.append("사용 가능한 카테고리: [").append(categoryLabels).append("]\n\n");
            
            promptBuilder.append("응답 규칙:\n");
            promptBuilder.append("1. 반드시 JSON 형식으로만 답변하세요.\n");
            promptBuilder.append("2. 'category'는 위 목록 중 가장 적합한 하나를 선택하거나, 모호하면 null로 하세요.\n");
            promptBuilder.append("3. 'keywords'는 검색에 사용할 핵심 단어들을 리스트로 만드세요.\n");
            promptBuilder.append("4. 'message'는 사용자에게 친절하고 전문적인 톤으로 답변을 작성하세요.\n\n");

            // 2. 대화 내역(History) 추가
            promptBuilder.append("### 대화 내역 ###\n");
            for (AiSearchRequestDto.ChatMessageDto msg : request.getHistory()) {
                String role = "user".equals(msg.getRole()) ? "사용자" : "AI";
                promptBuilder.append(role).append(": ").append(msg.getContent()).append("\n");
            }
            
            promptBuilder.append("\n최종 응답은 다음 JSON 스키마를 따르세요:\n");
            promptBuilder.append("{\"category\": \"카테고리명\", \"keywords\": [\"단어1\", \"단어2\"], \"message\": \"답변 내용\"}");

            // 3. Gemini API 요청 구성
            ObjectNode requestBody = objectMapper.createObjectNode();
            ArrayNode contents = requestBody.putArray("contents");
            ObjectNode content = contents.addObject();
            ArrayNode parts = content.putArray("parts");
            parts.addObject().put("text", promptBuilder.toString());

            ObjectNode generationConfig = requestBody.putObject("generationConfig");
            generationConfig.put("responseMimeType", "application/json");
            generationConfig.put("temperature", 0.7);

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(
                            "https://generativelanguage.googleapis.com/v1beta/models/"
                                    + geminiModel.trim()
                                    + ":generateContent?key="
                                    + URLEncoder.encode(geminiApiKey.trim(), StandardCharsets.UTF_8)
                    ))
                    .timeout(Duration.ofSeconds(20))
                    .header("Content-Type", "application/json")
                    .header("x-goog-api-key", geminiApiKey.trim())
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody)))
                    .build();

            HttpResponse<String> response = GEMINI_HTTP_CLIENT.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.error("Gemini API 호출 실패: {}", response.body());
                return AiSearchResponseDto.builder()
                        .message("AI 서비스 통신 중 오류가 발생했습니다.")
                        .build();
            }

            JsonNode responseJson = objectMapper.readTree(response.body());
            String candidateText = responseJson.at("/candidates/0/content/parts/0/text").asText("");
            
            return objectMapper.readValue(candidateText.trim(), AiSearchResponseDto.class);

        } catch (Exception e) {
            log.error("AI 검색 처리 예외: ", e);
            return AiSearchResponseDto.builder()
                    .message("AI 처리 중 예외가 발생했습니다.")
                    .build();
        }
    }
}
