<picture class="draxLogo">
    <source media="(min-width: 900px)" srcset="./assets/images/DraxLogo.svg">
    <source media="(max-width: 899px)" srcset="./assets/images/DraxLogoSimple.svg">
    <img src="./assets/images/DraxLogo.svg" alt="Logo for drax.io" class="draxLogo">
</picture>

Drax is a Markdown editor for GitHub repositories, aimed at a writer/editor workflow. 

[See what it's like to write prose in Drax](/#/playground), complete with annotations and formatting. 

If you're a writer who's wondering how to get started, check out the [user guide](/#/pages/user_guide). If you already have a GitHub account and want to see how it works on your own stuff, log in and find a repo with a Markdown document to edit.

There are lots of web-based Markdown editors, but this one is designed with two chief goals: 
1. Make it easy to edit files on GitHub for people who know next-to-nothing about it. 
2. Have Markdown editing be more intuitive for people used to Microsoft Word or Google Docs. 


## Work in Progress
Drax is still [being developed](https://github.com/sjml/drax). Or maybe not; it could have died off by the time you read this. Check the deployment date at the bottom of this page. The point is, there are features incoming. 

Things to expect:
* Overall UI polish. 
    * Including a logo that's not as weird. Hopefully. Maybe. 
* Image uploading. 

Things Drax intentionally doesn't do:
* **Real-time collaboration**: unless there is some magic wand to wave to make this trivial and not require a server component. 
* **WYSIWYG editor**: The goal is to make Markdown a little more manageable, not pretend you aren't writing Markdown. 
* **Things other than GitHub for storing files**: other online editors become super clunky as they try to support multiple backends. 
* **Editing non-Markdown files**: actually, you can already do this as they just show up as plaintext, but it's not really the most interesting use case. 
* **Advanced Git features**: Drax is not meant to replace the command line or other fancy tools; it's aimed squarely at writers and thus purposely abstracts away a lot of Git's underbelly.


<div class="deployInfo">
  <span class="icon fa fa-github"></span><a href="https://github.com/sjml/drax/commit/%%GIT_FULL_REV%%">%%GIT_REV%%</a> deployed at %%DEPLOY_TIME%%
</div>
