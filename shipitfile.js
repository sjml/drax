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
    return shipit.local(
            'npm install; npm run build',
            {cwd: shipit.config.workspace}
          )
          .then(function () {
            shipit.emit('built');
          });
  });

  shipit.blTask('prep', function () {
    shipit.log(chalk.green('Prepping distribution'));
    const baseFile = `${shipit.config.workspace}/dist/auth/secrets.php.base`;
    const confFile = `${shipit.config.workspace}/dist/auth/secrets.php`;
    let template = fs.readFileSync(baseFile, 'utf8');
    template = template
                .replace('YOUR_CLIENT_ID_HERE', keys.clientID)
                .replace('YOUR_CLIENT_SECRET_HERE', keys.clientSecret)
              ;
    fs.writeFileSync(confFile, template);
    return shipit.local(`rm ${baseFile}`);
  });

  shipit.on('fetched', function () {
    return shipit.start('build');
  });

  shipit.on('built', function () {
    return shipit.start('prep');
  });
};
