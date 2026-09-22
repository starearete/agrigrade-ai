package com.agrigrade.common.controller;

import com.agrigrade.common.util.AppClock;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/test/clock")
public class TestClockController {

    private final AppClock appClock;

    public TestClockController(AppClock appClock) {
        this.appClock = appClock;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> setClock(@RequestBody(required = false) Map<String, Object> body) {
        String dateStr = null;
        if (body != null) {
            if (body.containsKey("fixedDate") && body.get("fixedDate") != null) {
                dateStr = body.get("fixedDate").toString();
            } else if (body.containsKey("date") && body.get("date") != null) {
                dateStr = body.get("date").toString();
            }
        }
        if (dateStr != null && !dateStr.isBlank()) {
            LocalDate date = LocalDate.parse(dateStr);
            appClock.setFixedClock(date);
            return ResponseEntity.ok(Map.of("status", "FIXED", "currentDate", appClock.currentDate().toString()));
        } else {
            appClock.resetClock();
            return ResponseEntity.ok(Map.of("status", "SYSTEM", "currentDate", appClock.currentDate().toString()));
        }
    }
}
