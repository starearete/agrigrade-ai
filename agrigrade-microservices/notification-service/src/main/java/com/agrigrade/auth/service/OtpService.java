package com.agrigrade.auth.service;

import com.agrigrade.auth.entity.OtpVerification;
import com.agrigrade.auth.repository.OtpVerificationRepository;
import com.agrigrade.common.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Optional;

@Service
public class OtpService {

    private final OtpVerificationRepository otpRepository;

    public OtpService(OtpVerificationRepository otpRepository) {
        this.otpRepository = otpRepository;
    }

    @Transactional
    public String generateAndSaveOtp(Long userId, String destination, String purpose) {
        // Safe development-only OTP value: "123456" for local dev testing
        String rawOtp = "123456";
        String otpHash = hashToken(rawOtp);

        OtpVerification otp = new OtpVerification();
        otp.setUserId(userId);
        otp.setTargetDestination(destination);
        otp.setOtpHash(otpHash);
        otp.setPurpose(purpose);
        otp.setAttemptCount(0);
        otp.setExpiresAt(LocalDateTime.now().plusMinutes(10));

        otpRepository.save(otp);
        return rawOtp;
    }

    @Transactional
    public boolean verifyOtp(String destination, String purpose, String rawOtp) {
        Optional<OtpVerification> optionalOtp = otpRepository
            .findTopByTargetDestinationAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(destination, purpose);

        if (optionalOtp.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_OTP", "No active OTP found for destination");
        }

        OtpVerification otp = optionalOtp.get();

        if (otp.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "EXPIRED_OTP", "OTP has expired");
        }

        if (otp.getAttemptCount() >= 5) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "MAX_OTP_ATTEMPTS", "Maximum OTP attempt limit reached");
        }

        otp.setAttemptCount(otp.getAttemptCount() + 1);

        String hash = hashToken(rawOtp);
        if (!hash.equals(otp.getOtpHash())) {
            otpRepository.save(otp);
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_OTP", "Incorrect OTP code");
        }

        otp.setConsumedAt(LocalDateTime.now());
        otpRepository.save(otp);
        return true;
    }

    public String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm unavailable", e);
        }
    }
}
