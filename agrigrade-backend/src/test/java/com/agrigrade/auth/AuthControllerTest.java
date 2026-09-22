package com.agrigrade.auth;

import com.agrigrade.auth.dto.LoginRequest;
import com.agrigrade.auth.dto.RegisterRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private com.agrigrade.auth.repository.UserRepository userRepository;

    @Autowired
    private com.agrigrade.auth.repository.RefreshTokenRepository refreshTokenRepository;

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        java.util.List.of("sundar@trader.com", "sundar.login@trader.com", "sundar.me@trader.com").forEach(email -> {
            userRepository.findByEmailIgnoreCase(email).ifPresent(u -> {
                refreshTokenRepository.deleteByUserId(u.getId());
                userRepository.delete(u);
            });
        });
        java.util.List.of("+919123456789", "+919123456790", "+919123456791").forEach(mobile -> {
            userRepository.findByMobileNumber(mobile).ifPresent(u -> {
                refreshTokenRepository.deleteByUserId(u.getId());
                userRepository.delete(u);
            });
        });
    }

    @Test
    @DisplayName("REST POST /api/v1/auth/register - 201 Created")
    void testRegisterEndpoint() throws Exception {
        RegisterRequest request = new RegisterRequest(
            "Sundar Buyer",
            "sundar@trader.com",
            "+919123456789",
            "Password123!",
            "BUYER",
            "Sundar Exports Ltd",
            "Chennai"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.token").exists())
            .andExpect(jsonPath("$.refreshToken").exists())
            .andExpect(jsonPath("$.user.email").value("sundar@trader.com"))
            .andExpect(jsonPath("$.user.roles[0]").value("BUYER"));
    }

    @Test
    @DisplayName("REST POST /api/v1/auth/login - 200 OK")
    void testLoginEndpoint() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest(
            "Sundar Buyer",
            "sundar.login@trader.com",
            "+919123456790",
            "Password123!",
            "BUYER",
            "Sundar Exports Ltd",
            "Chennai"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
            .andExpect(status().isCreated());

        LoginRequest loginRequest = new LoginRequest("sundar.login@trader.com", "Password123!");

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").exists())
            .andExpect(jsonPath("$.user.email").value("sundar.login@trader.com"));
    }

    @Test
    @DisplayName("REST GET /api/v1/auth/me - Protected Endpoint Verification")
    void testGetMeEndpoint() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest(
            "Sundar Buyer",
            "sundar.me@trader.com",
            "+919123456791",
            "Password123!",
            "BUYER",
            "Sundar Exports Ltd",
            "Chennai"
        );

        MvcResult regResult = mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
            .andExpect(status().isCreated())
            .andReturn();

        String responseJson = regResult.getResponse().getContentAsString();
        String token = objectMapper.readTree(responseJson).get("token").asText();

        // 1. Unauthenticated call -> 403 Forbidden / 401 Unauthorized
        mockMvc.perform(get("/api/v1/auth/me"))
            .andExpect(status().isForbidden());

        // 2. Authenticated call with Bearer JWT -> 200 OK
        mockMvc.perform(get("/api/v1/auth/me")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.user.email").value("sundar.me@trader.com"));
    }
}
