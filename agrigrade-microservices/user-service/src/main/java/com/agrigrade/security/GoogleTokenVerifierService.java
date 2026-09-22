package com.agrigrade.security;

import com.agrigrade.common.exception.ApiException;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Arrays;
import java.util.Collections;

@Service
public class GoogleTokenVerifierService {

    private static final Logger log = LoggerFactory.getLogger(GoogleTokenVerifierService.class);

    private final String configuredClientId;
    private final GoogleIdTokenVerifier verifier;

    public record GoogleUserInfo(
        String subject,
        String email,
        boolean emailVerified,
        String name,
        String pictureUrl
    ) {}

    public GoogleTokenVerifierService(
        @Value("${app.google.client-id:}") String configuredClientId
    ) {
        this.configuredClientId = configuredClientId;
        NetHttpTransport transport = new NetHttpTransport();
        GsonFactory jsonFactory = new GsonFactory();

        GoogleIdTokenVerifier.Builder builder = new GoogleIdTokenVerifier.Builder(transport, jsonFactory)
            .setIssuers(Arrays.asList("accounts.google.com", "https://accounts.google.com"));

        if (StringUtils.hasText(configuredClientId)) {
            builder.setAudience(Collections.singletonList(configuredClientId));
        }

        this.verifier = builder.build();
    }

    public GoogleUserInfo verify(String idTokenString) {
        if (!StringUtils.hasText(idTokenString)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "MISSING_CREDENTIAL", "Google credential token is missing.");
        }

        try {
            GoogleIdToken idToken = verifier.verify(idTokenString.trim());
            if (idToken == null) {
                log.warn("Google ID token verification failed (null token returned by verifier).");
                throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_GOOGLE_TOKEN", "Google ID token signature or expiration is invalid.");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();

            String subject = payload.getSubject();
            String email = payload.getEmail();
            Boolean emailVerified = payload.getEmailVerified();
            String name = (String) payload.get("name");
            String pictureUrl = (String) payload.get("picture");

            if (!StringUtils.hasText(subject) || !StringUtils.hasText(email)) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_GOOGLE_PAYLOAD", "Google token missing subject or email.");
            }

            if (!Boolean.TRUE.equals(emailVerified)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "UNVERIFIED_GOOGLE_EMAIL", "Google account email is not verified.");
            }

            if (!StringUtils.hasText(name)) {
                name = email.split("@")[0];
            }

            return new GoogleUserInfo(
                subject,
                email.toLowerCase().trim(),
                true,
                name,
                pictureUrl
            );

        } catch (ApiException e) {
            throw e;
        } catch (IllegalArgumentException e) {
            log.warn("Malformed Google ID token format: {}", e.getMessage());
            throw new ApiException(HttpStatus.BAD_REQUEST, "MALFORMED_GOOGLE_TOKEN", "Malformed Google ID token credential.");
        } catch (GeneralSecurityException | IOException e) {
            log.error("Exception during Google ID token verification: {}", e.getMessage());
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_GOOGLE_TOKEN", "Failed to verify Google ID token.");
        } catch (Exception e) {
            log.warn("Unexpected error during Google ID token verification: {}", e.getMessage());
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_GOOGLE_TOKEN", "Invalid Google ID token credential.");
        }
    }
}
