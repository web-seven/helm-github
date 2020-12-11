const { Octokit } = require("@octokit/rest");
const yaml = require("js-yaml");
const https = require('https');
const GITHUB_TOKEN = process.env['GITHUB_TOKEN'];

if (!GITHUB_TOKEN) {
    process.stderr.write('GITHUB_TOKEN not found in environment.\n');
    return;
}

const octokit = new Octokit({
    auth: GITHUB_TOKEN
});

const releaseUrl = process.argv[2];
let [owner, repo, releaseName] = releaseUrl.replace('github+release://', '').replace('.tgz', '').split('/');

octokit.repos.
    listReleases({
        owner: owner,
        repo: repo,
    })
    .then(({ data }) => {
        data.forEach((releaseData) => {
            if (releaseData.name == releaseName) {
                let assetUrl = releaseData.assets[0].url;
                const options = {
                    method: 'GET',
                    headers: {
                        Accept: 'application/octet-stream',
                        Authorization: 'token ' + GITHUB_TOKEN,
                        "User-Agent": 'Helm-Plugin-Github'
                    }
                };

                const req = https.request(assetUrl, options, (res) => {

                    if (res.statusCode == 302) {
                        const redReq = https.request(res.headers.location, (res) => {

                            res.on('data', (d) => {
                                process.stdout.write(d);
                            });
                        });

                        redReq.on('error', (e) => {
                            process.stderr.write(e);
                        });
                        redReq.end();
                    } else {
                        res.on('data', (d) => {
                            process.stdout.write(d);
                        });
                    }
                });

                req.on('error', (e) => {
                    process.stderr.write(e);
                });
                req.end();
            }
        })
    });

