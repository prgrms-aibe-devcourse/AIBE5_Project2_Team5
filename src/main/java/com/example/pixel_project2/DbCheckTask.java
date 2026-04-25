package com.example.pixel_project2;

import com.example.pixel_project2.notification.repository.NotificationRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DbCheckTask implements CommandLineRunner {
    private final NotificationRepository notificationRepository;

    public DbCheckTask(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Override
    public void run(String... args) {
        long count = notificationRepository.count();
        System.out.println("DEBUG_DB: Current notification count = " + count);
        notificationRepository.findAll().forEach(n -> 
            System.out.println("DEBUG_DB: Notification id=" + n.getId() + ", receiver=" + n.getReceiver().getId() + ", type=" + n.getType())
        );
    }
}
