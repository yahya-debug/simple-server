import { NextFunction, Request, Response } from "express";
import { config } from "./config.js";
import { TooLongErr } from "./errors.js";

export function middleCheck(req: Request, res: Response, next: NextFunction): void {
    res.on("finish", () => {
        if (res.statusCode != 200)
            console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${res.statusCode}`);

    })
    next();
}
export function serverHits(req: Request, res: Response, next: NextFunction): void {
    config.fileserverhits++;
    next();
}
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

export function errorMiddleware(err: Error, req: Request, res: Response, next: NextFunction): void {
    console.log(err.message);
    if (err instanceof TooLongErr) {
        res.status(400).json({
            error: err.message
        });
        next();
        return
    }
    res.status(500).json({
        error: err.message
    });
    next();
}