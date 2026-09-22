package com.agrigrade.auth;

import com.agrigrade.auth.dto.LoginRequest;
import com.agrigrade.auth.dto.LoginResponse;
import com.agrigrade.auth.dto.RefreshTokenRequest;
import com.agrigrade.auth.dto.RegisterRequest;
import com.agrigrade.auth.dto.UserProfileResponse;
import com.agrigrade.auth.entity.User;
import com.agrigrade.auth.repository.RefreshTokenRepository;
import com.agrigrade.auth.repository.UserRepository;
import com.agrigrade.auth.service.AuthService;
import com.agrigrade.auth.service.OtpService;
import com.agrigrade.common.exception.ApiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class AuthServiceTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OtpService otpService;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private jakarta.persistence.EntityManager entityManager;

    private RegisterRequest farmerRegisterRequest;

    @BeforeEach
    void setUp() {
        List.of("ramanathan@agrigrade.com", "ramanathan.new@agrigrade.com", "fresh.farmer@agrigrade.com").forEach(email -> {
            userRepository.findByEmailIgnoreCase(email).ifPresent(u -> {
                refreshTokenRepository.deleteByUserId(u.getId());
                entityManager.createNativeQuery("DELETE FROM admin_actions WHERE admin_user_id = :id OR target_user_id = :id").setParameter("id", u.getId()).executeUpdate();
                userRepository.delete(u);
            });
        });
        List.of("+919876543210", "+919876543211", "+919876543212").forEach(mobile -> {
            userRepository.findByMobileNumber(mobile).ifPresent(u -> {
                refreshTokenRepository.deleteByUserId(u.getId());
                entityManager.createNativeQuery("DELETE FROM admin_actions WHERE admin_user_id = :id OR target_user_id = :id").setParameter("id", u.getId()).executeUpdate();
                userRepository.delete(u);
            });
        });

        farmerRegisterRequest = new RegisterRequest(
            "Ramanathan Farmer",
            "ramanathan@agrigrade.com",
            "+919876543210",
            "SecurePass123!",
            "FARMER",
            "Ramanathan Agro Farms",
            "Thanjavur"
        );
    }

    @Test
    @DisplayName("Registration - Successful Farmer Registration with Hashed Password")
    void testSuccessfulRegistration() {
        LoginResponse response = authService.register(farmerRegisterRequest);

        assertNotNull(response);
        assertNotNull(response.token());
        assertNotNull(response.refreshToken());
        assertNotNull(response.user());
        assertEquals("Ramanathan Farmer", response.user().fullName());
        assertEquals("ramanathan@agrigrade.com", response.user().email());
        assertTrue(response.user().roles().contains("FARMER"));

        User persistedUser = userRepository.findByEmailIgnoreCase("ramanathan@agrigrade.com").orElseThrow();
        assertNotEquals("SecurePass123!", persistedUser.getPasswordHash());
        assertTrue(persistedUser.getPasswordHash().startsWith("$2a$") || persistedUser.getPasswordHash().startsWith("$2b$"));
    }

    @Test
    @DisplayName("Registration - Fails on Duplicate Email")
    void testRegistrationFailsOnDuplicateEmail() {
        authService.register(farmerRegisterRequest);

        RegisterRequest duplicateRequest = new RegisterRequest(
            "Another Farmer",
            "ramanathan@agrigrade.com",
            "+919876543211",
            "Password456!",
            "FARMER",
            "Farm 2",
            "Madurai"
        );

        ApiException ex = assertThrows(ApiException.class, () -> authService.register(duplicateRequest));
        assertEquals("DUPLICATE_EMAIL", ex.getCode());
    }

    @Test
    @DisplayName("Registration - Fails on Duplicate Mobile")
    void testRegistrationFailsOnDuplicateMobile() {
        authService.register(farmerRegisterRequest);

        RegisterRequest duplicateMobileRequest = new RegisterRequest(
            "Another Farmer",
            "another@agrigrade.com",
            "+919876543210",
            "Password456!",
            "FARMER",
            "Farm 2",
            "Madurai"
        );

        ApiException ex = assertThrows(ApiException.class, () -> authService.register(duplicateMobileRequest));
        assertEquals("DUPLICATE_MOBILE", ex.getCode());
    }

    @Test
    @DisplayName("Login - Successful Login with Email & Password")
    void testSuccessfulLogin() {
        authService.register(farmerRegisterRequest);

        LoginRequest loginRequest = new LoginRequest("ramanathan@agrigrade.com", "SecurePass123!");
        LoginResponse response = authService.login(loginRequest);

        assertNotNull(response);
        assertNotNull(response.token());
        assertNotNull(response.refreshToken());
        assertEquals("ramanathan@agrigrade.com", response.user().email());
    }

    @Test
    @DisplayName("Login - Fails on Incorrect Password")
    void testLoginFailsOnIncorrectPassword() {
        authService.register(farmerRegisterRequest);

        LoginRequest loginRequest = new LoginRequest("ramanathan@agrigrade.com", "WrongPassword!");
        ApiException ex = assertThrows(ApiException.class, () -> authService.login(loginRequest));
        assertEquals("INVALID_CREDENTIALS", ex.getCode());
    }

    @Test
    @DisplayName("Login - Fails on Inactive User")
    void testLoginFailsOnInactiveUser() {
        authService.register(farmerRegisterRequest);

        User user = userRepository.findByEmailIgnoreCase("ramanathan@agrigrade.com").orElseThrow();
        user.setStatus("SUSPENDED");
        userRepository.save(user);

        LoginRequest loginRequest = new LoginRequest("ramanathan@agrigrade.com", "SecurePass123!");
        ApiException ex = assertThrows(ApiException.class, () -> authService.login(loginRequest));
        assertEquals("USER_DISABLED", ex.getCode());
    }

    @Test
    @DisplayName("Refresh Token - Successful Rotation")
    void testRefreshTokenRotation() {
        LoginResponse initialAuth = authService.register(farmerRegisterRequest);
        String oldRefreshToken = initialAuth.refreshToken();

        RefreshTokenRequest refreshRequest = new RefreshTokenRequest(oldRefreshToken);
        LoginResponse rotatedAuth = authService.refreshToken(refreshRequest);

        assertNotNull(rotatedAuth);
        assertNotNull(rotatedAuth.token());
        assertNotNull(rotatedAuth.refreshToken());
        assertNotEquals(oldRefreshToken, rotatedAuth.refreshToken());
    }

    @Test
    @DisplayName("Refresh Token - Revoked Token Reuse Family Compromise")
    void testRefreshTokenReuseCompromise() {
        LoginResponse initialAuth = authService.register(farmerRegisterRequest);
        String oldRefreshToken = initialAuth.refreshToken();

        // First refresh succeeds and revokes oldRefreshToken
        LoginResponse rotatedAuth = authService.refreshToken(new RefreshTokenRequest(oldRefreshToken));
        String secondRefreshToken = rotatedAuth.refreshToken();

        // Attempting to reuse oldRefreshToken must trigger reuse detection and revoke entire family
        ApiException ex = assertThrows(ApiException.class, () -> authService.refreshToken(new RefreshTokenRequest(oldRefreshToken)));
        assertEquals("REVOKED_REFRESH_TOKEN", ex.getCode());

        // Second token is now also revoked due to family compromise
        ApiException ex2 = assertThrows(ApiException.class, () -> authService.refreshToken(new RefreshTokenRequest(secondRefreshToken)));
        assertEquals("REVOKED_REFRESH_TOKEN", ex2.getCode());
    }

    @Test
    @DisplayName("OTP - Generation and Verification")
    void testOtpFlow() {
        LoginResponse regResponse = authService.register(farmerRegisterRequest);
        String destination = "+919876543210";
        String otp = otpService.generateAndSaveOtp(regResponse.user().id(), destination, "REGISTRATION");

        assertEquals("123456", otp);
        assertTrue(otpService.verifyOtp(destination, "REGISTRATION", "123456"));
    }

    @Test
    @DisplayName("OTP - Fails on Invalid OTP")
    void testOtpInvalidCode() {
        LoginResponse regResponse = authService.register(farmerRegisterRequest);
        String destination = "+919876543210";
        otpService.generateAndSaveOtp(regResponse.user().id(), destination, "REGISTRATION");

        ApiException ex = assertThrows(ApiException.class, () -> otpService.verifyOtp(destination, "REGISTRATION", "999999"));
        assertEquals("INVALID_OTP", ex.getCode());
    }

    @Test
    @DisplayName("User Profile - Get Current Profile")
    void testGetUserProfile() {
        LoginResponse regResponse = authService.register(farmerRegisterRequest);
        String publicId = regResponse.user().publicId();

        UserProfileResponse profile = authService.getCurrentUserProfile(publicId);
        assertNotNull(profile);
        assertEquals(publicId, profile.user().publicId());
        assertEquals("Ramanathan Farmer", profile.user().fullName());
    }
}
