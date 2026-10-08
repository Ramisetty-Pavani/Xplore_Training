package com.example.connecthub.service;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.example.connecthub.entity.User;
import com.example.connecthub.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    @Test
    void createUserHashesPasswordBeforeSaving() {
        when(userRepository.save(any(User.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        User user = new User(null, "Alex Morgan", "alex@example.com", "securePassword1", "Hello!");

        User createdUser = userService.createUser(user);

        assertNotEquals("securePassword1", createdUser.getPassword());
        assertTrue(new BCryptPasswordEncoder().matches("securePassword1", createdUser.getPassword()));
    }
}
