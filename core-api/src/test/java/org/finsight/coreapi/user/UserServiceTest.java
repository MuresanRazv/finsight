package org.finsight.coreapi.user;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(1)
                .firstname("John")
                .lastname("Doe")
                .email("john.doe@example.com")
                .password("password")
                .role(Role.USER)
                .build();
    }

    @Test
    void getUserById_ShouldReturnUser_WhenUserExists() {
        when(userRepository.findById(1)).thenReturn(Optional.of(user));

        User result = userService.getUserById(1);

        assertThat(result).isEqualTo(user);
        verify(userRepository).findById(1);
    }

    @Test
    void getUserById_ShouldThrowException_WhenUserDoesNotExist() {
        when(userRepository.findById(1)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserById(1))
                .isInstanceOf(UserNotFoundException.class)
                .hasMessageContaining("User not found with id: 1");
    }

    @Test
    void getUserByEmail_ShouldReturnUser_WhenUserExists() {
        when(userRepository.findByEmail("john.doe@example.com")).thenReturn(Optional.of(user));

        User result = userService.getUserByEmail("john.doe@example.com");

        assertThat(result).isEqualTo(user);
        verify(userRepository).findByEmail("john.doe@example.com");
    }

    @Test
    void getUserByEmail_ShouldThrowException_WhenUserDoesNotExist() {
        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserByEmail("nonexistent@example.com"))
                .isInstanceOf(UserNotFoundException.class)
                .hasMessageContaining("User not found with email: nonexistent@example.com");
    }

    @Test
    void updateUser_ShouldUpdateUser_WhenUserExists() {
        UserDto userDto = new UserDto("Jane", "Smith", "jane.smith@example.com", Role.USER);
        when(userRepository.findByEmail("john.doe@example.com")).thenReturn(Optional.of(user));

        userService.updateUser("john.doe@example.com", userDto);

        assertThat(user.getFirstname()).isEqualTo("Jane");
        assertThat(user.getLastname()).isEqualTo("Smith");
        verify(userRepository).save(user);
    }

    @Test
    void changePassword_ShouldUpdatePassword_WhenUserExists() {
        when(userRepository.findByEmail("john.doe@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("newPassword")).thenReturn("encodedPassword");

        userService.changePassword("john.doe@example.com", "newPassword");

        assertThat(user.getPassword()).isEqualTo("encodedPassword");
        verify(userRepository).save(user);
    }

    @Test
    void deleteUser_ShouldDeleteUser_WhenUserExists() {
        when(userRepository.findByEmail("john.doe@example.com")).thenReturn(Optional.of(user));

        userService.deleteUser("john.doe@example.com");

        verify(userRepository).delete(user);
    }
}
