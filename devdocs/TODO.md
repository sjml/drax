# TODO

## UI
* let you choose different branches
* fix layout of long directory names (consider tooltip for long names in general?)
  * once we're doing tooltips, show description of repos?
* check with rotated monitor how continuations go
* ugh, the icon layering is a pain; maybe upgrade to FA5 to use the SVG stuff

## Bugs
* if there's a stored bearerToken that is no longer valid, the login prompt will hang
* some weirdness on reload if a repo in the list no longer exists
* navlist gets screwy on logout
* blockquote toggling across multiple paragraphs
    * also bullet lists
* single-character selections mess up post-formatting selection on ** and _
* annotation lines get screwy when view gets widened and sidebar locks in
* set up a lock so onScroll response can't get double-called
* chevrons can get out of alignment on long names (isbw-python-widget is example)

## Polish
* sidebar link is off-center on Chrome
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
* add indicator for when repo has remote configuration ("Drax-enabled!")
* icon work, script to generate sizes, favicon, responsive svg? 

## Offline Mode
* cache docs in local storage until they're pushed? 
* recognize when GitHub is unreachable and just let us access the cache
* need to store repository info too... 😬

## Features
1. Testing
    - Annotation
    - BinaryViewer
    - AnnotationContainer
    - DraxModal (might all just get punted to e2e)
      - DataRequestModal
      - FileHistoryModal
      - ModalService
    - Editor
    - FileBrowser
    - GitHubService
    - routing
    - e2e?
2. UI 
    - flash messages
    - spinners
    - warn before refreshing from server
3. Image uploading
4. GitHub caching
    - at least check if we've gotten an item in the last second or so and share
    - maybe isolate the constructors and move everyone to get items from the service
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
