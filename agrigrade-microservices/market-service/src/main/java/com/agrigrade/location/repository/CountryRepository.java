package com.agrigrade.location.repository;

import com.agrigrade.location.entity.Country;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CountryRepository extends JpaRepository<Country, Long> {
    Optional<Country> findByCodeIgnoreCase(String code);
    Optional<Country> findByNameIgnoreCase(String name);
}
