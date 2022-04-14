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
        passphrase: 'VrTI8O8Wh9E5b4b7zz3pPMMWN0jdGp0tnSvyreU56AwG92Y65tAKM59FAp6dpFmNb814suMhdpiB6xSkOl9tyU0zpOZmz58JRw6sS49P9xzDP16Tz5hH67numKhLiQOo'
    });
    
    keyPair.pri = privateKey;
    keyPair.pub = publicKey;
})()

app.use(cors());

app.get('/pubreq' , (req, res) => {
    res.format({
        'text/plain': () => res.send(keyPair.pub)
    });
});

app.get('/teacher-timetable/:tid', async (req, res) => {
    const teacherTimetable = await fetchById(req.params.tid, teachersTimetablesUrl);
    res.status(200).send(teacherTimetable);
});

app.get('/timetable/:gid', async (req, res) => {
    const groupTimetable = await fetchById(req.params.gid, timetablesUrl);
    console.log(groupTimetable)
    res.status(200).send(groupTimetable);
});

app.get('/groups', async (req, res) => {
    const groups = await fetchFromDb(groupsUrl);
    res.status(200).send(groups);
});

app.get('/names', async (req, res) => {
    const names = await fetchFromDb(namesUrl);
    res.status(200).send(names);
});

app.get('/posts-order', async (req, res) => {
    const order = await fetchFromDb(orderUrl);
    res.status(200).send(order);
});

app.listen(port, () => console.log(`started server at http://localhost:${ port }`));

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
