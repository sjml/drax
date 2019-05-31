const fs = require('fs');
const chalk = require('chalk');
const execSync = require('child_process').execSync

const keys = {
  repo: 'https://github.com/sjml/drax.git',
  user: 'dh_sv9qqc',
  server: 'drax.io',
  devDir: './dev.drax.io',
  stableDir: './drax.io',
  stampZone: 'America/New_York'
}

const config = {
  default: {
    // workspace: './tmp/drax-build',
    repositoryUrl: keys.repo,
    branch: 'master',
    shallowClone: true,
    dirToCopy: 'dist',

    servers: `${keys.user}@${keys.server}`,
    deployTo: keys.stableDir,
    keepReleases: 10,
    deleteOnRollback: false
  },
  dev: {
    deployTo: keys.devDir,
    keepReleases: 1,
    deleteOnRollback: false
  }
};

module.exports = function(shipit) {
  require('shipit-deploy')(shipit);

  shipit.initConfig(config);

  shipit.blTask('build', function () {
    shipit.log(chalk.green('Making fresh production build'));
    const commands = [
      'npm install --production',
      'npm install @angular-devkit/build-angular',
      'npm run build'
    ];
    return shipit.local(
            commands.join('; '),
            {cwd: shipit.workspace}
          )
          .then(function () {
            shipit.emit('built');
          });
  });

  shipit.blTask('stamp', function() {
    shipit.log(chalk.green('Adding git-rev and timestamp'));
    const time = execSync(`TZ=${keys.stampZone} date +"%l:%M %p %Z, %d %B %Y"`,
                    {encoding: 'utf-8'}).toString().trim();
    const fullRev = execSync('git rev-parse HEAD',
                    {encoding: 'utf-8', cwd: shipit.workspace}).toString().trim();
    let rev = execSync('git rev-parse --short HEAD',
                    {encoding: 'utf-8', cwd: shipit.workspace}).toString().trim();

    let tag = null;
    let oldTag = null;
    try {
      tag = execSync('git describe --exact-match --tags $(git log -n1 --pretty=\'%h\')',
                    {encoding: 'utf-8', cwd: shipit.workspace}).toString().trim();
      oldTag = execSync('git tag | tail -2 | head -1',
                    {encoding: 'utf-8', cwd: shipit.workspace}).toString().trim();
      rev = tag;
    }
    catch(err) {
      /* no-op; keep it as the short-rev */
      tag = null;
      oldTag = null;
    }

    let link = '';
    if (tag !== null && oldTag !== null) {
      link = `https://github.com/sjml/drax/compare/${oldTag}...${tag}`
    }
    else {
      link = `https://github.com/sjml/drax/commit/${fullRev}`;
    }

    const aboutFile = `${shipit.workspace}/dist/assets/pages/about.md`;
    const aboutContents = fs.readFileSync(aboutFile, 'utf-8');
    const stamped = aboutContents
                      .replace('%%DEPLOY_TIME%%', time)
                      .replace('%%GIT_LINK%%', link)
                      .replace('%%GIT_REV%%', rev);
    fs.writeFileSync(aboutFile, stamped);
    return shipit.local('pwd').then(function () {
      shipit.emit('stamped');
    });
  });

  shipit.blTask('prep', function () {
    shipit.log(chalk.green('Prepping distribution'));
    const commands = [
      'cp ../../config/secrets.php ./auth/',
      'cp ../../config/drax-config.json ./',
      'cp ../../config/htaccess ./.htaccess'
    ];
    return shipit.remote(
            commands.join('; '),
            {cwd: `${shipit.releasePath}`}
          )
          .then(function () {
            shipit.emit('prepped');
          });
  });

  // dummy task
  shipit.task('pwd', function () {
    return shipit.remote('pwd');
  });

  shipit.on('built', function () {
    return shipit.start('stamp');
  });

  shipit.on('fetched', function () {
    return shipit.start('build');
  });

  shipit.on('updated', function () {
    return shipit.start('prep');
  });
};
