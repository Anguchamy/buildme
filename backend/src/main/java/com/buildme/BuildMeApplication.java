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

    @Value("${spring.datasource.url:MISSING}")
    private String dbUrl;

    @Value("${spring.datasource.username:MISSING}")
    private String dbUser;

    @Value("${app.jwt.secret:MISSING}")
    private String jwtSecret;

    @Value("${app.r2.account-id:MISSING}")
    private String r2AccountId;

    @Value("${app.r2.bucket:MISSING}")
    private String r2Bucket;

    @Value("${app.r2.public-url:MISSING}")
    private String r2PublicUrl;

    @Value("${app.frontend.url:MISSING}")
    private String frontendUrl;

    public static void main(String[] args) {
        SpringApplication.run(BuildMeApplication.class, args);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void logConfig() {
        log.info("========== RESOLVED CONFIG ==========");
        log.info("DB URL     : {}", dbUrl);
        log.info("DB USER    : {}", dbUser);
        log.info("JWT SECRET : {}", jwtSecret.isBlank() ? "EMPTY" : "[SET, length=" + jwtSecret.length() + "]");
        log.info("R2 ACCOUNT : {}", r2AccountId);
        log.info("R2 BUCKET  : {}", r2Bucket);
        log.info("R2 URL     : {}", r2PublicUrl);
        log.info("FRONTEND   : {}", frontendUrl);
        log.info("=====================================");
    }
}
