package com.agrigrade.batch;

import com.agrigrade.batch.dto.CreateBatchRequest;
import com.agrigrade.batch.dto.ProductBatchResponse;
import com.agrigrade.batch.service.ProductBatchService;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;


@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
public class ProductBatchTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProductBatchService batchService;


    // =========================================================
    // GET /api/v1/batches
    // =========================================================

    @Test
    @WithMockUser(username = "usr-farmer-001", roles = {"FARMER"})
    @DisplayName("GET /api/v1/batches should return farmer batches")
    void shouldReturnFarmerBatches() throws Exception {

        ProductBatchResponse resp = new ProductBatchResponse(
                101L,
                "BATCH-BANANA-101",
                1L,
                "Ramasamy K.",
                1L,
                "Banana",
                101L,
                "G9 / Grand Naine",
                "2026-08-08",
                BigDecimal.valueOf(1000),
                "KG",
                "Theni",
                "Tamil Nadu",
                "AMBIENT",
                "PENDING_AI",
                List.of(),
                95.0,
                "GRADE_A_PREMIUM",
                "AGRI-CERT-2026-101",
                "ISSUED",
                2,
                8.0,
                false,
                null,
                "2026-08-08T10:00:00",
                "2026-08-08T10:00:00"
        );

        when(batchService.getFarmerBatches("usr-farmer-001"))
                .thenReturn(List.of(resp));

        mockMvc.perform(
                        get("/api/v1/batches")
                                .contentType(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].batchNumber")
                        .value("BATCH-BANANA-101"))
                .andExpect(jsonPath("$[0].cropName")
                        .value("Banana"));
    }


    // =========================================================
    // POST /api/v1/batches - BANANA
    // =========================================================

    @Test
    @WithMockUser(username = "usr-farmer-001", roles = {"FARMER"})
    @DisplayName("POST /api/v1/batches should create new Banana batch")
    void shouldCreateBatch() throws Exception {

        CreateBatchRequest req = new CreateBatchRequest(
                1L,
                101L,
                "2026-08-08",
                BigDecimal.valueOf(1200),
                "KG",
                "Theni",
                "Tamil Nadu",
                "AMBIENT",
                null
        );

        ProductBatchResponse resp = new ProductBatchResponse(
                102L,
                "BATCH-BANANA-102",
                1L,
                "Ramasamy K.",
                1L,
                "Banana",
                101L,
                "G9 / Grand Naine",
                "2026-08-08",
                BigDecimal.valueOf(1200),
                "KG",
                "Theni",
                "Tamil Nadu",
                "AMBIENT",
                "PENDING_AI",
                List.of(),
                95.0,
                "GRADE_A_PREMIUM",
                "AGRI-CERT-2026-102",
                "ISSUED",
                2,
                8.0,
                false,
                null,
                "2026-08-08T10:00:00",
                "2026-08-08T10:00:00"
        );

        when(
                batchService.createBatch(
                        eq("usr-farmer-001"),
                        any(CreateBatchRequest.class)
                )
        ).thenReturn(resp);

        mockMvc.perform(
                        post("/api/v1/batches")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(req))
                )
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.batchNumber")
                        .value("BATCH-BANANA-102"))
                .andExpect(jsonPath("$.cropName")
                        .value("Banana"))
                .andExpect(jsonPath("$.varietyName")
                        .value("G9 / Grand Naine"));
    }


    // =========================================================
    // POST /api/v1/batches - TOMATO
    // =========================================================

    @Test
    @WithMockUser(username = "usr-farmer-001", roles = {"FARMER"})
    @DisplayName("POST /api/v1/batches should create Tomato CO-3 batch")
    void shouldCreateTomatoBatch() throws Exception {

        CreateBatchRequest req = new CreateBatchRequest(
                3L,
                24L,
                "2026-08-08",
                BigDecimal.valueOf(800),
                "KG",
                "Dindigul",
                "Tamil Nadu",
                "AMBIENT",
                null
        );

        ProductBatchResponse resp = new ProductBatchResponse(
                103L,
                "BATCH-TOMATO-103",
                1L,
                "Ramasamy K.",
                3L,
                "Tomato",
                24L,
                "CO-3 (Hybrid Country)",
                "2026-08-08",
                BigDecimal.valueOf(800),
                "KG",
                "Dindigul",
                "Tamil Nadu",
                "AMBIENT",
                "PENDING_AI",
                List.of(),
                95.0,
                "GRADE_A_PREMIUM",
                "AGRI-CERT-2026-103",
                "ISSUED",
                2,
                8.0,
                false,
                null,
                "2026-08-08T10:00:00",
                "2026-08-08T10:00:00"
        );

        when(
                batchService.createBatch(
                        eq("usr-farmer-001"),
                        any(CreateBatchRequest.class)
                )
        ).thenReturn(resp);

        mockMvc.perform(
                        post("/api/v1/batches")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(req))
                )
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.batchNumber")
                        .value("BATCH-TOMATO-103"))
                .andExpect(jsonPath("$.cropName")
                        .value("Tomato"))
                .andExpect(jsonPath("$.varietyName")
                        .value("CO-3 (Hybrid Country)"));
    }


    // =========================================================
    // DELETE /api/v1/batches/{id}
    // =========================================================

    @Test
    @WithMockUser(username = "usr-farmer-001", roles = {"FARMER"})
    @DisplayName("DELETE /api/v1/batches/{id} should delete batch and return 204")
    void shouldDeleteBatch() throws Exception {

        mockMvc.perform(
                        delete("/api/v1/batches/101")
                                .contentType(MediaType.APPLICATION_JSON)
                )
                .andExpect(status().isNoContent());

        verify(batchService)
                .deleteBatch("usr-farmer-001", 101L);
    }
}