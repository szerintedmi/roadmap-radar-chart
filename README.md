# Browser RadarChart

This is a fork of https://github.com/szerintedmi/roadmap-radar-chart, but targeted for static/browser use.

The original repo is node.js based, but has stopped getting updates so the dependencies have gotten stale.

This version only handles a single .csv file for input, which needs to reside on the server with these javascript files.  The intended use-case if for gh-pages, where updates to the input csv can be committed and automatically reflected in a repo's documentation.

The only remaining dependency is d3.js, which is included directly from the index.html file as a script.
