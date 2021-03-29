const fs = require("fs");
const releaseUrl = process.argv[2];
let path = releaseUrl.replace('github+file://', '');
let [owner, repo] = path.split('/', 2);
let file = path.replace(owner + '/' + repo, '');
if (fs.existsSync(file)) {
    process.stdout.write(fs.readFileSync(file));
} else {
    process.stderr.write('File not found: ' + file);
}

