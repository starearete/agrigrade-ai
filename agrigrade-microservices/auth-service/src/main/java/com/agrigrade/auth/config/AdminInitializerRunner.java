package com.agrigrade.auth.config;

import com.agrigrade.auth.entity.Role;
import com.agrigrade.auth.entity.User;
import com.agrigrade.auth.repository.RoleRepository;
import com.agrigrade.auth.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Component
public class AdminInitializerRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminInitializerRunner.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminInitializerRunner(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("Verifying initial administrator account provisioning...");

        String adminEmail = "starearete@gmail.com";
        Role adminRole = roleRepository.findByCode("ADMIN")
                .orElseGet(() -> roleRepository.save(new Role("ADMIN", "Platform Administrator", "System governor")));

        User admin = userRepository.findByEmailIgnoreCase(adminEmail).orElse(null);

        if (admin == null) {
            log.info("Provisioning initial administrator account ({})", adminEmail);
            admin = new User();
            admin.setPublicId(UUID.randomUUID().toString());
            admin.setFullName("AgriGrade Administrator");
            admin.setEmail(adminEmail);
            admin.setMobileNumber("+919876543210");
            admin.setPasswordHash(passwordEncoder.encode("natshathra"));
            admin.setStatus("ACTIVE");
            admin.getRoles().add(adminRole);
            userRepository.save(admin);
            log.info("Successfully provisioned administrator account ({}) with BCrypt password hash.", adminEmail);
        } else {
            boolean hasAdminRole = admin.getRoles().stream().anyMatch(r -> "ADMIN".equalsIgnoreCase(r.getCode()));
            if (!hasAdminRole) {
                admin.getRoles().add(adminRole);
            }
            if (!passwordEncoder.matches("natshathra", admin.getPasswordHash())) {
                admin.setPasswordHash(passwordEncoder.encode("natshathra"));
            }
            admin.setStatus("ACTIVE");
            userRepository.save(admin);
            log.info("Administrator account ({}) verified and active.", adminEmail);
        }
    }
}
