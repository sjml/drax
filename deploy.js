#!/usr/bin/env node

// This is ugly but does the job. Might want to look into proper
//   deployment solutions eventually. :-/

const util      = require('util');
const exec      = util.promisify(require('child_process').exec);
const fs        = require('fs');
const ssh       = require('ssh2');

const keys = require('./deploy-keys');

async function build() {
  const {err, stdout, stderr} = await exec('npm run build');
  if (err) {
    console.error(err);
    console.error(stderr);
    process.exit(1);
  }
}

function prep() {
  const baseFile = 'dist/auth/secrets.php.base';
  let template = fs.readFileSync(baseFile, 'utf8');
  template = template
              .replace('YOUR_CLIENT_ID_HERE', keys.clientID)
              .replace('YOUR_CLIENT_SECRET_HERE', keys.clientSecret)
              ;
  fs.writeFileSync('dist/auth/secrets.php', template);
  exec(`rm ${baseFile}`);
  exec('tar -czvf dist.tar.gz -C dist .');
}

async function upload() {
  const conn = new ssh.Client();
  conn.on('ready', () => {
    console.log('client ready');
    conn.sftp((err, sftp) => {
      if (err) throw err;
      sftp.fastPut('dist.tar.gz', keys.staging + 'dist.tar.gz', (fpErr) => {
        if (fpErr) throw fpErr;
        conn.exec('mkdir -p dist; tar xzvf dist.tar.gz -C dist', (zErr, stream) => {
          if (zErr) throw fpErr;
          conn.exec('rm -rf drax.io; mv dist drax.io; rm dist.tar.gz', (mvErr, stream) => {
            if (mvErr) throw fpErr;
            conn.end();
          });
        });
      });
    });
  }).connect({
    host: keys.server,
    port: 22,
    username: keys.user,
    password: keys.password
  });
}

async function main() {
  console.log('Making fresh production build...');
  await build();
  console.log('Prepping distribution...');
  prep();
  console.log('Uploading...');
  upload();
}

main();
