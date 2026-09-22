package com.agrigrade.market.service;

import com.agrigrade.market.dto.MarketRecommendationRequest;
import com.agrigrade.market.dto.MarketRecommendationResponse;
import com.agrigrade.market.dto.MarketTrendDayDto;
import com.agrigrade.market.entity.Market;
import com.agrigrade.market.repository.MarketRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.HashSet;

@Service
@Transactional(readOnly = true)
public class MarketRecommendationService {

    private final MarketRepository marketRepository;

    // Comprehensive Centroids (lat, lng) for all 38 Tamil Nadu Districts
    private static final Map<String, double[]> DISTRICT_COORDINATES = Map.ofEntries(
        Map.entry("ariyalur", new double[]{11.1401, 79.0786}),
        Map.entry("chengalpattu", new double[]{12.6841, 79.9836}),
        Map.entry("chennai", new double[]{13.0827, 80.2707}),
        Map.entry("coimbatore", new double[]{11.0168, 76.9558}),
        Map.entry("cuddalore", new double[]{11.7480, 79.7714}),
        Map.entry("dharmapuri", new double[]{12.1211, 78.1582}),
        Map.entry("dindigul", new double[]{10.3673, 77.9803}),
        Map.entry("erode", new double[]{11.3410, 77.7172}),
        Map.entry("sathyamangalam", new double[]{11.5034, 77.2444}),
        Map.entry("kallakurichi", new double[]{11.7384, 78.9639}),
        Map.entry("kancheepuram", new double[]{12.8342, 79.7036}),
        Map.entry("kanniyakumari", new double[]{8.1833, 77.4119}),
        Map.entry("karur", new double[]{10.9601, 78.0766}),
        Map.entry("krishnagiri", new double[]{12.5186, 78.2137}),
        Map.entry("madurai", new double[]{9.9252, 78.1198}),
        Map.entry("mayiladuthurai", new double[]{11.1075, 79.6523}),
        Map.entry("nagapattinam", new double[]{10.7672, 79.8449}),
        Map.entry("namakkal", new double[]{11.2189, 78.1674}),
        Map.entry("nilgiris", new double[]{11.4102, 76.6950}),
        Map.entry("perambalur", new double[]{11.2342, 78.8819}),
        Map.entry("pudukkottai", new double[]{10.3797, 78.8208}),
        Map.entry("ramanathapuram", new double[]{9.3639, 78.8395}),
        Map.entry("ranipet", new double[]{12.9272, 79.3331}),
        Map.entry("salem", new double[]{11.6643, 78.1460}),
        Map.entry("sivaganga", new double[]{10.0735, 78.7732}),
        Map.entry("tenkasi", new double[]{8.8711, 77.4958}),
        Map.entry("thanjavur", new double[]{10.7870, 79.1378}),
        Map.entry("theni", new double[]{10.0104, 77.4768}),
        Map.entry("thoothukudi", new double[]{8.7642, 78.1348}),
        Map.entry("tiruchirappalli", new double[]{10.7905, 78.7047}),
        Map.entry("trichy", new double[]{10.7905, 78.7047}),
        Map.entry("tirunelveli", new double[]{8.7280, 77.7074}),
        Map.entry("tirupathur", new double[]{12.4958, 78.5678}),
        Map.entry("tiruppur", new double[]{11.1085, 77.3411}),
        Map.entry("tiruvallur", new double[]{13.1438, 79.9083}),
        Map.entry("tiruvannamalai", new double[]{12.2253, 79.0747}),
        Map.entry("tiruvarur", new double[]{10.6637, 79.4442}),
        Map.entry("vellore", new double[]{12.9165, 79.1325}),
        Map.entry("viluppuram", new double[]{11.9401, 79.4861}),
        Map.entry("virudhunagar", new double[]{9.5872, 77.9579})
    );

    public MarketRecommendationService(MarketRepository marketRepository) {
        this.marketRepository = marketRepository;
    }

    public List<MarketRecommendationResponse> generateRecommendations(MarketRecommendationRequest req) {
        List<Market> markets = marketRepository.findByIsActiveTrue();
        if (markets.isEmpty() || req == null || req.district() == null || req.district().isBlank()) {
            return List.of();
        }

        String originDistrict = req.district().trim();
        String originTaluk = req.taluk() != null ? req.taluk().trim() : "";

        BigDecimal quantity = req.quantityKg() != null && req.quantityKg().compareTo(BigDecimal.ZERO) > 0
            ? req.quantityKg() : BigDecimal.valueOf(1000);

        // Grade price multiplier
        double gradeMultiplier = 1.0;
        if ("GRADE_A".equalsIgnoreCase(req.qualityGrade()) || "GRADE_A_PREMIUM".equalsIgnoreCase(req.qualityGrade()) || "Grade A".equalsIgnoreCase(req.qualityGrade())) {
            gradeMultiplier = 1.15;
        } else if ("GRADE_C".equalsIgnoreCase(req.qualityGrade()) || "GRADE_C_COMMERCIAL".equalsIgnoreCase(req.qualityGrade()) || "Grade C".equalsIgnoreCase(req.qualityGrade())) {
            gradeMultiplier = 0.85;
        }

        double baseRatePerKg = 28.5 * gradeMultiplier;
        List<MarketRecommendationResponse> results = new ArrayList<>();

        Set<String> seenMarkets = new java.util.HashSet<>();
        List<Market> distinctMarkets = new ArrayList<>();
        for (Market m : markets) {
            String key = (m.getName() != null ? m.getName().trim().toLowerCase() : "") + "|" + 
                         (m.getDistrict() != null ? m.getDistrict().trim().toLowerCase() : "");
            if (seenMarkets.add(key)) {
                distinctMarkets.add(m);
            }
        }

        for (Market m : distinctMarkets) {
            double distanceKm = computeDistance(originDistrict, originTaluk, m);
            int travelMinutes = (int) (distanceKm * 1.5);
            double transportCost = distanceKm * 4.5 + 500.0;

            // Proximity bonus: higher price realization for nearby mandis
            double proximityBonus = (m.getDistrict() != null && m.getDistrict().equalsIgnoreCase(originDistrict)) ? 2.5 : 0.0;
            double marketPrice = baseRatePerKg + proximityBonus;
            double grossValue = quantity.doubleValue() * marketPrice;
            double netRevenue = Math.max(0, grossValue - transportCost);
            double score = Math.min(100.0, Math.max(50.0, (netRevenue / 1000.0) + Math.max(0, 100.0 - distanceKm * 0.2)));

            List<MarketTrendDayDto> trend = generatePriceTrend(marketPrice);

            results.add(new MarketRecommendationResponse(
                m.getId(),
                null,
                m.getId(),
                m.getName(),
                m.getDistrict(),
                req.cropName() != null ? req.cropName() : "Banana",
                req.varietyName() != null ? req.varietyName() : "G9 / Grand Naine",
                req.qualityGrade() != null ? req.qualityGrade() : "GRADE_A",
                BigDecimal.valueOf(marketPrice).setScale(2, RoundingMode.HALF_UP),
                BigDecimal.valueOf(distanceKm).setScale(1, RoundingMode.HALF_UP),
                travelMinutes,
                BigDecimal.valueOf(transportCost).setScale(2, RoundingMode.HALF_UP),
                BigDecimal.valueOf(grossValue).setScale(2, RoundingMode.HALF_UP),
                BigDecimal.valueOf(netRevenue).setScale(2, RoundingMode.HALF_UP),
                BigDecimal.valueOf(score).setScale(1, RoundingMode.HALF_UP),
                1,
                LocalDate.now().toString(),
                LocalDate.now().toString(),
                trend
            ));
        }

        if ("NEAREST".equalsIgnoreCase(req.sortMode())) {
            results.sort(Comparator.comparing(MarketRecommendationResponse::distanceKm));
        } else if ("HIGHEST_PRICE".equalsIgnoreCase(req.sortMode())) {
            results.sort(Comparator.comparing(MarketRecommendationResponse::currentMarketPricePerKg).reversed());
        } else {
            results.sort(Comparator.comparing(MarketRecommendationResponse::estimatedNetRevenue).reversed());
        }

        List<MarketRecommendationResponse> ranked = new ArrayList<>();
        for (int i = 0; i < results.size(); i++) {
            MarketRecommendationResponse r = results.get(i);
            ranked.add(new MarketRecommendationResponse(
                r.id(), r.batchId(), r.marketId(), r.marketName(), r.district(), r.cropName(),
                r.varietyName(), r.qualityGrade(), r.currentMarketPricePerKg(), r.distanceKm(),
                r.estimatedTravelMinutes(), r.estimatedTransportCost(), r.grossValue(),
                r.estimatedNetRevenue(), r.recommendationScore(), i + 1, r.observedAt(), r.generatedAt(), r.priceTrend()
            ));
        }

        return ranked;
    }

    private double computeDistance(String originDistrict, String originTaluk, Market m) {
        if (m.getDistrict() != null && m.getDistrict().equalsIgnoreCase(originDistrict)) {
            if (m.getTaluk() != null && originTaluk != null && m.getTaluk().equalsIgnoreCase(originTaluk)) {
                return 12.5; // Level 1: Same taluk
            }
            return 28.5; // Level 2: Same district
        }

        double[] originCoords = DISTRICT_COORDINATES.get(originDistrict.toLowerCase());
        double marketLat = m.getLatitude() != null ? m.getLatitude().doubleValue() : 0.0;
        double marketLng = m.getLongitude() != null ? m.getLongitude().doubleValue() : 0.0;

        if (originCoords != null && marketLat > 0 && marketLng > 0) {
            double dist = haversineKm(originCoords[0], originCoords[1], marketLat, marketLng);
            return Math.max(15.0, Math.round(dist * 10.0) / 10.0);
        }

        return 95.0 + (m.getId() * 15.0);
    }

    private double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth radius in KM
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
            * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private List<MarketTrendDayDto> generatePriceTrend(double basePrice) {
        List<MarketTrendDayDto> list = new ArrayList<>();
        LocalDate today = LocalDate.now();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM dd");

        for (int i = 6; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            double var = (Math.sin(i) * 1.2);
            list.add(new MarketTrendDayDto(
                d.toString(),
                d.format(fmt),
                BigDecimal.valueOf(basePrice + var).setScale(2, RoundingMode.HALF_UP)
            ));
        }
        return list;
    }
}
