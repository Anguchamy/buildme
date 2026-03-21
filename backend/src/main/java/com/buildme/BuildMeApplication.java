package com.buildme;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BuildMeApplication {

    public static void main(String[] args) {
        SpringApplication.run(BuildMeApplication.class, args);
    }
}
