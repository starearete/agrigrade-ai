package com.agrigrade.profile;

import com.agrigrade.auth.dto.LoginResponse;
import com.agrigrade.auth.dto.RegisterRequest;
import com.agrigrade.auth.service.AuthService;
import com.agrigrade.profile.dto.AddressRequest;
import com.agrigrade.profile.dto.FarmerProfileUpdateRequest;
import com.agrigrade.profile.repository.FarmerProfileRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
class FarmerProfileTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AuthService authService;

    @Autowired
    private com.agrigrade.auth.repository.UserRepository userRepository;

    @Autowired
    private com.agrigrade.auth.repository.RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private FarmerProfileRepository farmerProfileRepository;

    private String farmerToken;
    private String buyerToken;

    @BeforeEach
    void setUp() {
        List.of("muthu@farmer.com", "anbu@buyer.com").forEach(email -> {
            userRepository.findByEmailIgnoreCase(email).ifPresent(u -> {
                farmerProfileRepository.findByUserId(u.getId()).ifPresent(farmerProfileRepository::delete);
                refreshTokenRepository.deleteByUserId(u.getId());
                userRepository.delete(u);
            });
        });

        LoginResponse farmerAuth = authService.register(new RegisterRequest(
            "Muthu Farmer", "muthu@farmer.com", "+919876500001", "Pass123!", "FARMER", "Muthu Farms", "Thanjavur"
        ));
        farmerToken = farmerAuth.token();

        LoginResponse buyerAuth = authService.register(new RegisterRequest(
            "Anbu Buyer", "anbu@buyer.com", "+919876500002", "Pass123!", "BUYER", "Anbu Traders", "Chennai"
        ));
        buyerToken = buyerAuth.token();
    }

    @Test
    @DisplayName("Farmer Profile - GET /api/v1/profiles/farmer (200 OK)")
    void testGetFarmerProfile() throws Exception {
        mockMvc.perform(get("/api/v1/profiles/farmer")
                .header("Authorization", "Bearer " + farmerToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.fullName").value("Muthu Farmer"))
            .andExpect(jsonPath("$.email").value("muthu@farmer.com"))
            .andExpect(jsonPath("$.farmerCode").exists());
    }

    @Test
    @DisplayName("Farmer Profile - UPDATE /api/v1/profiles/farmer (200 OK)")
    void testUpdateFarmerProfile() throws Exception {
        AddressRequest addrReq = new AddressRequest(
            "123 Cauvery Bank Road", "Village Area", "Papanasam", "Thanjavur", "Tamil Nadu", "614205",
            new BigDecimal("10.9250"), new BigDecimal("79.2800"), "RESIDENTIAL", true
        );

        FarmerProfileUpdateRequest updateReq = new FarmerProfileUpdateRequest(
            "Muthuvel Farmer", "+919876500001", "KCC-99887766", new BigDecimal("12.50"), addrReq
        );

        mockMvc.perform(put("/api/v1/profiles/farmer")
                .header("Authorization", "Bearer " + farmerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.fullName").value("Muthuvel Farmer"))
            .andExpect(jsonPath("$.kisanCreditCardNo").value("KCC-99887766"))
            .andExpect(jsonPath("$.totalLandAcres").value(12.50))
            .andExpect(jsonPath("$.primaryAddress.district").value("Thanjavur"));
    }

    @Test
    @DisplayName("Farmer Profile - Buyer is FORBIDDEN from accessing Farmer Endpoint (403)")
    void testBuyerCannotAccessFarmerProfile() throws Exception {
        mockMvc.perform(get("/api/v1/profiles/farmer")
                .header("Authorization", "Bearer " + buyerToken))
            .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Farmer Profile - Unauthenticated request returns FORBIDDEN/UNAUTHORIZED")
    void testUnauthenticatedFarmerProfileRequest() throws Exception {
        mockMvc.perform(get("/api/v1/profiles/farmer"))
            .andExpect(status().isForbidden());
    }
}
