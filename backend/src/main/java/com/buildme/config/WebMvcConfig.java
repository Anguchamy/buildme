package com.buildme.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${app.upload.local-dir:${user.home}/buildme-uploads}")
    private String localUploadDir;

    @PostConstruct
    public void ensureUploadDirExists() throws Exception {
        Path dir = Paths.get(localUploadDir);
        if (!Files.exists(dir)) {
            Files.createDirectories(dir);
        }
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Only register for /static/uploads/** — never overlaps with /api/**
        registry.addResourceHandler("/static/uploads/**")
            .addResourceLocations("file:" + localUploadDir + "/")
            .setCachePeriod(3600);
    }
}
