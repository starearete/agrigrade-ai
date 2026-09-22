package com.agrigrade.market.repository;

import com.agrigrade.market.entity.Market;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MarketRepository extends JpaRepository<Market, Long> {
    List<Market> findByIsActiveTrue();
    List<Market> findByDistrictAndIsActiveTrue(String district);
    Optional<Market> findByCode(String code);
}
