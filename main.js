/**
    Copyright (C) 2022 Timofey Chuchkanov

    Licensed under the Sufflain Private Module License.
 */

import config from '../api-config.js';
import cors from 'cors';
import express from 'express';
import { Buffer } from 'buffer';
import fetch from 'node-fetch';
import crypto from 'crypto';
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

(async function generateKeyPair() {
    const { privateKey, publicKey } = await pgp.generateKey({
        type: 'rsa',
        rsaBits: 2048,
        userIDs: [{ name: 'Timofey Chuchkanov', email: 'crt0r.9@yahoo.com' }],
        passphrase: pass
    });
    
    keyPair.pri = privateKey;
    keyPair.pub = publicKey;
    console.log(keyPair)
})()

console.log(keyPair)

app.use(cors());
app.use(express.json());

app.get('/pubreq' , (req, res) => {
    res.send({ pub: keyPair.pub })
});

app.post('/teacher-timetable/:tid', async (req, res) => {
    const teacherTimetable = await fetchById(req.params.tid, teachersTimetablesUrl);
    await extractKeysAndMakeEncryptedResponse(req.body.payload, res, teacherTimetable);
});

app.post('/timetable/:gid', async (req, res) => {
    const groupTimetable = await fetchById(req.params.gid, timetablesUrl);
    console.log(groupTimetable)
    await extractKeysAndMakeEncryptedResponse(req.body.payload, res, groupTimetable);
});

app.post('/groups', async (req, res) => {
    const groups = await fetchFromDb(groupsUrl);
    console.log(req.body)
    await extractKeysAndMakeEncryptedResponse(req.body.payload, res, groups);
});

app.post('/names', async (req, res) => {
    const names = await fetchFromDb(namesUrl);
    await extractKeysAndMakeEncryptedResponse(req.body.payload, res, names);
});

app.post('/posts-order', async (req, res) => {
    const order = await fetchFromDb(orderUrl);
    await extractKeysAndMakeEncryptedResponse(req.body.payload, res, order);
});

app.listen(port, () => console.log(`started server at http://localhost:${ port }`));

async function extractKeysAndMakeEncryptedResponse(reqPayload, res, payload) {
    const decryptedPayload = await decryptClientReqPayload(reqPayload);
    const [ sharedSecret, pub ] = decryptedPayload.split('@');

    if (sharedSecret != config.shared)
        res.sendStatus(403);

    const encryptedResponse = await encryptResponse(payload, pub);

    res.send({ payload: encryptedResponse });
}

async function encryptResponse(json, pubKey) {
    const encryptedResponse = await pgp.encrypt({
        message: await pgp.createMessage({ text: JSON.stringify(json) }),
        encryptionKeys: await pgp.readKey({ armoredKey: pubKey })
    });

    return encryptedResponse;
}

async function decryptClientReqPayload(payload) {
    const { data: decrypted } = await pgp.decrypt({
        message: await pgp.readMessage({ armoredMessage: payload }),
        decryptionKeys: await pgp.decryptKey({ privateKey: await pgp.readPrivateKey({ armoredKey: keyPair.pri }), passphrase: pass})
    });

    return decrypted;
}

async function decyptPayloadWithPrivateKey(payload) {
    const privateKeyDecrypted = await pgp.decryptKey({
        privateKey: await pgp.readPrivateKey({ armoredKey: keyPair.pri }),
        passphrase: pass
    });
    const { data: decrypted } = await pgp.decrypt({
        message: await pgp.readMessage({ armoredMessage: payload }),
        decryptionKeys: privateKeyDecrypted
    });

    return decrypted;
}

async function fetchById(id, path) {
    const allTimetables = await fetchFromDb(path);
    const timetable = allTimetables[id];

    return timetable;
}

async function fetchFromDb(fullPath) {
    const credentials = Buffer.from(`${ config.user.name }:${ config.user.password }`).toString('base64');

    const response = await fetch(fullPath, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Basic ${ credentials }`
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
