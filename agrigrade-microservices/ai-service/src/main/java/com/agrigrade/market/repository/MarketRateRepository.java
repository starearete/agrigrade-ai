package com.agrigrade.market.repository;

import com.agrigrade.market.entity.MarketRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MarketRateRepository extends JpaRepository<MarketRate, Long> {
    List<MarketRate> findByVarietyIdOrderByObservedAtDesc(Long varietyId);
    Optional<MarketRate> findFirstByMarketIdAndVarietyIdOrderByObservedAtDesc(Long marketId, Long varietyId);
}
