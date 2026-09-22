package com.agrigrade.auth.repository;

import com.agrigrade.auth.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {

    Optional<OtpVerification> findTopByTargetDestinationAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(
        String targetDestination, String purpose
    );
}
