const fs = require('fs');
const chalk = require('chalk');
const execSync = require('child_process').execSync

const config = {
  default: {
    workspace: './tmp/drax-build',
    repositoryUrl: 'https://github.com/sjml/drax.git',
    shallowClone: true,
    dirToCopy: 'dist',

    servers: `dh_sv9qqc@drax.io`,
    deployTo: "./drax.io",
    keepReleases: 10,
    deleteOnRollback: true
  },
  dev: {
    deployTo: "./dev.drax.io",
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

  shipit.blTask('stamp', function() {
    shipit.log(chalk.green('Adding git-rev and timestamp'));
    const time = execSync('date +"%l:%M %p %Z, %d %B %Y"', {encoding: 'utf-8'})
                    .toString().trim();
    const rev = execSync('git rev-parse --short HEAD', {encoding: 'utf-8', cwd: shipit.config.workspace})
                    .toString().trim();
    const fullRev = execSync('git rev-parse HEAD', {encoding: 'utf-8', cwd: shipit.config.workspace})
                    .toString().trim();

    const aboutFile = `${shipit.config.workspace}/src/assets/pages/about.md`;
    const aboutContents = fs.readFileSync(aboutFile, 'utf-8');
    const stamped = aboutContents
                      .replace('%%DEPLOY_TIME%%', time)
                      .replace('%%GIT_FULL_REV%%', fullRev)
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

  // dummy function
  shipit.task('pwd', function () {
    return shipit.remote('pwd');
  });

  shipit.on('fetched', function () {
    return shipit.start('stamp');
  });

  shipit.on('stamped', function () {
    return shipit.start('build');
  });

  shipit.on('updated', function () {
    return shipit.start('prep');
  });
};
