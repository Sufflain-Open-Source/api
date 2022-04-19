/**
    Copyright (C) 2022 Timofey Chuchkanov

    Licensed under the Sufflain Private Module License.
 */

export async function logRequestResponse({ hostname, path }, makeResPayload) {
    console.log(`━━━━[REQ/RES START]━━━━ (${new Date(Date.now()).toGMTString()})`)

    const logMessage = {};
    const resPayload = await makeResPayload();

    logMessage[`${hostname} ➔ ${path}`] = { resPayload };

    console.dir(logMessage, { depth: null });
    console.log('━━━━[REQ/RES END]━━━━')

    return resPayload;
}