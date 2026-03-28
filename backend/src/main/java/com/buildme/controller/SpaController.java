package com.buildme.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Forwards all non-API, non-static routes to index.html for React SPA routing.
 */
@Controller
public class SpaController {

    @RequestMapping(value = { "/app", "/app/**", "/login", "/register" })
    public String forward() {
        return "forward:/index.html";
    }
}
