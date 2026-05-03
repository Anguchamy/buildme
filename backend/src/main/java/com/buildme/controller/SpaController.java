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

    /** Handles HEAD / used by Render health checks — returns 200 without body. */
    @RequestMapping(value = "/", method = RequestMethod.HEAD)
    @ResponseBody
    public ResponseEntity<Void> healthHead() {
        return ResponseEntity.ok().build();
    }
}
