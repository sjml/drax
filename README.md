# Drax
Drax is a web-hosted text editor designed for use with GitHub repos and Markdown. It is named for a Bond villain, not the destroyer.

Unlike other online collaboration tools, it only does GitHub, and it only does Markdown. This lets it be more lightweight and streamlined. Deployment is incredibly simple -- just put a directory on a webhost and you're golden. No big server bills or complicated setup. 

It doesn't do access control or user accounts; GitHub handles all of that. 

Drax is not meant as a realtime collaborative editor; a Git-based backend isn't really good for that. To do it right would also require a more complicated server component, too, which would make its deployment a lot harder. (I could imagine integrating something like that optionally in the future, but it also requires some design thought.)


## Usage
Point your users to the [user guide](./docs/User Guide.md) to ease them into both Git and Markdown. 


## Admin
Drax was designed to be easy and cheap to deploy. (It even goes so far as to use the oh-so-unfashionable hash routing to enable this simplicity.) Its [releases](https://github.com/sjml/drax/releases) are boring old directories that can just be thrown on a shared webhost and work with some simple configuration. Check out the [installation docs](./docs/Administration.md#installation) for how to customize a version of Drax for your own usage. 

Repository owners can also do some [configuration](./docs/Administration.md#repository-configuration) to change how any Drax editor will treat the repo. 

## Development
If you wanna hack on this thing, the [development docs](./docs/Developing.md) can get you started. 
