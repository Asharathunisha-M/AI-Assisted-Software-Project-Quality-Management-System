package com.asharathunisha.projectmanagement.service;

import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Service
public class AIService {

    private static final String OLLAMA_URL =
            "http://localhost:11434/api/generate";

    private static final String MODEL =
            "qwen2.5:3b";

    private final HttpClient httpClient;

    public AIService() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public String chat(String message) {

        if (message == null || message.trim().isEmpty()) {
            return "Please enter a message.";
        }

        try {

            String prompt =
                    "You are ProjectHub AI, an assistant inside a software "
                            + "project and quality management system.\n\n"
                            + "Be helpful, professional, concise and practical.\n"
                            + "You can help with software development, project management, "
                            + "requirements, QA/testing, bugs, Agile, databases and APIs.\n\n"
                            + "User question:\n"
                            + message.trim();

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", MODEL);
            requestBody.put("prompt", prompt);
            requestBody.put("stream", false);

            String jsonBody =
                    "{\"model\":\"qwen2.5:3b\","
                            + "\"prompt\":" + quoteJson(prompt) + ","
                            + "\"stream\":false,"
                            + "\"options\":{\"num_ctx\":4096,\"num_predict\":800}}";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(OLLAMA_URL))
                    .timeout(Duration.ofSeconds(300))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response =
                    httpClient.send(
                            request,
                            HttpResponse.BodyHandlers.ofString()
                    );

            if (response.statusCode() < 200 ||
                    response.statusCode() >= 300) {

                throw new IllegalStateException(
                        "Ollama request failed with status "
                                + response.statusCode()
                                + ": "
                                + response.body()
                );
            }

            return extractResponse(response.body());

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new IllegalStateException(
                    "The AI request was interrupted."
            );

        } catch (Exception e) {

            if (e instanceof IllegalStateException) {
                throw (IllegalStateException) e;
            }

            throw new IllegalStateException(
                    "Unable to connect to the local AI model. "
                            + "Make sure Ollama is running."
            );
        }
    }

    public String summarizeRequirement(String requirement) {

        if (requirement == null ||
                requirement.trim().isEmpty()) {

            return "Please provide a requirement.";
        }

        String prompt =
                "You are ProjectHub AI, a software project management assistant.\n\n"
                        + "Summarize the following software requirement clearly and concisely.\n"
                        + "Keep the original meaning and important functional details.\n"
                        + "Do not invent information.\n"
                        + "Return only the requirement summary.\n\n"
                        + "Software Requirement:\n"
                        + requirement.trim();

        return generateWithOllama(prompt);
    }
    private String generateWithOllama(String prompt) {

        try {

            String jsonBody =
                    "{\"model\":\"qwen2.5:3b\","
                            + "\"prompt\":" + quoteJson(prompt) + ","
                            + "\"stream\":false,"
                            + "\"options\":{\"num_ctx\":4096,\"num_predict\":800}}";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(OLLAMA_URL))
                    .timeout(Duration.ofSeconds(300))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response =
                    httpClient.send(
                            request,
                            HttpResponse.BodyHandlers.ofString()
                    );

            if (response.statusCode() < 200 ||
                    response.statusCode() >= 300) {

                throw new IllegalStateException(
                        "Ollama request failed with status "
                                + response.statusCode()
                                + ": "
                                + response.body()
                );
            }

            return extractResponse(response.body());

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new IllegalStateException(
                    "The AI request was interrupted."
            );

        } catch (Exception e) {

            if (e instanceof IllegalStateException) {
                throw (IllegalStateException) e;
            }

            throw new IllegalStateException(
                    "Unable to connect to the local AI model. "
                            + "Make sure Ollama is running."
            );
        }
    }

    private String extractResponse(String json) {

        String key = "\"response\":\"";

        int start = json.indexOf(key);

        if (start == -1) {
            throw new IllegalStateException(
                    "The AI response did not contain readable text."
            );
        }

        start += key.length();

        StringBuilder result =
                new StringBuilder();

        boolean escaped = false;

        for (int i = start; i < json.length(); i++) {

            char c = json.charAt(i);

            if (escaped) {

                if (c == 'n') {
                    result.append('\n');
                } else if (c == 't') {
                    result.append('\t');
                } else if (c == '"') {
                    result.append('"');
                } else if (c == '\\') {
                    result.append('\\');
                } else {
                    result.append(c);
                }

                escaped = false;

            } else if (c == '\\') {

                escaped = true;

            } else if (c == '"') {

                break;

            } else {

                result.append(c);
            }
        }

        return result.toString().trim();
    }

    private String quoteJson(String text) {

        return "\""
                + text
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t")
                + "\"";
    }
}
