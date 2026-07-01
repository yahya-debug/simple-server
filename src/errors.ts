// ============================================================
// Custom error classes, caught and mapped to HTTP statuses by
// errorMiddleware in middles.ts.
// ============================================================

// 400 - chirp body too long
export class TooLongErr extends Error {
    constructor(message: string) {
        super(message);
    }
}

// 401 - bad login credentials
export class NotAdminErr extends Error {
    constructor(message: string) {
        super(message);
    }
}

// 401 - missing/invalid/expired auth token
export class UnauthorizedErr extends Error {
    constructor(message: string) {
        super(message);
    }
}

// 403 - authenticated but not allowed to do this
export class ForbidenErr extends Error {
    constructor(message: string) {
        super(message);
    }
}

// 404 - resource doesn't exist
export class NotFoundErr extends Error {
    constructor(message: string) {
        super(message);
    }
}