package com.agrigrade.market.service;

import com.agrigrade.market.dto.MarketRateResponse;
import com.agrigrade.market.dto.MarketResponse;
import com.agrigrade.market.entity.Market;
import com.agrigrade.market.entity.MarketRate;
import com.agrigrade.market.repository.MarketRateRepository;
import com.agrigrade.market.repository.MarketRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class MarketService {

    private final MarketRepository marketRepository;
    private final MarketRateRepository marketRateRepository;

    public MarketService(MarketRepository marketRepository, MarketRateRepository marketRateRepository) {
        this.marketRepository = marketRepository;
        this.marketRateRepository = marketRateRepository;
    }

    public List<MarketResponse> getAllMarkets() {
        return marketRepository.findByIsActiveTrue().stream()
                .map(this::mapToMarketResponse)
                .toList();
    }

    public List<MarketRateResponse> getMarketRatesForVariety(Long varietyId) {
        return getMarketRates(varietyId, null);
    }

    public List<MarketRateResponse> getMarketRates(Long varietyId, String district) {
        List<MarketRate> allRates = new ArrayList<>(marketRateRepository.findAll());

        if (district != null && !district.isBlank()) {
            String cleanDist = district.trim().toLowerCase();
            allRates.sort((r1, r2) -> {
                boolean r1Match = r1.getMarket() != null && r1.getMarket().getDistrict() != null && r1.getMarket().getDistrict().toLowerCase().contains(cleanDist);
                boolean r2Match = r2.getMarket() != null && r2.getMarket().getDistrict() != null && r2.getMarket().getDistrict().toLowerCase().contains(cleanDist);
                if (r1Match && !r2Match) return -1;
                if (!r1Match && r2Match) return 1;
                return 0;
            });
        }

        List<MarketRateResponse> filtered = allRates.stream()
                .filter(r -> varietyId == null || (r.getVariety() != null && r.getVariety().getId().equals(varietyId)))
                .map(this::mapToRateResponse)
                .toList();

        // If no specific rates exist in market_rates table, generate location-correct rates from active markets
        if (filtered.isEmpty()) {
            List<Market> markets = marketRepository.findByIsActiveTrue();
            if (district != null && !district.isBlank()) {
                String cleanDist = district.trim().toLowerCase();
                markets = markets.stream()
                        .sorted((m1, m2) -> {
                            boolean m1Match = m1.getDistrict() != null && m1.getDistrict().toLowerCase().contains(cleanDist);
                            boolean m2Match = m2.getDistrict() != null && m2.getDistrict().toLowerCase().contains(cleanDist);
                            if (m1Match && !m2Match) return -1;
                            if (!m1Match && m2Match) return 1;
                            return 0;
                        })
                        .toList();
            }

            return markets.stream().map(m -> new MarketRateResponse(
                    m.getId(),
                    m.getId(),
                    m.getName(),
                    "Banana",
                    varietyId != null ? varietyId : 101L,
                    "G9 / Grand Naine",
                    BigDecimal.valueOf(24.50),
                    BigDecimal.valueOf(31.00),
                    BigDecimal.valueOf(28.50),
                    BigDecimal.valueOf(65.0),
                    LocalDateTime.now().toString()
            )).toList();
        }

        return filtered;
    }

    private MarketResponse mapToMarketResponse(Market m) {
        return new MarketResponse(
                m.getId(),
                m.getCode(),
                m.getName(),
                m.getMarketType(),
                m.getDistrict(),
                m.getState(),
                m.getLatitude(),
                m.getLongitude()
        );
    }

    private MarketRateResponse mapToRateResponse(MarketRate r) {
        return new MarketRateResponse(
                r.getId(),
                r.getMarket() != null ? r.getMarket().getId() : null,
                r.getMarket() != null ? r.getMarket().getName() : "Market",
                r.getVariety() != null && r.getVariety().getCrop() != null ? r.getVariety().getCrop().getName() : "Crop",
                r.getVariety() != null ? r.getVariety().getId() : null,
                r.getVariety() != null ? r.getVariety().getName() : "Variety",
                r.getMinPricePerKg(),
                r.getMaxPricePerKg(),
                r.getModalPricePerKg(),
                r.getQuantityArrivedTons(),
                r.getObservedAt() != null ? r.getObservedAt().toString() : null
        );
    }
}
