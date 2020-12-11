const http = require('http');
const { exec, execSync } = require("child_process");
const fs = require('fs');

const hostname = process.env.GITHUB_PROXY_HOST_NAME ? process.env.GITHUB_PROXY_HOST_NAME : '0.0.0.0';
const port = process.env.GITHUB_PROXY_PORT ? process.env.GITHUB_PROXY_PORT : 7000;

const server = http.createServer((req, res) => {

    res.setHeader('Content-Type', 'text/plain');
    const [owner, repo, chartFile] = req.url.replace(/^\/|\/$/g, '').split('/');
    const repoName = owner + '/' + repo;
    const host = req.headers.host;
    let schema = 'http';
    if (port == 443) {
        schema = 'https';
    }

    exec(`helm repo add ${repoName} github://${repoName} && helm repo update `, (error, stdout, stderr) => {
        if (error || stderr) {
            res.statusCode = 500;
            console.debug(error);
            res.end(stderr);
            return;
        }

        if (req.url.includes('.tgz')) {

            const chartUrl = `github+release:/${req.url}`;
            const pullCommand = `helm pull --destination /tmp ${chartUrl}`;
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
            exec(`cat $(helm env HELM_REPOSITORY_CACHE)/${repoName}-index.yaml `, (error, stdout, stderr) => {
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