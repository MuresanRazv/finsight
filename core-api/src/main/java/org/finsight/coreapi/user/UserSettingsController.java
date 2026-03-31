package org.finsight.coreapi.user;

import lombok.RequiredArgsConstructor;
import org.finsight.coreapi.user.UserSettingsDto;
import org.finsight.coreapi.user.UserSettingsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user/settings")
@RequiredArgsConstructor
public class UserSettingsController {

    private final UserSettingsService userSettingsService;

    @GetMapping
    public ResponseEntity<UserSettingsDto> getUserSettings(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userSettingsService.getUserSettings(userDetails.getUsername()));
    }

    @PutMapping
    public ResponseEntity<Void> updateUserSettings(@AuthenticationPrincipal UserDetails userDetails, @RequestBody UserSettingsDto settings) {
        userSettingsService.updateUserSettings(userDetails.getUsername(), settings);
        return ResponseEntity.ok().build();
    }
}
