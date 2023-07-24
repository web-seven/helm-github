const { Octokit } = require("@octokit/rest");
const https = require('https');
const fs = require('fs');
module.exports = async function (repoUrl, GITHUB_TOKEN) {
    let [owner, repo] = repoUrl.replace('github://', '').split('/');
    const octokit = new Octokit({
        auth: GITHUB_TOKEN,
    });

    let pageNumber = 0;
    let loadNextPage = true;
    console.log("Fetching all releases from " + owner + "/" + repo);
    while (loadNextPage) {
        console.log("Fetching page " + pageNumber);
        pageNumber++;
        await octokit.repos.
            listReleases({
                owner: owner,
                repo: repo,
                page: pageNumber,
                per_page: 100,
            })
            .then(({ data }) => {
                if (data.length == 0) {
                    loadNextPage = false;
                } else {
                    data.forEach((releaseData) => {
                        let assetUrl = releaseData.assets[0].url;
                        let assetFileName = releaseData.assets[0].name;
                        console.log("Downloading " + assetFileName);
                        const options = {
                            method: 'GET',
                            headers: {
                                Accept: 'application/octet-stream',
                                Authorization: 'token ' + GITHUB_TOKEN,
                                "X-GitHub-Api-Version": "2022-11-28",
                                "User-Agent": 'Helm-Plugin-Github'
                            }
                        };
                        const req = https.request(assetUrl, options, (res) => {

                            if (res.statusCode == 302) {
                                const redReq = https.request(res.headers.location, (res) => {

                                    res.on('data', (d) => {
                                        fs.appendFileSync(assetFileName, d);
                                    });
                                });

                                redReq.on('error', (e) => {
                                    process.stderr.write(e);
                                });
                                redReq.end();
                            } else {
                                res.on('data', (d) => {
                                    fs.appendFileSync(assetFileName, d);
                                });
                            }
                        });

                        req.on('error', (e) => {
                            process.stderr.write(e);
                        });
                        req.end();

                    })
                }
            });
    }
}