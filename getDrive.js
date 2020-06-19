'use strict';

const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/drive'];
const TOKEN_PATH = 'token.json';

module.exports = {drive : getDrive}

// gets drive object used to interact with Google Drive API
function getDrive() {
    return new Promise((resolve, reject) => {
        getClient()
        .then(checkAccessToken)
        .then(getAccessToken)
        .then(([client, token]) => {
            client.setCredentials(token);
            console.log(client)
            const drive = google.drive({version: 'v3', auth: client});
            resolve(drive);
        }).catch((error) => {console.error(error)})
    })
}

// gets client object with credentials (but without token)
function getClient() {
    return new Promise((resolve, reject) => {
        fs.readFile('credentials.json', 'utf8', (error, content) => {    
            if (error) return reject(error);
            const credentials = JSON.parse(content);
            const {client_secret, client_id, redirect_uris} = credentials.installed;
            const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
            resolve(oAuth2Client);
        })
    })  
}

// checks for access token
// promise resolves to array
// first element is the client object
// second element is token if found, false (boolean) if not found
function checkAccessToken(client) {
    return new Promise((resolve, reject) => {
        // check if token already stored
        fs.readFile(TOKEN_PATH, 'utf8', (error, token) => {
            // token not found
            if (error) {
                if (error.code == 'ENOENT') {
                    return resolve([client, false]);
                } else {
                    return reject(error);
                }
            }
            // token found
            token = JSON.parse(token);
            resolve([client, token]);
        })
    })
}

// if access token not found, gets access token and writes it to TOKEN_PATH
// promise resolves to array [client, token]
function getAccessToken(result) {
    return new Promise((resolve, reject) => {
        // pass result through
        if (!(result[1])) {
            resolve(result);    
        // get token
        } else {
            const client = result[0];
            const authUrl = client.generateAuthUrl({
                access_type: 'offline',
                scope: SCOPES,
            });
            console.log('Authorize this app by visiting this url:\n\n'+authUrl+'\n');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
            });
            rl.question('Enter the code from that page here: ', (code) => {
                rl.close();
                client.getToken(code, (error, token) => {
                    if (error) return reject ('Error retrieving access token: ', error);
                    client.setCredentials(token);
                    // store token to disk for later program executions
                    fs.writeFile(TOKEN_PATH, JSON.stringify(token), (error) => {
                        if (error) return reject('Error writing token to file:', error);
                        console.log('Token stored to', TOKEN_PATH);
                        resolve([client, token])
                    })
                })
            })
        }
    })
}