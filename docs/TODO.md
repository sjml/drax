# TODO

## UI
* tooltips for toolbar buttons and logout
* be able to sweep sidebar away when working
* flash messages (successful save / unsuccessful save / file changed / etc.)
* let you choose different branches
* fix layout of long directory names (consider tooltip for long names in general?)
  * once we're doing tooltips, show description of repos?
* check with rotated monitor how continuations go

## Bugs
* set up a lock so onScroll response can't get double-called
* wrapped formatting across multiple paragraphs breaks
* triggering wrapping with no selection on an empty line
* some strangeness around formatting toggles at word border
* chevrons can get out of alignment on long names (isbw-python-widget is example)

## Polish
* store docs so undo history is preserved across navigation
* update to use proper GraphQL variables instead of replacing
* surface an error if authorization status is not 'OK'
* give back nothing from graphql query if we're not logged in
* use getenv('variable_name') as option when constructing secrets in PHP
    - conditional include of secrets file, pull from env if not there, show error
* add server config files to dist: https://angular.io/guide/deployment#routed-apps-must-fallback-to-indexhtml
* add indicator for when repo has remote configuration ("Drax-enabled!")
* logo

## Offline Mode
* cache docs in local storage until they're pushed? 
* recognize when GitHub is unreachable and just let us access the cache
* need to store repository info too... 😬

## Configuration
* only show markdown files?
  * `.markdown`
  * `.mdown`
  * `.mkdn`
  * `.md`
  * `.mkd`
  * `.mdwn`
  * `.mdtxt`
  * `.mdtext`
  * `.text`
  * `.txt`
  * `.Rmd`

## Features
1. expanded editing GUI
    - finish button implementations
    - word count
2. New document creation system (templates?)
    - new directories? New repositories? 
3. History/restore? 
4. Annotation system
    1. separate file storage?
    2. annotation is a range of text, an author, a timestamp, and an MD-formatted string
    3. rendering of annotations
    4. creation/deletion of annotations, push with rest of file
    5. annotation file has git hash of parent file, knows if it's out of sync
       - tries to correct if it can, based on range of annotation: 
         1. if it's been deleted, annotation goes with it
         2. if there have been additions or deletions before it, modify as needed
5. Image uploading
6. HTML preview + side-by-side
7. About pages / tutorial?
8. Single repo mode
9. Merge changes if we're out of sync with the server
10. Frontmatter parsing into options? 
11. Offline mode