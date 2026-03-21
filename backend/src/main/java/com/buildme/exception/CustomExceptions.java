package com.buildme.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

public class CustomExceptions {

    @ResponseStatus(HttpStatus.NOT_FOUND)
    public static class ResourceNotFoundException extends RuntimeException {
        public ResourceNotFoundException(String message) {
            super(message);
        }
        public ResourceNotFoundException(String resource, Long id) {
            super(resource + " not found with id: " + id);
        }
    }

    @ResponseStatus(HttpStatus.FORBIDDEN)
    public static class AccessDeniedException extends RuntimeException {
        public AccessDeniedException(String message) {
            super(message);
        }
        public AccessDeniedException() {
            super("Access denied");
        }
    }

    @ResponseStatus(HttpStatus.CONFLICT)
    public static class DuplicateResourceException extends RuntimeException {
        public DuplicateResourceException(String message) {
            super(message);
        }
    }

    @ResponseStatus(HttpStatus.PAYMENT_REQUIRED)
    public static class PlanLimitException extends RuntimeException {
        public PlanLimitException(String message) {
            super(message);
        }
    }

    @ResponseStatus(HttpStatus.BAD_GATEWAY)
    public static class ExternalApiException extends RuntimeException {
        public ExternalApiException(String message) {
            super(message);
        }
        public ExternalApiException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public static class InvalidTokenException extends RuntimeException {
        public InvalidTokenException(String message) {
            super(message);
        }
    }
}
