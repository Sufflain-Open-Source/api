/**
    Copyright (C) 2022 Timofey Chuchkanov

    Licensed under the Sufflain Private Module License.
 */

export function makeLogger({ hostname, path, method }, resPayloadOrMaker, options) {
    const logMessageKey = `[${ method }] ${hostname} ➔ ${path}`
    const logMessage = {};
    let logger;

    const loggerHead = () => (
        console.log(`━━━━[REQ/RES START]━━━━ (${new Date(Date.now()).toGMTString()})`)
    );

    const loggerBody = () => (
        console.dir(logMessage, { depth: null })
    );

    const loggerTail = () => (
        console.log('━━━━[REQ/RES END]━━━━')
    );

    if (options && options.sync) {
        logger = () => {
            loggerHead();
            const payload = resPayloadOrMaker();
            logMessage[logMessageKey] = { resPayload: payload };
            loggerBody();
            loggerTail();

            return payload;
        };
    } else if (options && options.isDataReady) {
        logger = () => {
            loggerHead();
            const payload = resPayloadOrMaker;
            logMessage[logMessageKey] = { resPayload: payload };
            loggerBody();
            loggerTail();
            
            return payload;
        }
    } else {
        logger = async () => {
            loggerHead();
            const payload = await resPayloadOrMaker();
            logMessage[logMessageKey] = { resPayload: payload };
            loggerBody();
            loggerTail();

            return payload;
        };
    }

    return logger;
}