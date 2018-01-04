const fs = require('fs');
const chalk = require('chalk');

const keys = require('./deploy-keys');

const config = {
  default: {
    workspace: './tmp/drax-build',
    repositoryUrl: keys.repo,
    shallowClone: true,
    dirToCopy: 'dist',

    servers: `${keys.user}@${keys.server}`,
    deployTo: keys.deployDir,
    keepReleases: 10,
    deleteOnRollback: true
  },
};

module.exports = function(shipit) {
  require('shipit-deploy')(shipit);

  shipit.initConfig(config);

  shipit.blTask('build', function () {
    shipit.log(chalk.green('Making fresh production build'));
    const commands = [
      'npm install',
      'curl https://patch-diff.githubusercontent.com/raw/codemirror/CodeMirror/pull/5156.diff | patch -d node_modules/codemirror -p1',
      'npm run build'
    ];
    return shipit.local(
            commands.join('; '),
            {cwd: shipit.config.workspace}
          )
          .then(function () {
            shipit.emit('built');
          });
  });

  shipit.blTask('prep', function () {
    shipit.log(chalk.green('Prepping distribution'));
    const confFile = `${shipit.releasePath}/auth/secrets.php`;
    const commands = [
      'cp ../../config/secrets.php ./auth/',
      'cp ../../config/drax-config.json ./'
    ];
    return shipit.remote(
            commands.join('; '),
            {cwd: `${shipit.releasePath}`}
          )
          .then(function () {
            shipit.emit('prepped');
          });
  });

  shipit.task('pwd', function () {
    return shipit.remote('pwd');
  });

  shipit.on('fetched', function () {
    return shipit.start('build');
  });

  shipit.on('updated', function () {
    return shipit.start('prep');
  });
};
