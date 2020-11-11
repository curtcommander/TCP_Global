#!/usr/bin/env node
'use strict';

const fs = require('fs');
const gaxios = require('gaxios');
const _refreshAccessToken = require('./refreshAccessToken');

// get token from file
const tokenData = JSON.parse(fs.readFileSync('tokenGDrive.json', 'utf8'));
let token = [tokenData.token_type, tokenData.access_token].join(' ');

module.exports = {batch};

/**
 * Makes a batch request.
 * @param {Array} requests - Array of objects with
 * each object representing a request. Objects should have
 * <code>url</code> and <code>method</code> properties specifying
 * the endpoint and http method of the request, respectively.
 * Object can optionally have a <code>data</code> property
 * for the request body
 * @return {Array} The same as <code>requests</code> but each
 * object in the array has the additional properties
 * <code>responseStatus</code> and <code>responseData</code>
 * @example
 * // requests array
 * const requests = [
 *  {
 *    url: 'https://www.googleapis.com/drive/v3/files?q=name%20%3D%20%22Daily%20Logs%22',
 *    method: 'GET',
 *  },
 *  {
 *   url: 'https://www.googleapis.com/drive/v3/files?q=name%20%3D%20%22Reports%22',
 *    method: 'GET',
 *  }
 *];
 *
 * // make batch request
 * utilsGDrive.batch(requests)
 */
async function batch(requests) {
  // refresh access token if needed
  const firstRequestOpts = requests[0];
  firstRequestOpts.headers = {
    Authorization: token,
  };

  try {
    await gaxios.request(firstRequestOpts);
  } catch (e) {
    if (e.response.status === 401) {
      const newAccessToken = await _refreshAccessToken();
      token = [tokenData.token_type, newAccessToken].join(' ');
    }
  }

  // individual requests
  const reqTexts = [];
  for (const req of requests) {
    const reqHeaders =
      `${req.method} ${req.url}\n` +
      `Authorization: ${token}\n` +
      `Content-Type: application/json; charset=UTF-8`;
    const reqText = reqHeaders + '\r\n\r\n' + JSON.stringify(req.data);
    reqTexts.push(reqText);
  }

  // parts
  const boundary = 'END_OF_PART';
  const partHeader = '--'+boundary+'\nContent-Type: application/http';
  const partTexts = [];
  for (const reqText of reqTexts) {
    const partText = partHeader + '\n\r\n' + reqText + '\r\n';
    partTexts.push(partText);
  }

  // batch request
  const batchRequestText = partTexts.slice(0, 2).join('') + '--'+boundary+'--';
  const batchRequestOpts = {
    url: 'https://www.googleapis.com/batch/drive/v3',
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/mixed; boundary='+boundary,
    },
    data: batchRequestText,
  };

  // make batch request
  let batchResponse;
  await new Promise((resolve) => {
    this.throttle(async () => {
      batchResponse = await gaxios.request(batchRequestOpts);
      resolve();
    });
  });

  // parse batch response data
  const resData = batchResponse.data;
  const resBoundary = resData.slice(0, resData.indexOf('\r\n'));
  const responseStrings = resData.split(resBoundary).slice(1, -1);
  const responses = [];
  for (let i = 0; i < responseStrings.length; ++i) {
    const res = responseStrings[i];
    const statusLine = res.match(/HTTP.*/)[0];
    const status = Number(statusLine.match(/ .* /)[0].slice(1, -1));
    const data = JSON.parse(res.match(/{[^]*}/)[0]);
    responses.push(requests[i]);
    responses[i].responseStatus = status;
    responses[i].responseData = data;
  }

  return responses;
}
