const { Octokit } = require("@octokit/rest");
const os = require('os')
const fs = require('fs-extra')
const yaml = require("js-yaml");
var path = require('path');
var tar = require('tar');
const GITHUB_TOKEN = process.env['GITHUB_TOKEN'];

const octokit = new Octokit({
    auth: GITHUB_TOKEN,
});

const command = process.argv[2];
const releaseFile = process.argv[3];
const repositoryName = process.argv[4];

function tarballPathToMemorySync(tarballPath, fileInTar) {
    let entryBuffer = undefined;
    let found = false;
    const onentry = entry => {
        if (!found && entry.path.search(fileInTar) > -1) {
            found = true;
            let data = []
            entry.on('data', c => {
                data.push(c)
            })
            entry.on('finish', () => {
                entryBuffer = Buffer.concat(data);
            })
        }
    }

    const tmpDir = path.join(os.tmpdir(), 'temporary-tars', 'helm-gihub')
    fs.mkdirpSync(tmpDir)

    const extract = tar.x({
        onentry,
        cwd: tmpDir,
        sync: true
    })
    const tarball = fs.readFileSync(tarballPath)
    extract.write(tarball)
    fs.removeSync(tmpDir)
    return entryBuffer
}


switch (command) {
    case 'push':
        const buf = tarballPathToMemorySync(releaseFile, /Chart\.yaml/)
        const chartMeta = yaml.load(buf.toString())
        const reposConfig = yaml.load(fs.readFileSync(process.env.HELM_REPOSITORY_CONFIG).toString());
        const chartName = chartMeta.name + '-' + chartMeta.version;
        reposConfig.repositories
            .filter(repoConfig=>repoConfig.name === repositoryName)
            .forEach(repoConfig => {
                let [owner, repo] = repoConfig.url.replace('github://', '').split('/');
                const githubRelease = octokit.repos.createRelease({
                    owner: owner,
                    repo: repo,
                    tag_name: chartName,
                    name: chartName,
                    body: chartMeta.description,
                }).then(({data})=>{
                    octokit.repos.uploadReleaseAsset({
                        owner,
                        repo,
                        release_id: data.id,
                        data: fs.readFileSync(releaseFile),
                        name: path.basename(releaseFile),
                        label: chartMeta.appVersion
                    }).then((asset)=>{
                        if(asset.status === 201) {
                            process.stdout.write(`Chart "${chartName}" released.\n`);
                        }
                    }).catch(e=>{
                        process.stdout.write(`Chart not released because of: ${e.message}.\n`);
                    });
                }).catch(e=>{
                    process.stdout.write(`Chart not released because of: ${e.message}.\n`);
                });
            })
        break;
    default:
        process.stdout.write(`${command} command not supported, please check documentation.\n`);
}