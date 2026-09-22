package com.agrigrade.crop;

import com.agrigrade.crop.dto.CropCategoryDto;
import com.agrigrade.crop.dto.CropDto;
import com.agrigrade.crop.dto.CropVarietyDto;
import com.agrigrade.crop.service.CropService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
public class CropControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CropService cropService;

    @Test
    @DisplayName("GET /api/v1/crops should return active crops list")
    void shouldReturnActiveCrops() throws Exception {
        CropDto crop = new CropDto(1L, 1L, "Fruits", "BANANA", "Banana", "Musa acuminata", 12, "Cool, ventilated storage", true);
        when(cropService.getAllActiveCrops()).thenReturn(List.of(crop));

        mockMvc.perform(get("/api/v1/crops")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Banana"))
                .andExpect(jsonPath("$[0].code").value("BANANA"))
                .andExpect(jsonPath("$[0].defaultStorageCondition").value("Cool, ventilated storage"));
    }

    @Test
    @DisplayName("GET /api/v1/crops/{id}/varieties should return crop varieties")
    void shouldReturnCropVarieties() throws Exception {
        CropVarietyDto variety = new CropVarietyDto(101L, 1L, "Banana", "BANANA_G9", "G9 / Grand Naine", "Musa Grand Naine", true);
        when(cropService.getVarietiesByCropId(1L)).thenReturn(List.of(variety));

        mockMvc.perform(get("/api/v1/crops/1/varieties")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("G9 / Grand Naine"));
    }
}
