package com.agrigrade.common.util;

import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Component
public class AppClock {

    private Clock clock = Clock.systemDefaultZone();

    public LocalDate currentDate() {
        return LocalDate.now(clock);
    }

    public LocalDateTime currentDateTime() {
        return LocalDateTime.now(clock);
    }

    public synchronized void setFixedClock(LocalDate date) {
        this.clock = Clock.fixed(date.atStartOfDay(ZoneId.systemDefault()).toInstant(), ZoneId.systemDefault());
    }

    public synchronized void resetClock() {
        this.clock = Clock.systemDefaultZone();
    }
}
