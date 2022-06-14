var fs = require('fs');
var parse = require('csv-parse');
var filepath = ''; //put in env
var csvData = [];
fs.createReadStream(filepath)
    .pipe(parse({ delimiter: ':' }))
    .on('data', function (csvrow) {
        console.log(csvrow);
        //do something with csvrow
        csvData.push(csvrow);
    })
    .on('end', function () {
        //do something with csvData
        console.log(csvData);
    });
