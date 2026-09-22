package com.agrigrade.ai.controller;

import com.agrigrade.ai.dto.AiAnalysisResponse;
import com.agrigrade.ai.dto.RunAiAnalysisRequest;
import com.agrigrade.ai.service.AiAnalysisService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/batches")
public class AiAnalysisController {

    private final AiAnalysisService aiAnalysisService;

    public AiAnalysisController(AiAnalysisService aiAnalysisService) {
        this.aiAnalysisService = aiAnalysisService;
    }

    @PostMapping("/{id}/ai-analysis")
    public ResponseEntity<AiAnalysisResponse> runAiAnalysis(
        @PathVariable("id") Long id,
        @RequestBody(required = false) RunAiAnalysisRequest request,
        Authentication authentication
    ) {
        String userPublicId = authentication != null ? authentication.getName() : "usr-farmer-001";
        AiAnalysisResponse response = aiAnalysisService.runAiAnalysis(userPublicId, id, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/ai-analysis")
    public ResponseEntity<AiAnalysisResponse> getBatchAiAnalysis(
        @PathVariable("id") Long id
    ) {
        AiAnalysisResponse response = aiAnalysisService.getBatchAiAnalysis(id);
        return ResponseEntity.ok(response);
    }
}
