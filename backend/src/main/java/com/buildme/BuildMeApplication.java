package com.buildme;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BuildMeApplication {

    private static final Logger log = LoggerFactory.getLogger(BuildMeApplication.class);

    @Value("${spring.datasource.url}")
    private String dbUrl;

    @Value("${spring.datasource.username}")
    private String dbUser;

    public static void main(String[] args) {
        SpringApplication.run(BuildMeApplication.class, args);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void logConfig() {
        log.info("==> DB URL: {}", dbUrl);
        log.info("==> DB USER: {}", dbUser);
    }
}
