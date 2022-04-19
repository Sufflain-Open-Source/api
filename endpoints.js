/**
    Copyright (C) 2022 Timofey Chuchkanov

    Licensed under the Sufflain Private Module License.
 */

import config from '../api-config.js';
import { validatePgpMessageAndGetDataFromDb } from './crypto_utils.js';
import { fetchById, fetchFromDb } from './db_utils.js';
import { logRequestResponse } from './utils.js';

const teachersTimetablesUrl = config.baseUrl + config.paths.teachersTimetables;
const timetablesUrl = config.baseUrl + config.paths.timetables;
const orderUrl = config.baseUrl + config.paths.order;
const namesUrl = config.baseUrl + config.paths.names;
const groupsUrl = config.baseUrl + config.paths.groups;

export function setupEndpoints(app, keyPair) {
    app.get('/pubreq', (_, res) => {
        res.send({ pub: keyPair.pub })
    });

    setupPostEndpoint(keyPair, app, '/teacher-timetable/:tid', teachersTimetablesUrl, 'tid');
    setupPostEndpoint(keyPair, app, '/timetable/:gid', timetablesUrl, 'gid');
    setupPostEndpoint(keyPair, app, '/groups', groupsUrl);
    setupPostEndpoint(keyPair, app, '/names', namesUrl);
    setupPostEndpoint(keyPair, app, '/posts-order', orderUrl);
}

function setupPostEndpoint(keyPair, app, path, url, by) {
    app.post(path, async (req, res) => (
        makeResponse(res, await logRequestResponse(req, async () => (
            await validatePgpMessageAndGetDataFromDb(req.body.payload, async () => (
                await by ? fetchById(req.params[by], url) : fetchFromDb(url)
            ),
                keyPair)
        )))
    ));
}

function makeResponse(res, payload) {
    if (payload.error)
        res.sendStatus(payload.error);
    else
        res.send(payload);
}