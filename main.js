/**
    Copyright (C) 2022 Timofey Chuchkanov

    Licensed under the Sufflain Private Module License.
 */

import config from '../api-config.js';
import cors from 'cors';
import express from 'express';
import { Buffer } from 'buffer';
import fetch from 'node-fetch';
import * as pgp from 'openpgp';

const pass = 'VrTI8O8Wh9E5b4b7zz3pPMMWN0jdGp0tnSvyreU56AwG92Y65tAKM59FAp6dpFmNb814suMhdpiB6xSkOl9tyU0zpOZmz58JRw6sS49P9xzDP16Tz5hH67numKhLiQOo';

const teachersTimetablesUrl = config.baseUrl + config.paths.teachersTimetables;
const timetablesUrl = config.baseUrl + config.paths.timetables;
const orderUrl = config.baseUrl + config.paths.order;
const namesUrl = config.baseUrl + config.paths.names;
const groupsUrl = config.baseUrl + config.paths.groups;

const port = 4870;
const app = express();

const keyPair = {
    pub: null,
    pri: null
};

const errBadReq = {
    error: 400
};

(async function generateKeyPair() {
    const { privateKey, publicKey } = await pgp.generateKey({
        userIDs: [{ name: 'Timofey Chuchkanov', email: 'crt0r.9@yahoo.com' }],
        passphrase: pass
    });

    keyPair.pri = privateKey;
    keyPair.pub = publicKey;
})()

app.use(cors());
app.use(express.json());

app.get('/pubreq', (_, res) => {
    res.send({ pub: keyPair.pub })
});

app.post('/teacher-timetable/:tid', async (req, res) => (
    makeResponse(res, await logRequestResponse(req, async () => (
        await validatePgpMessageAndGetDataFromDb(req.body.payload, async () => (
            await fetchById(req.params.tid, teachersTimetablesUrl)
        ))
    )))
));

app.post('/timetable/:gid', async (req, res) => (
    makeResponse(res, await logRequestResponse(req, async () => (
        await validatePgpMessageAndGetDataFromDb(req.body.payload, async () => (
            await fetchById(req.params.gid, timetablesUrl)
        ))
    )))
));

app.post('/groups', async (req, res) => (
    makeResponse(res, await logRequestResponse(req, async () => (
        await validatePgpMessageAndGetDataFromDb(req.body.payload, async () => (
            await fetchFromDb(groupsUrl)
        ))
    )))
));

app.post('/names', async (req, res) => (
    makeResponse(res, await logRequestResponse(req, async () => (
        await validatePgpMessageAndGetDataFromDb(req.body.payload, async () => (
            await fetchFromDb(namesUrl)
        ))
    )))
));

app.post('/posts-order', async (req, res) => (
    makeResponse(res, await logRequestResponse(req, async () => (
        await validatePgpMessageAndGetDataFromDb(req.body.payload, async () => (
            await fetchFromDb(orderUrl)
        ))
    )))
));

app.listen(port, () => console.log(`started server at http://localhost:${port}`));

async function validatePgpMessageAndGetDataFromDb(payload, dbReq) {
    const pgpMessage = await readAndValidatePgpMessage(payload);

    if (pgpMessage.error) {
        console.log({ pgpMessage })
        return errBadReq;
    } else {
        const sharedSecret = await decryptClientReqPayload(pgpMessage);

        if (sharedSecret != config.shared) {
            console.log({ sharedSecret })
            return errBadReq;
        }

        return await dbReq();
    }
}

async function readAndValidatePgpMessage(payload) {
    try {
        var pgpMessage = await pgp.readMessage({ armoredMessage: payload });
    } catch (e) {
        console.log({ payload, err: e.message })
        return { error: true };
    }

    return pgpMessage;
}

function makeResponse(res, payload) {
    if (payload.error)
        res.sendStatus(payload.error);
    else
        res.send(payload);
}

async function decryptClientReqPayload(pgpMessage) {
    const privateKey = await pgp.readPrivateKey({ armoredKey: keyPair.pri });
    const decryptionKeys = await pgp.decryptKey({
        privateKey,
        passphrase: pass
    });

    try {
        var { data: decrypted } = await pgp.decrypt({
            message: pgpMessage,
            decryptionKeys
        });
    } catch (e) {
        return errBadReq;
    }

    return decrypted;
}

async function fetchById(id, path) {
    const allTimetables = await fetchFromDb(path);
    const timetable = allTimetables[id];

    return timetable;
}

async function fetchFromDb(fullPath) {
    const credentials = Buffer.from(`${config.user.name}:${config.user.password}`).toString('base64');

    const response = await fetch(fullPath, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Accept': 'application/json',
            'Authorization': `Basic ${credentials}`
        }
    });

    const json = await response.json();
    const cleanJson = removeInternalFields(json);

    return cleanJson;
}

function removeInternalFields(obj) {
    const { _rev, _id, ...cleanData } = obj;

    return cleanData;
}

async function logRequestResponse({ hostname, path }, makeResPayload) {
    console.log(`━━━━[REQ/RES START]━━━━ (${new Date(Date.now()).toGMTString()})`)

    const logMessage = {};
    const resPayload = await makeResPayload();

    logMessage[`${hostname} ➔ ${path}`] = { resPayload };

    console.dir(logMessage, { depth: null });
    console.log('━━━━[REQ/RES END]━━━━')

    return resPayload;
}