package org.finsight.coreapi.user;

import lombok.RequiredArgsConstructor;
import org.finsight.coreapi.user.User;
import org.finsight.coreapi.user.ChangePasswordDto;
import org.finsight.coreapi.user.UserDto;
import org.finsight.coreapi.user.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUserById(@PathVariable Integer id) {
        User user = userService.getUserById(id);
        return ResponseEntity.ok(new UserDto(user.getFirstname(), user.getLastname(), user.getEmail(), user.getRole()));
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(new UserDto(user.getFirstname(), user.getLastname(), user.getEmail(), user.getRole()));
    }

    @PutMapping("/me")
    public ResponseEntity<Void> updateUser(@AuthenticationPrincipal UserDetails userDetails, @RequestBody UserDto userDto) {
        userService.updateUser(userDetails.getUsername(), userDto);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/change-password")
    public ResponseEntity<Void> changePassword(@AuthenticationPrincipal UserDetails userDetails, @RequestBody ChangePasswordDto changePasswordDto) {
        userService.changePassword(userDetails.getUsername(), changePasswordDto.newPassword());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteUser(@AuthenticationPrincipal UserDetails userDetails) {
        userService.deleteUser(userDetails.getUsername());
        return ResponseEntity.ok().build();
    }
}
