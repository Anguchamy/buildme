package com.buildme.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

/**
 * Forwards all non-API, non-static routes to index.html for React SPA routing.
 */
@Controller
public class SpaController {

    @RequestMapping(value = { "/app", "/app/**", "/login", "/register", "/verify-email" })
    public String forward() {
        return "forward:/index.html";
    }

    /**
     * Health probe for `/`. Accept both HEAD (Render's default) and GET — without
     * the GET handler, anything that probes with GET (browsers visiting the bare
     * hostname, default curl, some uptime checkers) gets a noisy 405 logged.
     */
    @RequestMapping(value = "/", method = { RequestMethod.HEAD, RequestMethod.GET })
    @ResponseBody
    public ResponseEntity<Void> healthRoot() {
        return ResponseEntity.ok().build();
    }
}
