package com.buildme.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Forwards all non-API, non-static routes to index.html so React Router works.
 */
@Controller
public class SpaController {

    @RequestMapping(value = {
        "/login",
        "/register",
        "/app",
        "/app/**"
    })
    public String spa() {
        return "forward:/index.html";
    }
}
