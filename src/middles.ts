// ============================================================
// Express middlewares, grouped by topic:
//   - Request logging / metrics  (middleCheck, serverHits)
//   - Body parsing               (parser)
//   - Error handling             (errorMiddleware)
//   - Chirp validation           (validate_chirp)
// ============================================================
import { NextFunction, Request, Response } from "express";
import { config } from "./config.js";
import { ForbidenErr, NotAdminErr, NotFoundErr, TooLongErr, UnauthorizedErr } from "./errors.js";

// ---- Request logging ----
// Logs any non-200 response after it's sent.
export function middleCheck(req: Request, res: Response, next: NextFunction): void {
    res.on("finish", () => {
        if (res.statusCode != 200)
            console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${res.statusCode}`);

    })
    next();
}
// ---- Request metrics ----
// Counts every hit to the /app static site.
export function serverHits(req: Request, res: Response, next: NextFunction): void {
    config.fileserverhits++;
    next();
}
// ---- Body parsing ----
// Manual JSON body parser (kept for reference; app currently uses express.json()).
export function parser(req: Request, res: Response, next: NextFunction): void {
    var sb: string = "";
    req.on('data', (chunk) => sb += chunk);
    req.on('end', () => {
        try {
            req.body = JSON.parse(sb);
        } catch (err) {
            res.status(400).send(JSON.stringify({"error": "Something went wrong"}));
        }
        next();
    })
}

// ---- Error handling ----
// Central error handler: maps custom error classes to HTTP status codes.
export function errorMiddleware(err: Error, req: Request, res: Response, next: NextFunction): void {
    console.log(err.message);
    if (err instanceof TooLongErr) {
        res.status(400).json({
            error: err.message
        });
        next();
        return
    } else if (err instanceof ForbidenErr) {
        res.status(403).json({
            error: err.message
        });
        next();
        return
    } else if (err instanceof NotAdminErr || err instanceof UnauthorizedErr) {
        res.status(401).json({
            error: err.message
        })
        next();
        return;
    } else if (err instanceof NotFoundErr) {
        res.status(404).json({
            error: err.message
        })
        next();
        return
    }
    res.status(500).json({
        dd: "dsd",
        error: err.message
    });
    next();
}



// ---- Chirp validation ----
// Rejects chirps over 140 chars, censors a few banned words otherwise.
export function validate_chirp(req: Request, res: Response, next: NextFunction) {
    console.log("ddd");
    if (req.body.body.length > 140) {
        throw new TooLongErr("Chirp is too long. Max length is 140");
    } else {
        const cleaned = (req.body.body as string).replace(/kerfuffle|sharbert|fornax/gi, '****');
        req.body.body = cleaned;
    }
    next();
}