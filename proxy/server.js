const http = require('http');
const { exec, execSync } = require("child_process");
const fs = require('fs');

const hostname = process.env.GITHUB_PROXY_HOST_NAME ? process.env.GITHUB_PROXY_HOST_NAME : '0.0.0.0';
const port = process.env.GITHUB_PROXY_PORT ? process.env.GITHUB_PROXY_PORT : 80;

let repositories = [];
let updateTime = new Date();

const server = http.createServer((req, res) => {
    let token = '';
    if(!process.env.GITHUB_TOKEN || process.env.GITHUB_TOKEN == '') {
        if (!req.headers.authorization || req.headers.authorization.indexOf('Basic ') === -1) {
            res.statusCode = 401;
            res.end('Missing Authorization Header');
            return 
        }
    
        const base64Credentials =  req.headers.authorization.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
        const [username, password] = credentials.split(':');
        token = password;
    } else {
        token = process.env.GITHUB_TOKEN;
    }

    token = token.replace(/(\r\n|\n|\r)/gm, "")

    res.setHeader('Content-Type', 'text/plain');
    const [owner, repo, chartFile] = req.url.replace(/^\/|\/$/g, '').split('/');
    const repoUrl = owner + '/' + repo;
    const repoName = repoUrl.replace('/', '_');
    const host = req.headers.host;
    let schema = 'http';
    if (port == 443) {
        schema = 'https';
    }

    let repoCommand = [`export GITHUB_TOKEN=${token}`];
    if(!repositories.includes(repoName)) {
        repoCommand.push(`helm repo add ${repoName} github://${repoUrl}`);
    }

    let currentTime = Date.now();

    if(currentTime >= updateTime.getTime()) {
        repoCommand.push(`helm repo update`);

        if(process.env.GITHUB_CACHE_IN_MINUTES) {
            updateTime = new Date(currentTime + process.env.GITHUB_CACHE_IN_MINUTES*60000);
        }
    }

    console.log(repoCommand.join(' && '));

    exec(repoCommand.join(' && '), (error, stdout, stderr) => {
        if (error || stderr) {
            res.statusCode = 500;
            console.debug(error);
            res.end(stderr);
            return;
        }

        if(!repositories.includes(repoName)) {
            repositories.push(repoName);
        }

        if (req.url.includes('.tgz')) {

            const chartUrl = `github+release:/${req.url}`;
            const pullCommand = `export GITHUB_TOKEN=${token} && helm pull --destination /tmp ${chartUrl}`;
            let pullResponse = '';
            try {
                pullResponse = execSync(pullCommand).toString();
            } catch (error) {
                res.statusCode = 500;
                console.debug(error);
                res.end(stderr);
                return;
            }

            fs.readFile(`/tmp/${chartFile}`, (err, data) => {
                if (err) {
                    res.statusCode = 404;
                    console.log(err.message);
                    res.end(`Chart not found: ${chartUrl}`);
                    return;
                };
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/tar+gzip');
                res.end(data);
            });
        } else {
            exec(`export GITHUB_TOKEN=${token} && cat $(helm env HELM_REPOSITORY_CACHE)/${repoName}-index.yaml `, (error, stdout, stderr) => {
                if (error || stderr) {
                    res.statusCode = 500;
                    console.debug(error);
                    res.end(stderr);
                    return;
                }

                res.statusCode = 200;
                res.end(stdout.replace(/github\+release:\/\//g, schema + '://' + host + '/'));
            });
        }
    });

});

server.listen(port, hostname, () => {
    console.log(`Proxy running at http://${hostname}:${port}/`);
});

var signals = {
    'SIGHUP': 1,
    'SIGINT': 2,
    'SIGTERM': 15
};
const shutdown = (signal, value) => {
    console.log("shutdown!");
    server.close(() => {
        console.log(`server stopped by ${signal} with value ${value}`);
        process.exit(128 + value);
    });
};
Object.keys(signals).forEach((signal) => {
    process.on(signal, () => {
        console.log(`process received a ${signal} signal`);
        shutdown(signal, signals[signal]);
    });
});