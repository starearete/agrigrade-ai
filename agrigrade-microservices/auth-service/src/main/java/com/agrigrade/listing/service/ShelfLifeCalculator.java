package com.agrigrade.listing.service;

import com.agrigrade.batch.entity.ProductBatch;
import com.agrigrade.crop.entity.Crop;
import com.agrigrade.listing.dto.ShelfLifeCalculationResult;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Component
public class ShelfLifeCalculator {

    private final double warningThresholdDays;

    public ShelfLifeCalculator(
            @Value("${app.shelf-life.warning-threshold-days:3.0}") double warningThresholdDays
    ) {
        this.warningThresholdDays = warningThresholdDays;
    }

    public double getGradeAdjustmentFactor(String gradeStr) {
        if (gradeStr == null) return 1.0;
        String g = gradeStr.toUpperCase();
        if (g.contains("GRADE_A_PREMIUM") || g.contains("PREMIUM")) return 1.20;
        if (g.equals("GRADE_A") || g.equals("A") || g.contains("GRADE_A_STANDARD")) return 1.00;
        if (g.contains("GRADE_B") || g.equals("B")) return 0.85;
        if (g.contains("GRADE_C") || g.equals("C")) return 0.70;
        if (g.contains("REJECT")) return 0.00;
        return 1.00;
    }

    public ShelfLifeCalculationResult calculate(ProductBatch batch, String assignedGrade, Double qualityScore, LocalDate currentDate) {
        Crop crop = (batch != null && batch.getVariety() != null) ? batch.getVariety().getCrop() : null;
        int baseDays = (crop != null && crop.getBaseShelfLifeDays() != null) ? crop.getBaseShelfLifeDays() : 14;

        String grade = assignedGrade != null ? assignedGrade : "GRADE_A_PREMIUM";
        double score = qualityScore != null ? qualityScore : 95.0;

        double factor = getGradeAdjustmentFactor(grade);
        double effectiveDays = Math.round(baseDays * factor * 10.0) / 10.0;

        LocalDate harvestDate = (batch != null && batch.getHarvestDate() != null) ? batch.getHarvestDate() : currentDate;
        int cropAgeDays = Math.max(0, (int) ChronoUnit.DAYS.between(harvestDate, currentDate));

        double rawRemaining = effectiveDays - cropAgeDays;
        double remainingDays = Math.max(0.0, Math.round(rawRemaining * 10.0) / 10.0);

        String status;
        if (remainingDays <= 0.0) {
            status = "EXPIRED";
        } else if (remainingDays <= warningThresholdDays) {
            status = "NEAR_EXPIRY";
        } else {
            status = "FRESH";
        }

        return new ShelfLifeCalculationResult(
                baseDays,
                effectiveDays,
                remainingDays,
                status,
                grade,
                score,
                harvestDate.toString(),
                cropAgeDays
        );
    }
}
