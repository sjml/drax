# TODO

## UI
* flash messages (successful save / unsuccessful save / file changed / etc.)
* let you choose different branches
* fix layout of long directory names (consider tooltip for long names in general?)
  * once we're doing tooltips, show description of repos?
* check with rotated monitor how continuations go
* figure out how to deal with binary files...
* ugh, the icon layering is a pain; maybe upgrade to FA5 to use the SVG stuff

## Bugs
* blockquote toggling across multiple paragraphs
    * also bullet lists
* annotation lines get screwy when view gets widened and sidebar locks in
* set up a lock so onScroll response can't get double-called
* chevrons can get out of alignment on long names (isbw-python-widget is example)
* navlist gets screwy on logout
* single-character selections mess up post-formatting selection on ** and _
* shipit rev-stamps from the enclosing repo, not the one actually being deployed

## Polish
* spinners for saving and loading stuff in the explorer
* ability to toggle off links?
* Look into whether it makes sense to toggle comments back on if they were on before we switched away and back (per-file mode, persistent storage? )
* store docs so undo history is preserved across navigation
* update to use proper GraphQL variables instead of replacing
    - also unify formatting of all the various queries
* surface an error if authorization status is not 'OK'
* give back nothing from graphql query if we're not logged in
* use getenv('variable_name') as option when constructing secrets in PHP
    - conditional include of secrets file, pull from env if not there, show error
* add server config files to dist: https://angular.io/guide/deployment#routed-apps-must-fallback-to-indexhtml
* logo
* add indicator for when repo has remote configuration ("Drax-enabled!")

## Offline Mode
* cache docs in local storage until they're pushed? 
* recognize when GitHub is unreachable and just let us access the cache
* need to store repository info too... 😬

## Features
0. Refactor 
    - separate out github access to be a service, leave UI as component
    - move from chain of components to proper routing
    - avoid weird if-elsing in githubaccess template
1. Playground
    - editor and annotations to play with sans GitHub account
2. UI 
    - spinners
    - flash messages
    - binary file handling/ignoring
    - warn before refreshing from server
3. Image uploading
4. HTML preview + side-by-side
5. Fix mobile version? 
    - might not be possible to get CodeMirror working the way it needs to...
    - is this really a use case to support? Possibly not.
6. Repo administration
    - templates for new files
    - setting to prevent creation of new files, new directories
7. Offer to merge changes if we're out of sync with the server?
8. Frontmatter parsing into options? 
9. Offline mode and/or live collaboration
    - resurrect the prosemirror branch for this, or examine stuff like Quill, Slate, etc.
