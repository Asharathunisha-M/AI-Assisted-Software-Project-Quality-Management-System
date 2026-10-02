package com.asharathunisha.projectmanagement.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.HttpRequestMethodNotSupportedException;

import java.util.HashMap;
import java.util.Map;

/**
 * Central error handler.
 *
 * Purpose (P0 fixes only, nothing else touched):
 * 1. Prevent raw stack traces (like the PUT 405 trace you saw earlier)
 *    from being sent to the client.
 * 2. Turn a delete-with-dependent-records failure into a clean,
 *    understandable 409 response instead of an unhandled 500.
 *
 * This does NOT change any existing controller/service behavior —
 * it only wraps errors that were previously unhandled.
 */
@ControllerAdvice
public class GlobalExceptionHandler {

    // Thrown when deleting a row that other rows still reference
    // (e.g. deleting a Project that still has Requirements/Tasks/
    // Milestones/TestCases/Bugs pointing to it).
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrityViolation(
            DataIntegrityViolationException ex) {

        Map<String, Object> body = new HashMap<>();
        body.put("status", 409);
        body.put("error", "Conflict");
        body.put(
                "message",
                "This item cannot be deleted because other records " +
                        "(requirements, tasks, milestones, test cases, or bugs) " +
                        "are still linked to it. Remove those first, then try again."
        );

        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    // Wrong HTTP method on a valid path (this is exactly the
    // "PUT not supported" error from earlier).
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Map<String, Object>> handleMethodNotSupported(
            HttpRequestMethodNotSupportedException ex) {

        Map<String, Object> body = new HashMap<>();
        body.put("status", 405);
        body.put("error", "Method Not Allowed");
        body.put("message", "Method '" + ex.getMethod() + "' is not supported for this endpoint.");

        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(body);
    }

    // Catch-all safety net so nothing else leaks a raw stack trace.
    // Does not change status codes that controllers already set
    // correctly — only covers what would otherwise be an unhandled 500.
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {

        Map<String, Object> body = new HashMap<>();
        body.put("status", 500);
        body.put("error", "Internal Server Error");
        body.put("message", "Something went wrong. Please try again.");

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}