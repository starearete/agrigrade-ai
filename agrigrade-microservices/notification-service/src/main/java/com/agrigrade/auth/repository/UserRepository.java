package com.agrigrade.auth.repository;

import com.agrigrade.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findFirstByEmailIgnoreCase(String email);

    Optional<User> findByGoogleSubjectId(String googleSubjectId);

    Optional<User> findByMobileNumber(String mobileNumber);

    Optional<User> findByEmailIgnoreCaseOrMobileNumber(String email, String mobileNumber);

    Optional<User> findFirstByEmailIgnoreCaseOrMobileNumber(String email, String mobileNumber);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByGoogleSubjectId(String googleSubjectId);

    boolean existsByMobileNumber(String mobileNumber);

    Optional<User> findByPublicId(String publicId);
}
