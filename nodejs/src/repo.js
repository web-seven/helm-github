const { Octokit } = require("@octokit/rest");
const yaml = require("js-yaml");
const GITHUB_TOKEN = process.env['GITHUB_TOKEN'];

if (!GITHUB_TOKEN) {
    process.stderr.write('GITHUB_TOKEN not found in evironment.\n');
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
            const releseDelim = release.name.split('-');
            const version = releseDelim[releseDelim.length - 1];
            const chartName = release.name.replace('-' + version, '');
            if (repoData.entries[chartName] == undefined) {
                repoData.entries[chartName] = [];
            }
            const releaseData = {
                apiVersion: "v2",
                version: version,
                name: chartName,
                appVersion: version,
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

        process.stdout.write(yaml.safeDump(repoData));
    });

