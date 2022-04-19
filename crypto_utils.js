/**
    Copyright (C) 2022 Timofey Chuchkanov

    Licensed under the Sufflain Private Module License.
 */

import config from '../api-config.js';
import { errBadReq } from './shared.js';
import * as pgp from 'openpgp';

export async function validatePgpMessageAndGetDataFromDb(payload, dbReq, keyPair) {
    const pgpMessage = await readAndValidatePgpMessage(payload);

    if (pgpMessage.error) {
        console.log({ pgpMessage })
        return errBadReq;
    } else {
        const sharedSecret = await decryptClientReqPayload(pgpMessage, keyPair);

        if (sharedSecret != config.shared) {
            console.log({ sharedSecret })
            return errBadReq;
        }

        return await dbReq();
    }
}

export async function readAndValidatePgpMessage(payload) {
    try {
        var pgpMessage = await pgp.readMessage({ armoredMessage: payload });
    } catch (e) {
        console.log({ payload, err: e.message })
        return { error: true };
    }

    return pgpMessage;
}

export async function decryptClientReqPayload(pgpMessage, keyPair) {
    const privateKey = await pgp.readPrivateKey({ armoredKey: keyPair.pri });
    const decryptionKeys = await pgp.decryptKey({
        privateKey,
        passphrase: config.pass
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

export async function generateKeyPair() {
    const { privateKey, publicKey } = await pgp.generateKey({
        userIDs: [{ name: 'Timofey Chuchkanov', email: 'crt0r.9@yahoo.com' }],
        passphrase: config.pass
    });

    return {
        pri: privateKey,
        pub: publicKey
    };
}