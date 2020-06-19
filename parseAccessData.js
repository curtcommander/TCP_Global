'use strict';

module.exports = {toJSON};

// parses Access data export and converts it into a JSON object
// assumes field names present, values not wrapped in quotes, linebreaks are \r\n
// input (string): name of file containing Access data export
// output (object): JSON object of data in file with the structure {'data': data}

function toJSON(fileName) {
    return new Promise((resolve, reject) => {
        const fs = require('fs');
        fs.readFile(fileName, 'utf8', (error, content) => {
            if (error) reject(error);
            // parse content as array of arrays
            let rows = content.split('\r\n').slice(0,-1);
            rows = rows.map((row) => row.split(','))
            // separate field names from data
            let fieldNames;
            [fieldNames, ...rows] = rows;
            // build object from array of arrays
            const C = fieldNames.length;
            const R = rows.length;
            const json = {data: []};
            for (let r = 0; r < R; r++) {
                const row = rows[r];
                let rowObject = {};
                for (let c = 0; c < C; c++) {
                    rowObject[fieldNames[c]] = row[c];
                }
                json['data'].push(rowObject);
            }
            resolve(json);
        })
    })
}

