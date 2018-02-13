# Administrating Drax

Note: this document is for systems administrators who want to run their own version of Drax for their users, or for editors who want to customize how Drax works with their GitHub repository.

If you just want to edit and annotate documents, this doesn't apply to you. Just go to the [Drax home page](https://drax.io) and get started. 


## Repository Configuration
As the owner of a repository, you can add some configuration options for Drax that will affect how it interacts with your specific repository. At the root level, create a folder called `.drax` and put a file called `config.json` there. (Obviously make sure to commit and push this to GitHub so Drax can see it.) 

The following values are supported:
* `ignoreHiddenFiles`: Any file that starts with a `.` won't be displayed in the Drax file explorer. If a user tries to navigate to one directly from the URL, they'll be redirected to the repository root. Default value: `true`
* `contentRoot`: If you only want to limit the editable area of the repository, you can set a root directory that user's won't be able to explore or edit above. If you're working with [Hugo](https://gohugo.io/), for example, this might be `content`. Default value: empty string (entire repository is available)


## Installation
Drax is designed to be easily deployable. The frontend is an [Angular](https://angular.io) application, and the only thing it needs a server for is user authentication with GitHub. This means it won't work on a purely static hosting system like [Surge](http://surge.sh), since there's no way of doing the backend check. 

Out of the box this check uses PHP. I know, I know. Ew, right? I dislike PHP as much as [the next programmer](https://eev.ee/blog/2012/04/09/php-a-fractal-of-bad-design/), but it's still the most easily deployable server-side programming language we've got. Practically every budget web host in the world supports PHP, and getting it working is as simple as throwing the files into the webroot. Nothing else comes close. 

That said, the use of PHP is minimal. Minus dependencies, the logic of Drax's server component fits into about 60 lines of code. If you'd like a version in Go, Node.js, Ruby, whatever, pull requests are welcome. :smile: 

So, to install, it's just two steps. 
1. Grab the latest release from [the releases page](https://github.com/sjml/drax/releases).
2. Unzip it and put it somewhere hostable.

Of course, it won't be usable at all in this state. **You have to configure it first.** That's a little more complicated.


### Authentication Configuration
You need a GitHub account, which you probably already have if you're reading this. [Create a new OAuth application](https://github.com/settings/applications/new); you need to have your own dedicated app in GitHub's system. Call it whatever you want, and use whatever icons make sense for you, but take care with the callback URL at the bottom of the creation screen. That needs to be `/auth` relative to the Drax's hosted directory on your site. So if you were serving your installation from `http://drax.example.com`, this URL would need to be `http://drax.example.com/auth`. If you serve it from `https://example.com/drax/`, then the callback needs to be `https://example.com/drax/auth`. 

Once you've created your application, you'll be given two random strings that you'll use to prove your application's identity to GitHub. These are the "Client ID" and the "Client Secret." Open up the `auth` directory of the version of Drax you downloaded and edit the `secrets.php.base` file. Where it says `YOUR_CLIENT_ID_HERE` and `YOUR_CLIENT_SECRET_HERE`, put in the values for your own application. Then rename the file to `secrets.php`. 

(Remember that you will have to repeat this step if you update your installation of Drax and don't keep the secrets file.)

Your secrets file should ***never*** be put into source control. The distribution has a `.gitignore` file that should keep you from doing it accidentally, but be careful. 


### Site Configuration
At this point, your installation of Drax should be working in the default mode, more or less what you see at the [Drax home page](https://drax.io). This works pretty well, but if you just wanted the default mode, you probably wouldn't be installing this yourself. 

You can edit the `drax-config.json` file in the root of the distribution to change the site's behavior. The following values are supported: 
* `authUrl`: If you need to run the authorization server somewhere else (another domain or another port, for example), you can put the URL for it here and Drax will try to run the GitHub login through there. Default: `./auth`
* `singleRepo`: If you want your site to only allow viewing and editing of a particular repository, put its owner and name in an object here. So if you only wanted to allow editing of the [main Drax repository](https://github.com/sjml/drax), you would set it to `{ "owner": "sjml", "name": "drax" }`. Default is null, which allows editing of any repository which the logged-in user can acess. 

You'll also want to edit the [About page](../src/assets/pages/about.md), which gets displayed when Drax is first loaded, to put a custom greeting and information there. 
