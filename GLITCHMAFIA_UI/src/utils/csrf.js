/**
 * csrf.js — Shared CSRF token utility
 * 
 * Django sets a `csrftoken` cookie on any GET response from a view decorated
 * with @ensure_csrf_cookie (GET /api/csrf/).
 * 
 * Call getCsrfToken() and pass the result as the 'X-CSRFToken' header on all
 * mutating requests (POST, PUT, PATCH, DELETE).
 * 
 * Usage:
 *   import { getCsrfToken } from '../utils/csrf';
 *   fetch('/api/...', {
 *     method: 'POST',
 *     credentials: 'include',
 *     headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrfToken() },
 *     body: JSON.stringify(payload),
 *   });
 */

export function getCsrfToken() {
    const match = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='));
    return match ? match.split('=')[1] : '';
}

/**
 * Convenience wrapper — POST with CSRF + JSON body.
 * Returns the parsed JSON response.
 */
export async function postJson(url, body = {}) {
    const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
        },
        body: JSON.stringify(body),
    });
    return response.json();
}
