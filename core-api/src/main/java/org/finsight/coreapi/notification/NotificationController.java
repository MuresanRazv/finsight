package org.finsight.coreapi.notification;

import lombok.RequiredArgsConstructor;
import org.finsight.coreapi.user.User;
import org.finsight.coreapi.notification.NotificationDto;
import org.finsight.coreapi.notification.NotificationService;
import org.finsight.coreapi.user.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<NotificationDto>> getUserNotifications(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(notificationService.getUserNotifications(user));
    }

    @GetMapping("/unread")
    public ResponseEntity<List<NotificationDto>> getUnreadUserNotifications(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(notificationService.getUnreadUserNotifications(user));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@AuthenticationPrincipal UserDetails userDetails, @PathVariable Integer id) {
        User user = userService.getUserByEmail(userDetails.getUsername());
        notificationService.markAsRead(id, user);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.getUserByEmail(userDetails.getUsername());
        notificationService.markAllAsRead(user);
        return ResponseEntity.ok().build();
    }
}
