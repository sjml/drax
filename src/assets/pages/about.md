# Drax

Drax is a Markdown editor for GitHub repositories, aimed at a writer/editor workflow. 

If you're a writer who's wondering how to get started, check out the [user guide](/#/pages/user_guide). If you already have a GitHub account and want to see how it works, log in and find a repo with a Markdown document to edit.

There are lots of web-based Markdown editors, but this one is designed with two chief goals: 
1. Make it easy to edit files on GitHub for people who know next-to-nothing about it. 
2. Have Markdown editing be more intuitive for people used to Microsoft Word or Google Docs. 


## Work in Progress
Drax is still [being developed](https://github.com/sjml/drax). (Or maybe not; it could have died off by the time you read this. Check the deployment date at the bottom of this page.) The point is, there are features incoming. 

Things to expect:
* Better keyboard shortcuts and overall UI polish. 
* Better error handling.
    * At the moment, if something goes wrong (you lose internet connection, the repository no longer exists, etc.), things just silently fail. This will be more graceful.
* The annotation system to work when file changes are made outside of Drax.
    * Right now it probably explodes. That hasn't been tested. Not even a little.
* Image uploading. 
* Live HTML rendered preview.

Things not to expect:
* **Real-time collaboration**: unless there is some magic wand to wave to make this trivial and not require a server component. 
* **WYSIWYG editor**: The goal is to make Markdown a little more manageable, not pretend you aren't writing Markdown. 
* **Things other than GitHub for storing files**: other online editors become super clunky as they try to support multiple backends. 
* **Editing non-Markdown files**: actually, you can already do this as they just show up as plaintext, but it's not really the most interesting use case. 
* **Advanced Git features**: Drax is not meant to replace the command line or other fancy tools; it's aimed squarely at writers and thus purposely abstracts away a lot of Git's underbelly.

Feedback that Would be Useful:
* Bug reports! 
* Feature requests (taking into account the above "things not to expect")
* Places that might confuse people
* Spots where someone using more advanced Git features makes Drax look broken

Please use the [GitHub project's issues page](https://github.com/sjml/drax/issues) to submit your feedback. 

<div class="deployInfo">
  revision <span class="icon fa fa-github"></span><a href="https://github.com/sjml/drax/commit/%%GIT_FULL_REV%%">%%GIT_REV%%</a> deployed at %%DEPLOY_TIME%%
</div>
