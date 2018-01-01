# TODO

## UI
* flash messages (successful save / unsuccessful save / file changed / etc.)
* let you choose different branches
* icon for repos (and chevron at right)
* fix layout of long directory names (consider tooltip for long names in general?)
  * once we're doing tooltips, show description of repos?
* check with rotated monitor how continuations go
* use actual button styling/logic instead of reproducing it?
    * enable/disable

## Bugs
* set up a lock so onScroll response can't get double-called
* wrapped formatting across multiple paragraphs breaks
* patch codemirror's markdown processing so italics and bold don't carry across list items

## Polish
* update to use proper GraphQL variables instead of replacing
* surface an error if authorization status is not 'OK'
* make auth URL a configurable parameter (4201)
* give back nothing from graphql query if we're not logged in
* use getenv('variable_name') as option when constructing secrets in PHP

## Offline Mode
* cache docs in local storage until they're pushed? 
* recognize when GitHub is unreachable and just let us access the cache
* need to store repository info too... 😬

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
  * `.txt`
  * `.Rmd`

## Features
1. Remote configuration
2. Release script for putting on public host.
    - check when dir is a few levels deep :-/
3. UI revamp + expanded editing toolbar
    - lists (unordered and numbered)
        - if nesting, alternate bullet items (*-+)
    - blockquotes
    - horizontal rules
    - links
    - images? 
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
6. Merge changes if we're out of sync with the server
7. Frontmatter parsing into options? 
8. Offline mode
