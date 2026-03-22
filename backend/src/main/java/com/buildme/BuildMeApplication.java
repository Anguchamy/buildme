package com.buildme;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BuildMeApplication {

    private static final Logger log = LoggerFactory.getLogger(BuildMeApplication.class);

    public static void main(String[] args) {
        log.info("==> DB URL: {}", System.getenv("SUPABASE_DB_URL"));
        log.info("==> DB USER: {}", System.getenv("SUPABASE_DB_USER"));
        SpringApplication.run(BuildMeApplication.class, args);
    }
}
