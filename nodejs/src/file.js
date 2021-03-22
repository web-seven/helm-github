const fs = require("fs");
const releaseUrl = process.argv[2];
let path = releaseUrl.replace('github+file://', '');
let [owner, repo] = path.split('/', 2);
let file = path.replace(owner+'/'+repo, '');
process.stdout.write(fs.readFileSync(file));

