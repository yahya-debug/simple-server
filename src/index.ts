// ============================================================
// Chirpy API server entrypoint
// Route groups in this file (order as they appear below):
//   - Admin routes        (/admin/metrics, /admin/reset)
//   - Health check        (/api/healthz)
//   - User routes         (/api/users)
//   - Auth routes         (/api/login, /api/refresh, /api/revoke)
//   - Chirp routes        (/api/chirps, /api/chirps/:chirpID)
//   - Webhook routes      (/api/polka/webhooks)
// ============================================================
import express, { NextFunction, Request, Response } from "express"
import { config } from "./config.js";
import { errorMiddleware, middleCheck, serverHits, validate_chirp } from "./middles.js";
import { ForbidenErr, NotAdminErr, NotFoundErr, TooLongErr, UnauthorizedErr } from "./errors.js";
import { createUser, deleteAll, getUser, updateUser, User_inApp } from "./db/queries/users.js";
import { createChirp, deleteChirp, getChirps } from "./db/queries/chirps.js";
import { checkPasswordHash, getAPIKey, getBearerToken, getRefreshToken, hashPassword, makeJWT, makeRefreshToken, revokeToken, saveTok, validateJWT } from "./auth.js";

const app = express();

app.use('/app', serverHits);
app.use('/app', express.static('./src/app/'));
app.use(middleCheck);
app.use(express.json());

// ---- Admin routes ----
// Shows how many times the /app static site has been hit.
app.get('/admin/metrics', (req, res) => {
    res.set({ 'Content-Type': 'text/html; charset=utf-8' });
    res.send(`<html>
        <body>
        <h1>Welcome, Chirpy Admin</h1>
        <p>Chirpy has been visited ${config.fileserverhits} times!</p>
        </body>
        </html>`);
})
// ---- Admin routes ----
// Dev-only: wipes all users (and their chirps/tokens via cascade).
app.post('/admin/reset', async (req: Request, res: Response) => {
    if (config.platform != 'dev') {
        throw new ForbidenErr("403 Forbidden");
    } else {
        await deleteAll();
        res.status(200).send();
    }
})

// ---- Health check route ----
app.get("/api/healthz", (req, res) => {
    res.set({ 'Content-Type': 'text/plain; charset=utf-8' });
    res.send("OK");
})

// ---- User routes ----
// Create a new user account.
app.post('/api/users', async (req, res) => {
    const {email, password} = req.body;
    const created = await createUser({email: email, password: await hashPassword(password)});
    res.status(201).send(created);
})

// ---- User routes ----
// Update the logged-in user's email/password.
app.put('/api/users', async (req, res) => {
    const {email, password} = req.body;
    const token = getBearerToken(req);
    const id = validateJWT(token, config.secret);
    if (!id)
        throw new UnauthorizedErr("Not allowed to do that")

    const data = await updateUser(id, {email: email, password: await hashPassword(password)})
    res.status(200).send({
        id: data.id,
        email: data.email,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        isChirpyRed: data.is_chirpy_red
    })
})

// ---- Auth routes ----
// Verify credentials, issue an access JWT and a refresh token.
app.post('/api/login', async (req, res) => {
    let {email, password} = req.body;
    const user_claimed = await getUser(email);
    if (!user_claimed)
        throw new NotAdminErr("incorrect email or password");
    if (await checkPasswordHash(password, user_claimed.password)) {
        const refresh_tok = makeRefreshToken();
        const user = {
            id: user_claimed.id,
            email: user_claimed.email,
            createdAt: user_claimed.createdAt,
            updatedAt: user_claimed.updatedAt,
            isChirpyRed: user_claimed.is_chirpy_red,
            token: makeJWT(user_claimed.id, 3600, config.secret),
            refreshToken: refresh_tok,
        }

        res.status(200).send(user);
        await saveTok(refresh_tok, user.id);
    }
    else
        throw new NotAdminErr("incorrect email or password");
})
// ---- Auth routes ----
// Exchange a valid, non-revoked refresh token for a new access JWT.
app.post('/api/refresh', async (req, res) => {
    const token = getBearerToken(req);
    const token_data = await getRefreshToken(token);

    if (!token_data || token_data.revoked_at || new Date(token_data.expires_at).getTime() < new Date().getTime())
        throw new UnauthorizedErr("Invalid refresh token");

    res.status(200).send({ token: makeJWT(token_data.user_id, 3600, config.secret) })
})

// ---- Auth routes ----
// Revoke a refresh token so it can no longer be exchanged for a JWT.
app.post('/api/revoke', async (req, res) => {
    const token = getBearerToken(req);
    await revokeToken(token);
    res.status(204).end();
})

// ---- Chirp routes ----
// List chirps, optionally filtered by authorId and sorted (sort=asc|desc, default asc).
app.get('/api/chirps', async (req, res) => {
    var data;
    const sort = req.query.sort as string;
    if (req.query.authorId)
        data = await getChirps(undefined, req.query.authorId as string, sort)
    else data = await getChirps(undefined, undefined, sort);
    res.status(200).send(data);
})
// ---- Chirp routes ----
// Fetch a single chirp by id.
app.get('/api/chirps/:chirpID', async (req, res) => {
    const data = await getChirps(req.params.chirpID);
    if (!data)
        throw new NotFoundErr("Chirp not found");
    res.status(200).send(data);
})

// ---- Chirp routes ----
// Create a chirp for the logged-in user (validate_chirp checks length/profanity first).
app.post('/api/chirps', validate_chirp, async (req, res) => {
    console.log(getBearerToken(req));
    const { body } = req.body;
    const userId = validateJWT(getBearerToken(req), config.secret);

    if (!userId)
        throw new UnauthorizedErr("Please login then create chirp");

    const result = await createChirp({ body: body, userId: userId });
    res.status(201).send(result);
})

// ---- Chirp routes ----
// Delete a chirp, only allowed for the chirp's own author.
app.delete('/api/chirps/:chirpID', async (req, res) => {
    const token = getBearerToken(req);
    const id = validateJWT(token, config.secret);

    if (!id)
        throw new UnauthorizedErr("Not allowed");

    const deleted = await deleteChirp(req.params.chirpID, id);
    if (deleted == -1)
        throw new NotFoundErr("Chirp not found")
    else if (deleted == 0)
        throw new ForbidenErr("Forbiden");

    res.status(204).end();
})

// ---- Webhook routes ----
// Polka payment webhook: upgrades a user to Chirpy Red once they've paid.
app.post('/api/polka/webhooks', async (req, res) => {
    const {event, data} = req.body, { userId } = data;
    const key = getAPIKey(req);

    if (key != config.apiKey)
        throw new UnauthorizedErr("Wrong api key")

    if (event != "user.upgraded") {
        res.status(204).end();
        return
    }

    const updated = await updateUser(userId, { is_chirpy_red: true });
    if  (!updated)
        throw new NotFoundErr("User not found");

    res.status(204).send({});
})

app.use(errorMiddleware);

app.listen(8080, () => console.log("Hey"));
