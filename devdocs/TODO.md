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

## Polish
* different colors for annotations from different people
* spinners for saving and loading stuff in the explorer
* ability to toggle off links?
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
1. Keyboard commands
    - for toolbar buttons as makes sense
    - escape to dismiss modals and save popup
    - cmd-s to save, cmd-r to refresh
2. Annotation files detecting if they're out of sync.
    - tries to correct if it can, based on range of annotation: 
      1. if it's been deleted, annotation goes with it
      2. if there have been additions or deletions before it, modify as needed
3. Image uploading
4. HTML preview + side-by-side
5. Fix mobile version? 
    - might not be possible to get CodeMirror working the way it needs to...
    - is this really a use case to support? Possibly not.
6. Single repo mode
    - templates for new files
    - setting to prevent creation of new files, new directories
7. Merge changes if we're out of sync with the server
8. Frontmatter parsing into options? 
9. Offline mode and/or live collaboration
    - resurrect the prosemirror branch for this, or examine stuff like Quill, Slate, etc.
