package com.agrigrade;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("dev")
class AgrigradeBackendApplicationTests {

    @Test
    void contextLoads() {
        // Verifies Spring Boot Context & Flyway Migrations against MySQL Database
    }
}
