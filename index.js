var express = require('express');
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

var port = process.env.PORT || 3000
app.listen(port, function () {
    console.log("To view your app, open this link in your browser: http://localhost:" + port);
});

app.use(express.bodyParser());


let Promise = require('bluebird');

let params = {
    "username": "03255726-d7c2-4af6-961f-9722b36c3daa-bluemix",
    "host": "03255726-d7c2-4af6-961f-9722b36c3daa-bluemix.cloudant.com",
    "dbname": "temis",
    "password": "dad588d54bf4cbd5f8785c7d2f0ab8a5f156d341b89ee57ec87bc61116e6671e"
};

app.get('/occurrence', function (req, res) {
    let query = {
        selector: {
            type: "occurrence"
        }
    };

    let request = getDocument(params, query)
    request.then(function (result) {
        res.send(result);
    })
});

app.get('/complaint', function (req, res) {
    let query = {
        selector: {
            type: "complaint"
        }
    };

    let request = getDocument(params, query)
    request.then(function (result) {
        res.send(result);
    })
});

// example boby:
// {
//     "type": "occurrence",
//     "date": "",
//     "address": "",
//     "lat": "",
//     "lng": "",
//     "description": "",
//     "status": "",
//     "veracity": "",
//     "importance": ""
//   }

app.post('/call', function (req, res) {
    let request = insert(params, req.body)
    request.then(function (result) {
        res.send(result);
    })
});

// http://localhost:3000/call/status/4a29f354ab1f2c417ba7149d67f9fefb/SOLVED
// http://localhost:3000/call/status/4a29f354ab1f2c417ba7149d67f9fefb/PENDING
// http://localhost:3000/call/status/4a29f354ab1f2c417ba7149d67f9fefb/IN PROGRESS

app.post('/call/status/:_id/:status', function (req, res) {
    var _id = req.params._id;
    var status = req.params.status;

    let ddoc = {};
    ddoc._id = _id;
    ddoc.status = status;

    let request = updateStatus(params, ddoc)
    request.then(function (result) {
        res.send(result);
    })
});

// http://localhost:3000/call/veracity/4a29f354ab1f2c417ba7149d67f9fefb/TRUE
// http://localhost:3000/call/veracity/4a29f354ab1f2c417ba7149d67f9fefb/FALSE

app.post('/call/veracity/:_id/:veracity', function (req, res) {
    var _id = req.params._id;
    var veracity = req.params.veracity;

    let ddoc = {};
    ddoc._id = _id;
    ddoc.veracity = veracity;

    let request = updateVeracity(params, ddoc)
    request.then(function (result) {
        res.send(result);
    })
});






function insert(params, ddoc) {
    return new Promise(function (resolve, reject) {
        let conn = initConn(params);
        Promise.promisifyAll(conn);

        conn.then(function (cloudantConnection) {
            let cloudantDb = cloudantConnection;

            // fazer algoritmo para priorizar




            insertDocument(cloudantDb, ddoc, result => {
                resolve(result)
            });
        });
    });
}

function updateStatus(params, ddoc) {
    return new Promise(function (resolve, reject) {
        let conn = initConn(params);
        Promise.promisifyAll(conn);

        conn.then(function (cloudantConnection) {

            let query = {
                selector: {
                    _id: ddoc._id
                }
            };

            let request = getDocument(params, query)
            request.then(function (result) {
                let status = ddoc.status;
                ddoc = result[0];
                ddoc.status = status;

                let cloudantDb = cloudantConnection;

                updateDocument(cloudantDb, ddoc, result => {
                    resolve(result)
                });
            })


        });
    });
}

function updateVeracity(params, ddoc) {
    return new Promise(function (resolve, reject) {
        let conn = initConn(params);
        Promise.promisifyAll(conn);

        conn.then(function (cloudantConnection) {

            let query = {
                selector: {
                    _id: ddoc._id
                }
            };

            let request = getDocument(params, query)
            request.then(function (result) {
                let veracity = ddoc.veracity;
                ddoc = result[0];
                ddoc.veracity = veracity;

                let cloudantDb = cloudantConnection;

                updateDocument(cloudantDb, ddoc, result => {
                    resolve(result)
                });
            })


        });
    });
}

function insertDocument(cloudantDb, ddoc, callback) {
    cloudantDb.insert(ddoc, function (error, response) {
        if (error) {
            throw error
            callback(true)
        }

        console.log('Created design document with books index')
        callback(true)
    })
}

function updateDocument(cloudantDb, ddoc, callback) {
    console.log(ddoc)
    cloudantDb.insert(ddoc, ddoc._id, function (error, response) {
        if (error) {
            console.log(error)
            throw error
            callback(true)
        }

        console.log('Created design document with books index')
        callback(true)
    })
}


function getDocument(params, query) {


    return new Promise(function (resolve, reject) {
        let conn = initConn(params);
        Promise.promisifyAll(conn);

        conn.then(function (cloudantConnection) {
            let cloudantDb = cloudantConnection;

            readViewSearchIndexDocument(cloudantDb, query, result => {
                resolve(result)
            });
        });
    });
}


function readViewSearchIndexDocument(cloudantDb, selector, callback) {
    return new Promise(function (resolve, reject) {
        cloudantDb.find(selector, function (err, result) {
            if (err) {
                reject(err)
                throw err;
            }
            callback(result.docs)
        })
    })
}

function readViewDocument(cloudantDb, design, view, callback) {
    return new Promise(function (resolve, reject) {
        cloudantDb.view(
            design,
            view,
            { 'include_docs': true },
            function (error, response) {
                if (!error) {
                    let result;
                    try {
                        result = JSON.stringfy(response.rows);
                    } catch (err) {
                        result = response.rows;
                    }

                    callback(result);
                } else {
                    // console.error('error', error);
                    reject(error);

                }
            }
        );
    });
}

function readViewSearchIndexDocument(cloudantDb, selector, callback) {
    return new Promise(function (resolve, reject) {
        cloudantDb.find(selector, function (err, result) {
            if (err) {
                reject(err)
                throw err;
            }
            callback(result.docs)
        })
    })
}

function initConn(message) {
    return new Promise(function (resolve, reject) {

        let cloudantOrError = getCloudantAccount(message);
        if (typeof cloudantOrError !== 'object') {
            return Promise.reject(cloudantOrError);
        }
        let cloudant = cloudantOrError;

        let dbName = message.dbname;
        let docId = message.docid || message.id;
        let params = {};

        if (!dbName) {
            return Promise.reject('dbname is required.');
        }

        let cloudantDb = cloudant.use(dbName);

        if (typeof message.params === 'object') {
            params = message.params;
        } else if (typeof message.params === 'string') {
            try {
                params = JSON.parse(message.params);
            } catch (e) {
                return Promise.reject('params field cannot be parsed. Ensure it is valid JSON.');
            }
        }


        Promise.promisifyAll(cloudantDb);

        resolve(cloudantDb);
    });
}

function getCloudantAccount(params) {

    let Cloudant = require('@cloudant/cloudant');
    let cloudant;

    if (!params.iamApiKey && params.url) {
        cloudant = Cloudant(params.url);
    } else {
        checkForBXCreds(params);

        if (!params.host) {
            return 'Cloudant account host is required.';
        }

        if (!params.iamApiKey) {
            if (!params.username || !params.password) {
                return 'You must specify parameter/s of iamApiKey or username/password';
            }
        }

        let protocol = params.protocol || 'https';
        if (params.iamApiKey) {
            let dbURL = `${protocol}://${params.host}`;
            if (params.port) {
                dbURL += ':' + params.port;
            }
            cloudant = new Cloudant({
                url: dbURL,
                plugins: { iamauth: { iamApiKey: params.iamApiKey, iamTokenUrl: params.iamUrl } }
            });
        } else {
            let url = `${protocol}://${params.username}:${params.password}@${params.host}`;
            if (params.port) {
                url += ':' + params.port;
            }
            cloudant = Cloudant(url);
        }
    }
    return cloudant;
}

function checkForBXCreds(params) {

    if (params.__bx_creds && (params.__bx_creds.cloudantnosqldb || params.__bx_creds.cloudantNoSQLDB)) {
        let cloudantCreds = params.__bx_creds.cloudantnosqldb || params.__bx_creds.cloudantNoSQLDB;

        if (!params.host) {
            params.host = cloudantCreds.host || (cloudantCreds.username + '.cloudant.com');
        }
        if (!params.iamApiKey && !cloudantCreds.apikey) {
            if (!params.username) {
                params.username = cloudantCreds.username;
            }
            if (!params.password) {
                params.password = cloudantCreds.password;
            }
        } else if (!params.iamApiKey) {
            params.iamApiKey = cloudantCreds.apikey;
        }
    }
}

