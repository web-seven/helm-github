const { Octokit } = require("@octokit/rest");
const https = require('https');
const fs = require('fs');
const GITHUB_DELAY = process.env['GITHUB_DELAY']?process.env['GITHUB_DELAY']:1000;
async function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
} 
module.exports = async function (repoUrl, GITHUB_TOKEN) {
    let [owner, repo] = repoUrl.replace('github://', '').split('/');
    const octokit = new Octokit({
        auth: GITHUB_TOKEN,
    });

    let pageNumber = 0;
    let loadNextPage = true;
    console.log("Fetching all releases from " + owner + "/" + repo);
    let releases = [];
    console.log("Getting releases metadata...");
    while (loadNextPage) {
        console.log("received " + ((pageNumber + 1) * 100) + " releases metadata");
        pageNumber++;
        await octokit.repos.listReleases({
            owner: owner,
            repo: repo,
            page: pageNumber,
            per_page: 100
        })
        .then(({ data }) => {
            if (data.length == 0) {
                loadNextPage = false;
            } else {
                releases = [...releases, ...data];
            }
        });
    }
    let startTime = new Date().getTime();
    console.log('Starting download of ' + releases.length + ' releases assets.');
    let i = 0;
    for (let releaseData of releases) {
        i++;
        if(releaseData.assets.length == 0) {
            console.log("Release " + releaseData.name + " has no assets. Skipping.");
            continue;
        }
        let assetUrl = releaseData.assets[0].url;
        let assetFileName = releaseData.assets[0].name;
        const options = {
            method: 'GET',
            headers: {
                Accept: 'application/octet-stream',
                Authorization: 'token ' + GITHUB_TOKEN,
                "X-GitHub-Api-Version": "2022-11-28",
                "User-Agent": 'Helm-Plugin-Github'
            }
        };
        await delay(parseInt(GITHUB_DELAY));
        console.log(assetFileName + " (" + i + " from " + releases.length + ", " + Math.round((new Date().getTime() - startTime) / 1000) + "s from "+ (((releases.length-i)*GITHUB_DELAY)/1000) +"s left)");
        const req = https.request(assetUrl, options, (res) => {

            if (res.statusCode == 302) {
                const redReq = https.request(res.headers.location, (redRes) => {
                    redRes.on('data', (d) => {
                        fs.appendFileSync(assetFileName, d);
                    });
                });
                redReq.on('error', (e) => {
                    console.error(e);
                });
                redReq.end();
            } else {
                res.on('data', (d) => {
                    fs.appendFileSync(assetFileName, d);
                });
            }
        });
        req.on('error', (e) => {
            console.error(e);
        });
        req.end();
    };
}