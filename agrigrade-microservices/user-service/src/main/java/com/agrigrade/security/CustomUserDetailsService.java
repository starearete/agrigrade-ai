package com.agrigrade.security;

import com.agrigrade.auth.entity.Role;
import com.agrigrade.auth.entity.User;
import com.agrigrade.auth.repository.UserRepository;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        User user = userRepository.findByPublicId(identifier)
            .or(() -> userRepository.findByEmailIgnoreCaseOrMobileNumber(identifier, identifier))
            .orElseThrow(() -> new UsernameNotFoundException("User not found with identifier: " + identifier));

        List<GrantedAuthority> authorities = user.getRoles().stream()
            .map(Role::getCode)
            .map(code -> code.startsWith("ROLE_") ? code : "ROLE_" + code)
            .map(SimpleGrantedAuthority::new)
            .collect(Collectors.toList());

        boolean enabled = "ACTIVE".equalsIgnoreCase(user.getStatus());

        return org.springframework.security.core.userdetails.User.builder()
            .username(user.getPublicId())
            .password(user.getPasswordHash() != null ? user.getPasswordHash() : "")
            .authorities(authorities)
            .disabled(!enabled)
            .accountExpired(false)
            .accountLocked(false)
            .credentialsExpired(false)
            .build();
    }
}
