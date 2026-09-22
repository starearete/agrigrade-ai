package com.agrigrade.profile;

import com.agrigrade.auth.dto.LoginResponse;
import com.agrigrade.auth.dto.RegisterRequest;
import com.agrigrade.auth.service.AuthService;
import com.agrigrade.profile.dto.AddressRequest;
import com.agrigrade.profile.dto.FarmRequest;
import com.agrigrade.profile.repository.FarmerProfileRepository;
import com.agrigrade.profile.repository.FarmRepository;
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
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
class FarmTest {

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

    @Autowired
    private FarmRepository farmRepository;

    private String farmer1Token;
    private String farmer2Token;

    @BeforeEach
    void setUp() {
        List.of("farmer1@test.com", "farmer2@test.com").forEach(email -> {
            userRepository.findByEmailIgnoreCase(email).ifPresent(u -> {
                farmerProfileRepository.findByUserId(u.getId()).ifPresent(fp -> {
                    farmRepository.deleteAll(farmRepository.findByFarmerId(fp.getId()));
                    farmerProfileRepository.delete(fp);
                });
                refreshTokenRepository.deleteByUserId(u.getId());
                userRepository.delete(u);
            });
        });

        LoginResponse farmer1Auth = authService.register(new RegisterRequest(
            "Farmer One", "farmer1@test.com", "+919800000001", "Pass123!", "FARMER", "F1", "Salem"
        ));
        farmer1Token = farmer1Auth.token();

        LoginResponse farmer2Auth = authService.register(new RegisterRequest(
            "Farmer Two", "farmer2@test.com", "+919800000002", "Pass123!", "FARMER", "F2", "Madurai"
        ));
        farmer2Token = farmer2Auth.token();
    }

    @Test
    @DisplayName("Farms - Farmer can CREATE, GET, UPDATE, and DELETE own Farm")
    void testFarmerFarmCrudLifecycle() throws Exception {
        AddressRequest farmAddr = new AddressRequest(
            "Survey No 104/A", "Near Lake", "Omalur", "Salem", "Tamil Nadu", "636388",
            new BigDecimal("11.7450"), new BigDecimal("78.0400"), "FARM", false
        );
        FarmRequest createReq = new FarmRequest("Green Valley Banana Orchard", new BigDecimal("8.50"), "Alluvial Clay", "Drip Irrigation", true, farmAddr);

        // 1. CREATE Farm
        MvcResult createResult = mockMvc.perform(post("/api/v1/profiles/farms")
                .header("Authorization", "Bearer " + farmer1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createReq)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.farmName").value("Green Valley Banana Orchard"))
            .andExpect(jsonPath("$.areaAcres").value(8.50))
            .andReturn();

        String responseJson = createResult.getResponse().getContentAsString();
        Long farmId = objectMapper.readTree(responseJson).get("id").asLong();

        // 2. LIST Farms
        mockMvc.perform(get("/api/v1/profiles/farms")
                .header("Authorization", "Bearer " + farmer1Token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1))
            .andExpect(jsonPath("$[0].id").value(farmId));

        // 3. GET Farm BY ID
        mockMvc.perform(get("/api/v1/profiles/farms/" + farmId)
                .header("Authorization", "Bearer " + farmer1Token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(farmId));

        // 4. UPDATE Farm
        FarmRequest updateReq = new FarmRequest("Green Valley High Yield Orchard", new BigDecimal("10.00"), "Red Loam", "Drip Irrigation", true, farmAddr);
        mockMvc.perform(put("/api/v1/profiles/farms/" + farmId)
                .header("Authorization", "Bearer " + farmer1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.farmName").value("Green Valley High Yield Orchard"))
            .andExpect(jsonPath("$.areaAcres").value(10.00));

        // 5. DELETE Farm
        mockMvc.perform(delete("/api/v1/profiles/farms/" + farmId)
                .header("Authorization", "Bearer " + farmer1Token))
            .andExpect(status().isNoContent());

        // 6. VERIFY Farm DELETED
        mockMvc.perform(get("/api/v1/profiles/farms/" + farmId)
                .header("Authorization", "Bearer " + farmer1Token))
            .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Farms - Cross-Farmer Ownership Isolation (Farmer 2 CANNOT access/update/delete Farmer 1's farm)")
    void testCrossFarmerOwnershipIsolation() throws Exception {
        AddressRequest farmAddr = new AddressRequest("Survey No 55", "", "Locality", "Salem", "Tamil Nadu", "636388", null, null, "FARM", false);
        FarmRequest createReq = new FarmRequest("Farmer 1 Farm", new BigDecimal("5.00"), "Loam", "Canal", true, farmAddr);

        // Farmer 1 creates farm
        MvcResult createResult = mockMvc.perform(post("/api/v1/profiles/farms")
                .header("Authorization", "Bearer " + farmer1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createReq)))
            .andExpect(status().isCreated())
            .andReturn();

        Long farm1Id = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

        // Farmer 2 attempts GET on Farmer 1's farm -> 404 NOT FOUND
        mockMvc.perform(get("/api/v1/profiles/farms/" + farm1Id)
                .header("Authorization", "Bearer " + farmer2Token))
            .andExpect(status().isNotFound());

        // Farmer 2 attempts PUT on Farmer 1's farm -> 404 NOT FOUND
        mockMvc.perform(put("/api/v1/profiles/farms/" + farm1Id)
                .header("Authorization", "Bearer " + farmer2Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createReq)))
            .andExpect(status().isNotFound());

        // Farmer 2 attempts DELETE on Farmer 1's farm -> 404 NOT FOUND
        mockMvc.perform(delete("/api/v1/profiles/farms/" + farm1Id)
                .header("Authorization", "Bearer " + farmer2Token))
            .andExpect(status().isNotFound());
    }
}
