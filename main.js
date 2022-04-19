/**
    Copyright (C) 2022 Timofey Chuchkanov

    Licensed under the Sufflain Private Module License.
 */

import { setupEndpoints } from './endpoints.js';
import * as Crypto from './crypto_utils.js';
import cors from 'cors';
import express from 'express';

const port = 4870;
const app = express();

const keyPair = await Crypto.generateKeyPair();

app.use(cors());
app.use(express.json());

setupEndpoints(app, keyPair);

app.listen(port, () => console.log(`started server at port ${port}`));