# TODO

## UI
* tooltips for toolbar buttons and logout
* flash messages (successful save / unsuccessful save / file changed / etc.)
* let you choose different branches
* fix layout of long directory names (consider tooltip for long names in general?)
  * once we're doing tooltips, show description of repos?
* check with rotated monitor how continuations go

## Bugs
* set up a lock so onScroll response can't get double-called
* chevrons can get out of alignment on long names (isbw-python-widget is example)
* navlist gets screwy on logout
* single-character selections mess up post-formatting selection on ** and _

## Polish
* spinners for saving and loading stuff in the explorer
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
0. Button enhancements (toggles/icon changes/cursor detection)
    - "if (!startTok)" -- how about when you wanna start typing as one of these?
1. New document creation system (templates?)
    - new directories? New repositories? 
2. History/restore? 
3. Annotation system
    1. separate file storage?
    2. annotation is a range of text, an author, a timestamp, and an MD-formatted string
    3. rendering of annotations
    4. creation/deletion of annotations, push with rest of file
    5. annotation file has git hash of parent file, knows if it's out of sync
       - tries to correct if it can, based on range of annotation: 
         1. if it's been deleted, annotation goes with it
         2. if there have been additions or deletions before it, modify as needed
4. Image uploading
5. HTML preview + side-by-side
6. About pages / tutorial?
7. Single repo mode
8. Merge changes if we're out of sync with the server
9. Frontmatter parsing into options? 
10. Offline mode and/or live collaboration
    - resurrect the prosemirror branch for this, or examine stuff like Quill, Slate, etc.
