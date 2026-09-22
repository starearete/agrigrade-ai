package com.agrigrade.auth.controller;

import com.agrigrade.auth.dto.UserProfileResponse;
import com.agrigrade.auth.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MeController {

    private final AuthService authService;

    public MeController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping({"/me", "/api/v1/me"})
    public ResponseEntity<UserProfileResponse> getCurrentUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String publicId = authentication.getName();
        UserProfileResponse response = authService.getCurrentUserProfile(publicId);
        return ResponseEntity.ok(response);
    }
}
