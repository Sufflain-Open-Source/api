/**
    Copyright (C) 2022 Timofey Chuchkanov

    Licensed under the Sufflain Private Module License.
 */

import config from '../api-config.js';
import { Buffer } from 'buffer';
import fetch from 'node-fetch';

export async function fetchById(id, path) {
    const allTimetables = await fetchFromDb(path);
    const timetable = allTimetables[id];
    
    if (!timetable)
        return {};

    return timetable;
}

export async function fetchFromDb(fullPath) {
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

export function removeInternalFields(obj) {
    const { _rev, _id, ...cleanData } = obj;

    return cleanData;
}