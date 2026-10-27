# MergeFlow Lab: SCM Version Conflict Simulator

A browser-based mini Git repository for practising branching, merging and conflict resolution.
Plain HTML, CSS and JavaScript. No install, no build step, no server.

## Run it
- Open this folder in VS Code and install the **Live Server** extension, then right-click `index.html` and choose "Open with Live Server", or
- double-click `index.html` to open it in your browser.

## Project structure
```
mergeflow-lab/
  index.html          page layout
  css/
    style.css         all styling (light and dark theme)
  js/                 scripts load in this order
    utils.js          helpers: $, esc, hash
    merge.js          merge engine: LCS diff, diff3 line merge, per-file three-way merge
    repo.js           repository model: commits, branches, merge base (lca), working tree
    commands.js       git command interpreter: commit, branch, switch, merge, cherry-pick, ...
    scenarios.js      four ready-made practice scenarios
    ui.js             rendering: commit graph, editor, conflict resolver, event listeners
    main.js           start-up
  README.md
```

## Terminal commands
`status`, `log [--all] [branch]`, `branch [name]`, `switch [-c] <branch>`, `commit -m "msg"`,
`merge <branch>`, `merge --abort`, `cherry-pick <id>`, `reset --hard`, `touch <file>`, `rm <file>`, `help`, `clear`

## How merging works
1. Find the merge base: the nearest common ancestor of the two branch tips (`lca`).
2. If one branch has no new commits, fast-forward (move the pointer, no merge commit).
3. Otherwise merge each file by comparing both versions with the base (`threeWay` and `merge`).
4. Changes in separate regions combine. Overlapping or adjacent differing edits become conflicts.
5. Resolve each conflict, then `git commit` creates a merge commit with two parents.
