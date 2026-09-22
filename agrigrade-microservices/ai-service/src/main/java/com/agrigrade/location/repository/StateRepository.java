package com.agrigrade.location.repository;

import com.agrigrade.location.entity.State;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StateRepository extends JpaRepository<State, Long> {
    List<State> findByCountryIdOrderByNameAsc(Long countryId);
    Optional<State> findByCountryIdAndNameIgnoreCase(Long countryId, String name);
    Optional<State> findByCountryIdAndCodeIgnoreCase(Long countryId, String code);
    Optional<State> findByNameIgnoreCase(String name);
}
