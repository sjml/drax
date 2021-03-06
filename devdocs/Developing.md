# Developing Drax

Drax is built with [Angular](https://angular.io) and just a soupçon of PHP. If you're developing Drax, you're probably most interested in the frontend side of it, but you still have to do some PHP setup. 

You'll need:
* A working [PHP](http://php.net/) installation. macOS ships with a pretty recent version that is good enough for our purposes. Any other platform, you're on your own. 
* A working [Node.js](https://nodejs.org) installation. There are [tons](https://nodejs.org/en/download/) of [ways](https://github.com/creationix/nvm) to [install](https://brew.sh/) Node.js and all of them are crummy along some axis. If you don't already have an opinion on it, just use [the standard installer](https://nodejs.org/en/download/current/). 

As with most Node-based projects, things are run through the `npm` command. 

## Developing
Much like when [administering a Drax site](./Administration.md), you'll need to make your own GitHub OAuth application and put the keys into `php/auth/secrets.php`. 

From the root directory of Drax, you just need to run `npm install` to get all the dependencies and little goodies. It will also try and install the necessary PHP stuff, so be on the lookout for errors unrelated to Node. 

After that, running `npm run dev` will do two things: 
* Start the Angular dev server listening on `localhost:4200`
* Start a PHP server listening on `localhost:4201`

Killing the process should kill both servers, but I haven't tested this thoroughly. There's almost certainly a smarter way to handle it, but this works fine for development. 

After the initial authentication with GitHub, Drax saves a bearer token in the browser's local storage, so you don't actually need the PHP server unless you're getting prompted to sign in to GitHub. 

As you edit files, the server will detect and reload the application in your browser. 

I recommend [Visual Studio Code](https://code.visualstudio.com/) as an editor, with either the [Debugger for Chrome](https://marketplace.visualstudio.com/items?itemName=msjsdiag.debugger-for-chrome) or [Debugger for Firefox](https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-firefox-debug) addon. If you have another tool you prefer, hey, you do you. 

### Dev Configuration
Values in `drax-config.dev.json` will override those in `drax-config.json` while Angular is in development mode. The `dev.json` file is removed from the final distribution. 

## Building
Run `npm run build` to get compiled, minified, deployable app in the `dist` directory. 

## Deploying
There's a deployment script that uses [Shipit](https://github.com/shipitjs/shipit), looking for configuration settings in a `deploy-keys.json` file. In that file, you need: 
* `repo`: path to the remote git repository
* `user`: username on your deployment server
* `server`: address of your deployment server
* `deployDir`: directory on server where the application will be served, relative to your `~` home path

In the server's deployment directory you'll need a config directory that contains your `secrets.php` and `drax-config.json` file for this installation.

From the root directory run `npm run deploy`. Note that you'll have to set your remote host to serve from the "current" directory if you do this. (If this is confusing, read up on how [shipit-deploy](https://github.com/shipitjs/shipit-deploy) works.)
