const { Octokit } = require("@octokit/rest");
const yaml = require("js-yaml");
const https = require('https');
const GITHUB_TOKEN = process.env['GITHUB_TOKEN'];
const GITHUB_DELAY = process.env['GITHUB_DELAY'];

if (!GITHUB_TOKEN) {
    process.stderr.write('GITHUB_TOKEN not found in environment.\n');
    return;
}

const octokit = new Octokit({
    auth: GITHUB_TOKEN
});

const releaseUrl = process.argv[2];
let [owner, repo, releaseName] = releaseUrl.replace('github+release://', '').replace('.tgz', '').split('/');

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
} 

async function getRelease() {

    let pageNumber = 0;
    let loadNextPage = true;

    while (loadNextPage) {
        pageNumber++;
        await octokit.repos.
            listReleases({
                owner: owner,
                repo: repo,
                page: pageNumber,
                per_page: 100
            })
            .then(({ data }) => {
                if (data.length == 0) {
                    loadNextPage = false;
                } else {
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
                            loadNextPage = false;
                        }
                    })
                }
            }).catch((e) => {
                process.stderr.write(e);
                loadNextPage = false;
            });
            
            if(GITHUB_DELAY) {
                await delay(parseInt(GITHUB_DELAY));
            }
    }
}

getRelease();

