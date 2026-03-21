package com.buildme.service;

import com.buildme.dto.request.GenerateCaptionRequest;
import com.buildme.dto.response.AICaptionResponse;
import com.buildme.exception.CustomExceptions;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.apache.hc.core5.http.io.entity.StringEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIService {

    private final ObjectMapper objectMapper;

    @Value("${app.openai.api-key:}")
    private String openAiApiKey;

    private static final String OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

    public AICaptionResponse generateCaption(GenerateCaptionRequest request) {
        if (openAiApiKey == null || openAiApiKey.isBlank()) {
            log.warn("OpenAI API key not configured, returning stub captions");
            return stubCaptions(request.topic());
        }

        String platform = request.platform() != null ? request.platform().name() : "general";
        boolean emoji = request.includeEmojis() != null && request.includeEmojis();
        boolean hashtags = request.includeHashtags() != null && request.includeHashtags();
        String tone = request.tone() != null ? request.tone() : "engaging";

        String prompt = String.format(
            "Generate 3 social media captions for %s platform about: %s. " +
            "Tone: %s. %s %s " +
            "Return JSON: {\"captions\": [...], \"hashtags\": [...]}",
            platform, request.topic(), tone,
            emoji ? "Include relevant emojis." : "No emojis.",
            hashtags ? "Include relevant hashtags." : "No hashtags."
        );

        try (CloseableHttpClient client = HttpClients.createDefault()) {
            String requestBody = objectMapper.writeValueAsString(Map.of(
                "model", "gpt-4o",
                "messages", List.of(Map.of("role", "user", "content", prompt)),
                "temperature", 0.8,
                "response_format", Map.of("type", "json_object")
            ));

            HttpPost post = new HttpPost(OPENAI_API_URL);
            post.setHeader("Authorization", "Bearer " + openAiApiKey);
            post.setHeader("Content-Type", "application/json");
            post.setEntity(new StringEntity(requestBody));

            String responseBody = client.execute(post, response ->
                EntityUtils.toString(response.getEntity()));

            JsonNode root = objectMapper.readTree(responseBody);
            String content = root.path("choices").get(0).path("message").path("content").asText();
            JsonNode contentJson = objectMapper.readTree(content);

            List<String> captions = new ArrayList<>();
            contentJson.path("captions").forEach(n -> captions.add(n.asText()));

            List<String> hashtagList = new ArrayList<>();
            contentJson.path("hashtags").forEach(n -> hashtagList.add(n.asText()));

            return new AICaptionResponse(captions, hashtagList, null);

        } catch (Exception e) {
            log.error("OpenAI API error", e);
            throw new CustomExceptions.ExternalApiException("AI caption generation failed", e);
        }
    }

    public List<String> suggestHashtags(String topic, String platform) {
        if (openAiApiKey == null || openAiApiKey.isBlank()) {
            return List.of("#" + topic.replace(" ", ""), "#trending", "#viral", "#content");
        }
        // Similar OpenAI call for hashtag-only response
        return List.of("#" + topic.replace(" ", ""), "#socialmedia", "#content");
    }

    public String getBestTimeToPost(Long workspaceId, String platform) {
        // In production: analyze workspace analytics to determine best times
        Map<String, String> defaults = Map.of(
            "INSTAGRAM", "Tuesday-Friday, 9am-11am or 7pm-9pm",
            "TIKTOK", "Tuesday/Thursday/Friday, 6pm-10pm",
            "FACEBOOK", "Wednesday, 11am-1pm",
            "TWITTER", "Monday-Friday, 8am-10am",
            "LINKEDIN", "Tuesday-Thursday, 9am-12pm"
        );
        return defaults.getOrDefault(platform.toUpperCase(), "Weekdays, 9am-11am");
    }

    private AICaptionResponse stubCaptions(String topic) {
        return new AICaptionResponse(
            List.of(
                "Check out our latest on " + topic + "! ✨",
                "Excited to share this " + topic + " update with you all!",
                "Transform your approach to " + topic + " today. Drop a comment below!"
            ),
            List.of("#" + topic.replace(" ", ""), "#trending", "#socialmedia"),
            "Weekdays 9-11am"
        );
    }
}
