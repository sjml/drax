# TODO

## Features
1. Push back changed file with customized message
2. Detect if file in repo has changed since we started editing
3. Merge changes? 
4. Remote configuration
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

## UI
* let you choose different branches
* put path in location
  * be able to pull from location to set path to repo/dir/file
  * AppRoutingModule?
* fix layout of long directory names (consider tooltip for long names in general?)
  * once we're doing tooltips, show description of repos?

## Bugs
* check if continuation is visible on first load (tall monitor)
* set up a lock so onScroll response can't get double-called

## Polish
* update to use proper GraphQL variables instead of replacing
* surface an error somehow if authorization status is not 'OK'
* make auth URL a configurable parameter (4201)
* give back nothing from graphql query if we're not logged in

## Configuration
* hide dotfiles
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
  * `.Rmd`