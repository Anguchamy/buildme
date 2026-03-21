package com.buildme.service;

import com.buildme.dto.response.UserResponse;
import com.buildme.exception.CustomExceptions;
import com.buildme.model.User;
import com.buildme.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    }

    @Transactional(readOnly = true)
    public User getUserById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("User", id));
    }

    @Transactional(readOnly = true)
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("User not found: " + email));
    }

    @Transactional
    public UserResponse updateProfile(Long userId, String fullName, String avatarUrl) {
        User user = getUserById(userId);
        if (fullName != null && !fullName.isBlank()) {
            user.setFullName(fullName);
        }
        if (avatarUrl != null) {
            user.setAvatarUrl(avatarUrl);
        }
        User saved = userRepository.save(user);
        return toResponse(saved);
    }

    public UserResponse toResponse(User user) {
        return new UserResponse(
            user.getId(),
            user.getEmail(),
            user.getFullName(),
            user.getAvatarUrl(),
            user.getProvider(),
            user.isEmailVerified(),
            user.getCreatedAt()
        );
    }
}
