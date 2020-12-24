const { Octokit } = require("@octokit/rest");
const yaml = require("js-yaml");
const semver = require("semver");
const GITHUB_TOKEN = process.env['GITHUB_TOKEN'];

if (!GITHUB_TOKEN) {
    process.stderr.write('GITHUB_TOKEN not found in environment.\n');
    return;
}

const octokit = new Octokit({
    auth: GITHUB_TOKEN
});

const releaseUrl = process.argv[2];
let [owner, repo] = releaseUrl.replace('github://', '').split('/');

octokit.repos.
    listReleases({
        owner: owner,
        repo: repo,
    })
    .then(({ data }) => {

        const repoData = {
            apiVersion: 'v1',
            entries: {
            }
        }

        data.forEach((release) => {
            console.debug(release);
            const version = release.name.substr(release.name.indexOf(semver.coerce(release.name)));
            const chartName = release.name.replace('-' + version, '');
            if (repoData.entries[chartName] == undefined) {
                repoData.entries[chartName] = [];
            }
            release.assets.forEach((asset)=>{
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
            })
            
        })

        process.stdout.write(yaml.safeDump(repoData));
    });

