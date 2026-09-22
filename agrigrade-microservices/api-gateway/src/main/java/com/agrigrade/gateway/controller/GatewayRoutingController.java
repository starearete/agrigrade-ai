package com.agrigrade.gateway.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.util.Collections;
import java.util.Enumeration;

@RestController
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class GatewayRoutingController {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${services.auth-service:http://localhost:8081}")
    private String authServiceUrl;

    @Value("${services.user-service:http://localhost:8082}")
    private String userServiceUrl;

    @Value("${services.ai-service:http://localhost:8083}")
    private String aiServiceUrl;

    @Value("${services.batch-service:http://localhost:8084}")
    private String batchServiceUrl;

    @Value("${services.listing-service:http://localhost:8085}")
    private String listingServiceUrl;

    @Value("${services.market-service:http://localhost:8086}")
    private String marketServiceUrl;

    @Value("${services.chat-service:http://localhost:8087}")
    private String chatServiceUrl;

    @Value("${services.notification-service:http://localhost:8088}")
    private String notificationServiceUrl;

    @Value("${services.admin-service:http://localhost:8089}")
    private String adminServiceUrl;

    @RequestMapping(value = {"/api/v1/**", "/me", "/farmer/**", "/buyer/**", "/conversations/**", "/notifications/**", "/rates/**", "/batches/**", "/listings/**"}, method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.PATCH})
    public ResponseEntity<byte[]> proxyApiV1(HttpServletRequest request, @RequestBody(required = false) byte[] body) {
        String path = request.getRequestURI();
        String queryString = request.getQueryString();
        String targetBaseUrl = resolveTargetService(path);
        
        String targetUrl = targetBaseUrl + path + (queryString != null ? "?" + queryString : "");

        HttpHeaders headers = new HttpHeaders();
        Enumeration<String> headerNames = request.getHeaderNames();
        while (headerNames.hasMoreElements()) {
            String name = headerNames.nextElement();
            if (!name.equalsIgnoreCase("host")) {
                headers.put(name, Collections.list(request.getHeaders(name)));
            }
        }

        HttpEntity<byte[]> httpEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<byte[]> response = restTemplate.exchange(URI.create(targetUrl), HttpMethod.valueOf(request.getMethod()), httpEntity, byte[].class);
            HttpHeaders respHeaders = new HttpHeaders();
            if (response.getHeaders() != null) {
                response.getHeaders().forEach((k, v) -> {
                    if (!k.equalsIgnoreCase("Transfer-Encoding") && !k.equalsIgnoreCase("Content-Length")) {
                        respHeaders.put(k, v);
                    }
                });
            }
            return new ResponseEntity<>(response.getBody(), respHeaders, response.getStatusCode());
        } catch (HttpStatusCodeException ex) {
            HttpHeaders respHeaders = new HttpHeaders();
            if (ex.getResponseHeaders() != null) {
                ex.getResponseHeaders().forEach((k, v) -> {
                    if (!k.equalsIgnoreCase("Transfer-Encoding") && !k.equalsIgnoreCase("Content-Length")) {
                        respHeaders.put(k, v);
                    }
                });
            }
            return new ResponseEntity<>(ex.getResponseBodyAsByteArray(), respHeaders, ex.getStatusCode());
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(("{\"status\":502,\"error\":\"BAD_GATEWAY\",\"message\":\"Service unavailable: " + ex.getMessage() + "\"}").getBytes());
        }
    }

    private String resolveTargetService(String path) {
        if (path.startsWith("/api/v1/auth") || path.startsWith("/api/v1/me") || path.equalsIgnoreCase("/me")) {
            return authServiceUrl;
        } else if (path.startsWith("/api/v1/farmer") || path.startsWith("/api/v1/buyer") || path.startsWith("/api/v1/users") || path.startsWith("/farmer") || path.startsWith("/buyer")) {
            return userServiceUrl;
        } else if (path.startsWith("/api/v1/ai") || path.startsWith("/api/v1/analyses") || path.startsWith("/api/v1/crops") || path.startsWith("/api/v1/certificates")) {
            return aiServiceUrl;
        } else if (path.startsWith("/api/v1/batches") || path.startsWith("/batches")) {
            return batchServiceUrl;
        } else if (path.startsWith("/api/v1/listings") || path.startsWith("/api/v1/trades") || path.startsWith("/listings")) {
            return listingServiceUrl;
        } else if (path.startsWith("/api/v1/rates") || path.startsWith("/api/v1/market-recommendations") || path.startsWith("/rates")) {
            return marketServiceUrl;
        } else if (path.startsWith("/api/v1/chat") || path.startsWith("/conversations")) {
            return chatServiceUrl;
        } else if (path.startsWith("/api/v1/notifications") || path.startsWith("/notifications")) {
            return notificationServiceUrl;
        } else if (path.startsWith("/api/v1/admin")) {
            return adminServiceUrl;
        }
        return authServiceUrl;
    }
}
