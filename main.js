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
      pub: '-----BEGIN PGP PUBLIC KEY BLOCK-----\n' +
    '\n' +
    'xsBNBGJYdOYBCADBHbazvEtTS1luWPQGEAA3GlH6cA+tYmLRV48P/ltdWdE9\n' +
    '07ZuwjIG6CFL+tdA7JcI79EpJMHBNc5NDzWqAUmIjZP78D68WJ5H53ZiaOis\n' +
    'MjZ3AhAKyS5MRH8tFGkYCcPGjUB8dly7cNnlMzx3YSB8mc76ySw94h/ss978\n' +
    '0HGQBvANW0D5nDBtzNETn1DlH82hOOop1Nq0pra6+/1J4VSbZ1OxJ6pmC6o4\n' +
    'xQz7Uc5FuWtjMJCHt104+vRPxaEp2AxyuyMdcfzuagrsW96KW/OEMCCcU+Ym\n' +
    'E4th8Nl47ZknMz/5zqL5oNOouGuh1tQtRndk4eSrycRWXu688M8qgDQ/ABEB\n' +
    'AAHNJlRpbW9mZXkgQ2h1Y2hrYW5vdiA8Y3J0MHIuOUB5YWhvby5jb20+wsCK\n' +
    'BBABCAAdBQJiWHTmBAsJBwgDFQgKBBYAAgECGQECGwMCHgEAIQkQBvx8Duph\n' +
    'V68WIQSJ0C6ydtLeahS+Vn8G/HwO6mFXr/lzCACXQZZPNncXNnKqYqJnh5tM\n' +
    'yFbnUSSyCWpHuT3QYumAJH90/ZQzV/NCLz3DdF1wdZgMc6CzVkoTv2irbV9D\n' +
    'hT3F8Tc0kY1lCff2wlvBir8un1TBXku/huGN58yZz2hqqlUblcRmqSMWLWWI\n' +
    'f3hJQCgMJmY0bXMJa4UE06mZygqf8vIXxUzezJ12IxgMcFycFfyuCr6x0NN1\n' +
    'XlHT6C21HliPYQAwzL9uC1+dSoX7fKJ33OHKBiL83b6bK0xpVV9Q3zGlO2x5\n' +
    'EPF1d/b4CQo/7QJyHU7se2jkRwp15vvxaZLlGGO8p6QBAAvaXCp6EIG1a2Dq\n' +
    'j05AbN349dWMtXNkxnl6zsBNBGJYdOYBCADFpKdf6UBOi85IOw9GFX6yojN+\n' +
    'h1g4vmG9clWjURIFL9um+fH+VF6UNqMoG0T9bk3OQGkAqCR1f8d6UwpCly6D\n' +
    'wVLfUE4eVJMTNBmOyK2nNd1v/MIT5xfdzF5l2mFa0OFIwcdcGGgwwDWD1R0o\n' +
    'qMGuxLif6+Pl7d1Y46H6T5IvAIl/JGVmlxfL1cnuVNPd2MbCjPi5w//Vm7tc\n' +
    'EL0xFTc01b7h+2F13zxfTTFCX3nXp38Y3eObZtCV84xIWejzriMItjxKXHLE\n' +
    'ahLgKEH6hxjrZzy5Co2OQgew2kqAIB8WVDlTUBJP552VDlNlPD2nUvi9JAZe\n' +
    'mUIoZyX/48Bjx9apABEBAAHCwHYEGAEIAAkFAmJYdOYCGwwAIQkQBvx8Duph\n' +
    'V68WIQSJ0C6ydtLeahS+Vn8G/HwO6mFXr1/0CACsnh+OigB/MlIwt4ZpasFr\n' +
    '58oP3oeOFKVCC+CaoB7sfM/2FUyv4SHQS61DXKhlLdrSCv1/oeXLow4PqJNF\n' +
    'bg7doynt52x8Prs6yVfi2qhX264YpsAtrc9/Mso4jUp6X2tx/AD3f5RS0Wi0\n' +
    'X1nmdn48YnLgHiwCxnqf0EBuIEwFvBgnH2ulCWRPtN0nzbLV/yvYolOY5WrX\n' +
    'ZxgAYGM27F1wj3sdg6TVXYwb0vkznCKtg1xQ4RaQv5fjbdiq8fl7U9gLOzAT\n' +
    'UaN01sVZGb3tHiru+Dt+FzvZsUYjSGokE6TYxCaGn20ZBdE7l/5qbFDJWQv0\n' +
    'cFv3kAnexXTG3Db+9NKw\n' +
    '=6//g\n' +
    '-----END PGP PUBLIC KEY BLOCK-----\n',
  pri: '-----BEGIN PGP PRIVATE KEY BLOCK-----\n' +
    '\n' +
    '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\n' +
    'W/eQCd7FdMbcNv700rA=\n' +
    '=kusD\n' +
    '-----END PGP PRIVATE KEY BLOCK-----\n'
};

//(async function generateKeyPair() {
//    const { privateKey, publicKey } = await pgp.generateKey({
//        type: 'rsa',
//        rsaBits: 2048,
//        userIDs: [{ name: 'Timofey Chuchkanov', email: 'crt0r.9@yahoo.com' }],
//        passphrase: pass
//    });
    
//    keyPair.pri = privateKey;
//    keyPair.pub = publicKey;
//    console.log(keyPair)
//})()
console.log(keyPair)

app.use(cors());
app.use(express.json());

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
    const { data: decrypted } = await pgp.decrypt({
        message: await pgp.readMessage({ armoredMessage: req.body.payload }),
        decryptionKeys: await pgp.decryptKey({ privateKey: await pgp.readPrivateKey({ armoredKey: keyPair.pri }), passphrase: pass})
    });
    const [ sharedSecret, pub ] = decrypted.split('@');

    if (sharedSecret != config.shared)
        res.sendStatus(403);

    const encryptedResponse = await pgp.encrypt({
        message: await pgp.createMessage({ text: JSON.stringify(names) }),
        encryptionKeys: await pgp.readKey({ armoredKey: pub })
    });

    res.send({ payload: encryptedResponse });
});

app.get('/posts-order', async (req, res) => {
    const order = await fetchFromDb(orderUrl);
    res.status(200).send(order);
});

app.listen(port, () => console.log(`started server at http://localhost:${ port }`));

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
