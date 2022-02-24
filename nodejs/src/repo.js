const { Octokit } = require("@octokit/rest");
const yaml = require("js-yaml");
const semver = require("semver");
const fs = require('fs');
const merge = require('deepmerge')
const GITHUB_TOKEN = process.env['GITHUB_TOKEN'];
const HELM_GITHUB_MERGE_INDEX_FILE = process.env['HELM_GITHUB_MERGE_INDEX_FILE'];

if (!GITHUB_TOKEN) {
    process.stderr.write('GITHUB_TOKEN not found in environment.\n');
    return;
}

const octokit = new Octokit({
    auth: GITHUB_TOKEN
});

const releaseUrl = process.argv[2];
let [owner, repo] = releaseUrl.replace('github://', '').split('/');

let repoData = {
    apiVersion: 'v1',
    entries: {}
}

async function getReleases() {

    let pageNumber = 0;
    let loadNextPage = true;


    if (HELM_GITHUB_MERGE_INDEX_FILE && fs.existsSync(HELM_GITHUB_MERGE_INDEX_FILE)) {
        const mergeRepoIndex = yaml.load(fs.readFileSync(HELM_GITHUB_MERGE_INDEX_FILE));
        repoData = merge(mergeRepoIndex, repoData);
    }

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
                    data.forEach((release) => {

                        if (release.name && release.assets && release.assets.length > 0) {
                            const releaseParts = release.name.split("-");
                            const releaseVersion = [releaseParts[releaseParts.length - 2], releaseParts[releaseParts.length - 1]].join('-');
                            const version = release.name.substr(release.name.indexOf(semver.coerce(releaseVersion)));
                            const chartName = release.name.replace('-' + version, '');

                            if (semver.valid(version)) {
                                if (repoData.entries[chartName] == undefined) {
                                    repoData.entries[chartName] = [];
                                }
                                release.assets.forEach((asset) => {
                                    const releaseData = {
                                        apiVersion: "v2",
                                        version: version,
                                        name: chartName,
                                        appVersion: asset.label,
                                        type: 'application',
                                        description: release.body,
                                        digest: release.node_id,
                                        created: release.created_at,
                                        urls: [
                                            'github+release://' + owner + '/' + repo + '/' + release.name + '.tgz'
                                        ]
                                    };
                                    repoData.entries[chartName].push(releaseData);
                                });
                            }
                        }
                    })
                }
            })
            .catch((_error) => {
              // Stop processing when GitHub throws an error on any page.
              // Note: This could result in missing versions.
              loadNextPage = false;
            });
    }
    process.stdout.write(yaml.safeDump(repoData));
}

getReleases();



