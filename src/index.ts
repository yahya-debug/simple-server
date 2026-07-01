import express, { NextFunction, Request, Response } from "express"
import { config } from "./config.js";
import { errorMiddleware, middleCheck, serverHits } from "./middles.js";
import { TooLongErr } from "./errors.js";

const app = express();

app.use('/app', serverHits);
app.use('/app', express.static('./src/app/'));
app.use(middleCheck);
app.use(express.json());

app.get('/admin/metrics', (req, res) => {
    res.set({ 'Content-Type': 'text/html; charset=utf-8' });
    res.send(`<html>
        <body>
        <h1>Welcome, Chirpy Admin</h1>
        <p>Chirpy has been visited ${config.fileserverhits} times!</p>
        </body>
        </html>`);
})
app.get("/api/healthz", (req, res) => {
    res.set({ 'Content-Type': 'text/plain; charset=utf-8' });
    res.send("OK");
})
app.post('/admin/reset', (req: Request, res: Response) => {
    config.fileserverhits = 0;
    res.end();
})

app.post('/api/validate_chirp', (req, res) => {
    if (req.body.body.length > 140) {
        throw new TooLongErr("Chirp is too long. Max length is 140");
    } else {
        const cleaned = (req.body.body as string).replace(/kerfuffle|sharbert|fornax/gi, '****');
        res.status(200).send(JSON.stringify({"cleanedBody": cleaned}));
    }
})

app.use(errorMiddleware);

app.listen(8080, () => console.log("Hey"));