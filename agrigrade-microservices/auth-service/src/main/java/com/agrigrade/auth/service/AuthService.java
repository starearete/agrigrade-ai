package com.agrigrade.auth.service;

import com.agrigrade.auth.dto.GoogleAuthRequest;
import com.agrigrade.auth.dto.LoginRequest;
import com.agrigrade.auth.dto.LoginResponse;
import com.agrigrade.auth.dto.RefreshTokenRequest;
import com.agrigrade.auth.dto.RegisterRequest;
import com.agrigrade.auth.dto.UserDto;
import com.agrigrade.auth.dto.UserProfileResponse;
import com.agrigrade.auth.entity.RefreshToken;
import com.agrigrade.auth.entity.Role;
import com.agrigrade.auth.entity.User;
import com.agrigrade.auth.repository.RefreshTokenRepository;
import com.agrigrade.auth.repository.RoleRepository;
import com.agrigrade.auth.repository.UserRepository;
import com.agrigrade.common.exception.ApiException;
import com.agrigrade.profile.entity.BuyerProfile;
import com.agrigrade.profile.entity.FarmerProfile;
import com.agrigrade.profile.repository.BuyerProfileRepository;
import com.agrigrade.profile.repository.FarmerProfileRepository;
import com.agrigrade.security.GoogleTokenVerifierService;
import com.agrigrade.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final FarmerProfileRepository farmerProfileRepository;
    private final BuyerProfileRepository buyerProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final GoogleTokenVerifierService googleTokenVerifierService;
    private final long refreshTokenExpirationMs;

    public AuthService(
        UserRepository userRepository,
        RoleRepository roleRepository,
        RefreshTokenRepository refreshTokenRepository,
        FarmerProfileRepository farmerProfileRepository,
        BuyerProfileRepository buyerProfileRepository,
        PasswordEncoder passwordEncoder,
        JwtTokenProvider jwtTokenProvider,
        GoogleTokenVerifierService googleTokenVerifierService,
        @Value("${app.jwt.refresh-expiration-ms:604800000}") long refreshTokenExpirationMs
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.farmerProfileRepository = farmerProfileRepository;
        this.buyerProfileRepository = buyerProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.googleTokenVerifierService = googleTokenVerifierService;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
    }

    @Transactional
    public LoginResponse register(RegisterRequest request) {
        if (StringUtils.hasText(request.email()) && userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ApiException(HttpStatus.CONFLICT, "DUPLICATE_EMAIL", "Email address is already registered.");
        }

        if (StringUtils.hasText(request.mobileNumber()) && userRepository.existsByMobileNumber(request.mobileNumber())) {
            throw new ApiException(HttpStatus.CONFLICT, "DUPLICATE_MOBILE", "Mobile number is already registered.");
        }

        String roleCode = request.role().toUpperCase();
        if (roleCode.startsWith("ROLE_")) {
            roleCode = roleCode.substring(5);
        }

        if ("ADMIN".equalsIgnoreCase(roleCode)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "ADMIN_REGISTRATION_FORBIDDEN", "Administrator accounts cannot be created through public registration.");
        }

        if (!"FARMER".equals(roleCode) && !"BUYER".equals(roleCode)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_ROLE", "Role must be FARMER or BUYER.");
        }

        String finalRoleCode = roleCode;
        Role role = roleRepository.findByCode(finalRoleCode)
            .orElseGet(() -> roleRepository.save(new Role(finalRoleCode, finalRoleCode, "System Role")));

        User user = new User();
        user.setFullName(request.fullName());
        user.setEmail(request.email());
        user.setMobileNumber(request.mobileNumber());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setStatus("ACTIVE");
        user.getRoles().add(role);

        User savedUser = userRepository.save(user);

        // Auto-provision base empty profile for user with generated code
        if ("BUYER".equalsIgnoreCase(finalRoleCode)) {
            BuyerProfile bp = new BuyerProfile();
            bp.setUserId(savedUser.getId());
            bp.setBuyerCode("BUYER-" + savedUser.getId());
            if (StringUtils.hasText(request.businessName())) {
                bp.setBusinessName(request.businessName());
            } else {
                bp.setBusinessName(savedUser.getFullName() + " Enterprise");
            }
            buyerProfileRepository.save(bp);
        } else if ("FARMER".equalsIgnoreCase(finalRoleCode)) {
            FarmerProfile fp = new FarmerProfile();
            fp.setUserId(savedUser.getId());
            fp.setFarmerCode("FARMER-" + savedUser.getId());
            farmerProfileRepository.save(fp);
        }

        return createAuthResponse(savedUser);
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        String identifier = request.emailOrMobile();
        User user = userRepository.findFirstByEmailIgnoreCaseOrMobileNumber(identifier, identifier)
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Invalid email/mobile or password."));

        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Invalid email/mobile or password.");
        }

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "USER_DISABLED", "User account is suspended or inactive.");
        }

        return createAuthResponse(user);
    }

    @Transactional
    public LoginResponse loginWithGoogle(GoogleAuthRequest request) {
        if (request == null || !StringUtils.hasText(request.credential())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "MISSING_CREDENTIAL", "Google credential is required.");
        }

        // 1. Cryptographically verify Google ID token
        GoogleTokenVerifierService.GoogleUserInfo googleUser = googleTokenVerifierService.verify(request.credential());

        String googleSub = googleUser.subject();
        String verifiedEmail = googleUser.email();
        String name = googleUser.name();
        String pictureUrl = googleUser.pictureUrl();

        // 2. Check if user already exists by Google Subject ID
        Optional<User> existingGoogleUser = userRepository.findByGoogleSubjectId(googleSub);
        if (existingGoogleUser.isPresent()) {
            User user = existingGoogleUser.get();
            if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "USER_DISABLED", "User account is suspended or inactive.");
            }
            if (pictureUrl != null && user.getProfilePictureUrl() == null) {
                user.setProfilePictureUrl(pictureUrl);
                userRepository.save(user);
            }
            return createAuthResponse(user);
        }

        // 3. Check if user exists by verified email (Safely link Google account)
        Optional<User> existingEmailUser = userRepository.findFirstByEmailIgnoreCase(verifiedEmail);
        if (existingEmailUser.isPresent()) {
            User user = existingEmailUser.get();
            if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "USER_DISABLED", "User account is suspended or inactive.");
            }
            // Safely link Google identity to existing local account without modifying existing data
            user.setGoogleSubjectId(googleSub);
            if (user.getProfilePictureUrl() == null && pictureUrl != null) {
                user.setProfilePictureUrl(pictureUrl);
            }
            User saved = userRepository.save(user);
            return createAuthResponse(saved);
        }

        // 4. Create new Google user
        String requestedRole = (request.role() != null && StringUtils.hasText(request.role()))
            ? request.role().toUpperCase().trim()
            : "FARMER";

        if (requestedRole.startsWith("ROLE_")) {
            requestedRole = requestedRole.substring(5);
        }

        // Public Google registration can NEVER self-assign ADMIN
        if ("ADMIN".equalsIgnoreCase(requestedRole)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "FORBIDDEN_ROLE", "ADMIN role cannot be self-assigned via Google registration.");
        }

        if (!"FARMER".equalsIgnoreCase(requestedRole) && !"BUYER".equalsIgnoreCase(requestedRole)) {
            requestedRole = "FARMER";
        }

        String finalRoleCode = requestedRole;
        Role role = roleRepository.findByCode(finalRoleCode)
            .orElseGet(() -> roleRepository.save(new Role(finalRoleCode, finalRoleCode, "System Role")));

        User newUser = new User();
        newUser.setFullName(name);
        newUser.setEmail(verifiedEmail);
        newUser.setAuthProvider("GOOGLE");
        newUser.setGoogleSubjectId(googleSub);
        newUser.setProfilePictureUrl(pictureUrl);
        newUser.setPasswordHash(null);
        newUser.setStatus("ACTIVE");
        newUser.getRoles().add(role);

        User savedNewUser = userRepository.save(newUser);

        // Auto-provision corresponding profile for the new user
        if ("BUYER".equalsIgnoreCase(finalRoleCode)) {
            BuyerProfile bp = new BuyerProfile();
            bp.setUserId(savedNewUser.getId());
            bp.setBuyerCode("BUYER-" + savedNewUser.getId());
            bp.setBusinessName(StringUtils.hasText(request.businessName()) ? request.businessName() : null);
            buyerProfileRepository.save(bp);
        } else {
            FarmerProfile fp = new FarmerProfile();
            fp.setUserId(savedNewUser.getId());
            fp.setFarmerCode("FARMER-" + savedNewUser.getId());
            farmerProfileRepository.save(fp);
        }

        return createAuthResponse(savedNewUser);
    }

    @Transactional
    public LoginResponse refreshToken(RefreshTokenRequest request) {
        String rawToken = request.refreshToken();
        String tokenHash = hashToken(rawToken);

        RefreshToken token = refreshTokenRepository.findByTokenHash(tokenHash)
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_REFRESH_TOKEN", "Invalid refresh token."));

        if (Boolean.TRUE.equals(token.getIsRevoked())) {
            // REUSE DETECTED: Revoke all tokens in family ID for security
            if (StringUtils.hasText(token.getFamilyId())) {
                List<RefreshToken> familyTokens = refreshTokenRepository.findByFamilyId(token.getFamilyId());
                for (RefreshToken ft : familyTokens) {
                    ft.setIsRevoked(true);
                    ft.setRevokedAt(LocalDateTime.now());
                }
                refreshTokenRepository.saveAll(familyTokens);
            }
            throw new ApiException(HttpStatus.UNAUTHORIZED, "REVOKED_REFRESH_TOKEN", "Refresh token reuse detected. Revoked token family.");
        }

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            token.setIsRevoked(true);
            token.setRevokedAt(LocalDateTime.now());
            refreshTokenRepository.save(token);
            throw new ApiException(HttpStatus.UNAUTHORIZED, "EXPIRED_REFRESH_TOKEN", "Refresh token has expired.");
        }

        User user = userRepository.findById(token.getUserId())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found."));

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "USER_DISABLED", "User account is suspended or inactive.");
        }

        // Revoke current token
        token.setIsRevoked(true);
        token.setRevokedAt(LocalDateTime.now());

        // Create rotated replacement token in same family
        String newRawRefreshToken = UUID.randomUUID().toString();
        String newTokenHash = hashToken(newRawRefreshToken);

        RefreshToken newToken = new RefreshToken();
        newToken.setUserId(user.getId());
        newToken.setTokenHash(newTokenHash);
        newToken.setFamilyId(token.getFamilyId() != null ? token.getFamilyId() : UUID.randomUUID().toString());
        newToken.setExpiresAt(LocalDateTime.now().plusNanos(refreshTokenExpirationMs * 1_000_000L));
        newToken.setIsRevoked(false);

        RefreshToken savedNewToken = refreshTokenRepository.save(newToken);
        token.setReplacedByTokenId(savedNewToken.getId());
        refreshTokenRepository.save(token);

        List<String> roles = (user.getRoles() != null && !user.getRoles().isEmpty())
            ? user.getRoles().stream().filter(java.util.Objects::nonNull).map(Role::getCode).filter(java.util.Objects::nonNull).toList()
            : List.of();
        
        if (roles.isEmpty()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "NO_ROLE_ASSIGNED", "User has no system roles assigned.");
        }

        String publicId = user.getPublicId() != null ? user.getPublicId() : UUID.randomUUID().toString();
        String accessToken = jwtTokenProvider.generateAccessToken(publicId, roles);

        return new LoginResponse(accessToken, newRawRefreshToken, mapToUserDto(user));
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUserProfile(String publicId) {
        User user = userRepository.findByPublicId(publicId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User profile not found."));

        return new UserProfileResponse(mapToUserDto(user));
    }

    private LoginResponse createAuthResponse(User user) {
        List<String> roles = (user.getRoles() != null && !user.getRoles().isEmpty())
            ? user.getRoles().stream().filter(java.util.Objects::nonNull).map(Role::getCode).filter(java.util.Objects::nonNull).toList()
            : List.of();

        if (roles.isEmpty()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "NO_ROLE_ASSIGNED", "User has no system roles assigned.");
        }

        String publicId = user.getPublicId() != null ? user.getPublicId() : UUID.randomUUID().toString();
        String accessToken = jwtTokenProvider.generateAccessToken(publicId, roles);

        String rawRefreshToken = UUID.randomUUID().toString();
        String refreshTokenHash = hashToken(rawRefreshToken);

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUserId(user.getId());
        refreshToken.setTokenHash(refreshTokenHash);
        refreshToken.setFamilyId(UUID.randomUUID().toString());
        refreshToken.setExpiresAt(LocalDateTime.now().plusNanos(refreshTokenExpirationMs * 1_000_000L));
        refreshToken.setIsRevoked(false);

        refreshTokenRepository.save(refreshToken);

        return new LoginResponse(accessToken, rawRefreshToken, mapToUserDto(user));
    }

    public UserDto mapToUserDto(User user) {
        List<String> roles = (user.getRoles() != null && !user.getRoles().isEmpty())
            ? user.getRoles().stream().filter(java.util.Objects::nonNull).map(Role::getCode).filter(java.util.Objects::nonNull).toList()
            : List.of();

        String createdAtStr = user.getCreatedAt() != null
            ? user.getCreatedAt().format(DateTimeFormatter.ISO_DATE_TIME)
            : LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME);

        return new UserDto(
            user.getId(),
            user.getPublicId(),
            user.getFullName(),
            user.getEmail(),
            user.getMobileNumber(),
            user.getStatus() != null ? user.getStatus() : "ACTIVE",
            roles,
            Boolean.TRUE.equals(user.getProfileCompleted()),
            user.getPreferredLanguage() != null ? user.getPreferredLanguage() : "en",
            user.getPreferredTheme() != null ? user.getPreferredTheme() : "LIGHT",
            createdAtStr
        );
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm unavailable", e);
        }
    }
}
