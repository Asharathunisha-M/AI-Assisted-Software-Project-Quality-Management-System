package com.asharathunisha.projectmanagement.controller;

import com.asharathunisha.projectmanagement.service.AIService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/ai")
public class AIController {

    private final AIService aiService;

    public AIController(AIService aiService) {
        this.aiService = aiService;
    }

    // =========================================================
    // REAL AI CHAT
    // =========================================================

    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chat(
            @RequestBody Map<String, String> request) {

        String message = request.get("message");

        if (message == null || message.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(
                    Map.of("result", "Please enter a message.")
            );
        }

        try {
            String result = aiService.chat(message);

            return ResponseEntity.ok(
                    Map.of("result", result)
            );

        } catch (IllegalStateException e) {

            Map<String, String> response = new HashMap<>();
            response.put("result", e.getMessage());

            return ResponseEntity.internalServerError().body(response);
        }
    }

    // =========================================================
    // LEGACY TEXT PROCESSOR
    // =========================================================

    @PostMapping("/process")
    public Map<String, String> processText(
            @RequestBody Map<String, String> request) {

        String text = request.get("text");

        Map<String, String> response = new HashMap<>();

        if (text == null || text.trim().isEmpty()) {
            response.put("result", "Please provide some text.");
            return response;
        }

        response.put(
                "result",
                "AI Assistant received the following text: " + text
        );

        return response;
    }

    // =========================================================
    // REQUIREMENT SUMMARIZER
    // =========================================================

    @PostMapping("/summarize-requirement")
    public Map<String, String> summarizeRequirement(
            @RequestBody Map<String, String> request) {

        String requirement = request.get("requirement");

        Map<String, String> response = new HashMap<>();

        String summary = aiService.summarizeRequirement(requirement);

        response.put(
                "result",
                "Requirement Summary: " + summary
        );

        return response;
    }

    // =========================================================
    // AI BUG CLASSIFIER
    // =========================================================

    @PostMapping("/classify-bug")
    public Map<String, String> classifyBug(
            @RequestBody Map<String, String> request) {

        String bugDescription = request.get("bugDescription");

        Map<String, String> response = new HashMap<>();

        if (bugDescription == null || bugDescription.trim().isEmpty()) {
            response.put("result", "Please provide a bug description.");
            return response;
        }
        String prompt =
                "You are ProjectHub AI, a software quality management assistant.\n\n"
                        + "Analyze the following software bug carefully.\n"
                        + "Identify the PRIMARY problem described by the bug, "
                        + "not just individual keywords.\n"
                        + "Do not invent information.\n\n"

                        + "Return exactly these sections:\n"
                        + "Category:\n"
                        + "Severity:\n"
                        + "Priority:\n"
                        + "Suggested Area:\n"
                        + "Analysis:\n\n"

                        + "Category should normally be one of:\n"
                        + "Functional, UI/UX, Performance, Security, Database, Backend, General.\n\n"

                        + "Severity should normally be one of:\n"
                        + "Critical, High, Medium, Low.\n\n"

                        + "Priority should normally be one of:\n"
                        + "Critical, High, Medium, Low.\n\n"

                        + "Important classification guidance:\n"
                        + "- Login, authentication, password validation or access failures "
                        + "are normally Functional or Security issues unless the description "
                        + "clearly identifies another primary cause.\n"
                        + "- A slow response is Performance only when slowness itself is "
                        + "the primary problem.\n"
                        + "- A loading indicator alone does not automatically make a bug "
                        + "a Performance issue.\n"
                        + "- Data corruption or data loss may indicate Critical severity.\n"
                        + "- A complete inability to use an important feature may indicate "
                        + "High severity.\n"
                        + "- Minor visual or non-blocking issues may indicate Low or Medium severity.\n\n"

                        + "Bug Description:\n"
                        + bugDescription.trim();

        try {

            String result = aiService.chat(prompt);

            response.put(
                    "result",
                    "Bug Classification:\n\n" + result
            );

            return response;

        } catch (IllegalStateException e) {

            response.put(
                    "result",
                    e.getMessage()
            );

            return response;
        }
    }

    // =========================================================
    // AI TEST CASE GENERATOR
    // =========================================================

    @PostMapping("/generate-test-cases")
    public Map<String, String> generateTestCases(
            @RequestBody Map<String, String> request) {

        String requirement = request.get("requirement");

        Map<String, String> response = new HashMap<>();

        if (requirement == null || requirement.trim().isEmpty()) {
            response.put("result", "Please provide a software requirement.");
            return response;
        }
        String prompt =
                "You are a software QA test case generator.\n\n"
                        + "Read the requirement carefully and create test cases ONLY for behavior "
                        + "explicitly stated in the requirement.\n\n"

                        + "RULES:\n"
                        + "- Do not invent any feature or behavior.\n"
                        + "- Do not invent registration steps.\n"
                        + "- Do not invent invalid-input behavior.\n"
                        + "- Do not invent error messages.\n"
                        + "- Do not invent URLs or credentials.\n"
                        + "- Do not create duplicate or variation test cases.\n"
                        + "- Use [test data] when the requirement does not provide test data.\n"
                        + "- If the requirement describes only a successful flow, generate ONLY "
                        + "the successful-flow test case.\n"
                        + "- Do not generate negative test cases unless the requirement explicitly "
                        + "describes what should happen for invalid input.\n"
                        + "- For a simple requirement, one or two test cases are enough.\n"
                        + "- Every expected result must be directly supported by the requirement.\n\n"

                        + "FORMAT:\n"
                        + "Test Case ID: TC01\n"
                        + "Scenario: <scenario>\n"
                        + "Steps:\n"
                        + "1. <step>\n"
                        + "2. <step>\n"
                        + "Expected Result: <expected result>\n"
                        + "Priority: <High/Medium/Low>\n\n"

                        + "REQUIREMENT:\n"
                        + requirement.trim();
        try {

            String result = aiService.chat(prompt);

            response.put(
                    "result",
                    "Generated Test Cases:\n\n" + result
            );

            return response;

        } catch (IllegalStateException e) {

            response.put(
                    "result",
                    e.getMessage()
            );

            return response;
        }
    }
}
