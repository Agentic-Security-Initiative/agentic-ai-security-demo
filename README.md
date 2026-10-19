# agentic-ai-security-demo

A GitHub Pages site that shows material kept in a private repository to the GitHub users who can
read that repository, and to no one else. This repository is public and holds only generic HTML,
CSS, and JavaScript: the material is never committed here. The browser reads it from the private
repository through the GitHub API, with each reader's own token, so GitHub, not this site, decides
who sees it.

The material comes from the private repository `Agentic-Security-Initiative/agentic-ai-security`, in which this
repository is the submodule `demo/`. Both belong to the organization `Agentic-Security-Initiative`.

## 1. Sections

The site is served at `https://agentic-security-initiative.github.io/agentic-ai-security-demo/` (or at the custom
domain of 3.6), one folder per section:

| Path | Content | State |
|---|---|---|
| `/` | The overview: a generic page that links to the sections and, once signed in, offers the PDF of the latest release | Live |
| `/slides/` | The presentation, the slide deck of the private repository | Live |
| `/examples/` | Worked examples, read from the private repository | Live |
| `/usecases/` | Use cases, read from the private repository, one card per case | Live |
| `/controls/` | A catalog, read from the private repository, with groups of filters and a search | Live |
| `/download/` | The download of the latest release, with what GitHub asks before it serves the file | Live |

Every page opens with the same bar: the logo and the name, top left, lead back to the overview
from anywhere, and the sections follow, the current one marked; inside the presentation, a small
button with the logo does the same. A section in preparation shows only a placeholder that says so. Section 5.2 sets out how a section is
built. The overview also explains how to create a token, and every sign-in page links to it.

## 2. How it works

### 2.1 The slides

1. On every push to `master`, the private repository builds its reveal.js deck as one
   self-contained HTML file (reveal.js, the stylesheet, and the figures embedded). Its release
   workflow force-pushes that file, as `index.html`, to the branch `deck`, which holds a single
   commit.
2. A visitor opens `/slides/`. The page shows only a generic invitation to sign in with GitHub, so a
   visitor without access learns nothing of the presentation.
3. A reader pastes a personal access token, and the page requests
   `GET https://api.github.com/repos/Agentic-Security-Initiative/agentic-ai-security/contents/index.html?ref=deck`
   with the raw media type. GitHub returns the file only if the token's account can read the
   repository, and 404 otherwise.
4. The page writes the deck into itself, so reveal.js runs as if served directly: slide links
   (`/slides/#/...`), fullscreen, and the speaker view (key `S`) work.

The token is kept in the tab's `sessionStorage`, which belongs to the site's origin: a token entered
in one section serves every other section of the site until the tab is closed.

### 2.2 The examples

The private repository builds `examples.json`, a document that describes what the page shows: its
texts, its fields, its groups (each in one of three tones, from green to red), a chart, and its
items, each with the blocks of a card. The same release that publishes the deck writes it to the
branch `deck`. `/examples/` signs in like `/slides/`, reads that file, draws the chart, and lays the
items out as tiles in their groups. Selecting a tile, or a point of the chart, opens the item's
card in a dialog at the address `#<id>`, which can be linked to; the browser's back button, Escape,
or the close button closes it. A card is a sequence of sections of blocks: charts, scales, facts,
entries, tables, texts, notes, and placeholders. The page computes nothing and holds no text of its
own: everything it shows comes from the file, so this public repository says nothing of the
material.

`/usecases/` works the same way, from `usecases.json`: tiles in groups, each opening a card at
`#<id>`. Its cards add one kind of block, a flow: a row of numbered steps joined by arrows, some
marked as loops. The code of the tiles, the groups, the cards, and their blocks is shared by both
sections, in `assets/cards.js`.

### 2.3 The controls

The private repository builds `controls.json` as well, a document that describes a catalog: its
texts, a summary shown first, groups of filters, a search, and its sections of groups of entries,
each entry with the tags it carries, its chips, its details, and its texts. The same release writes
it to the branch `deck`. `/controls/` signs in like the other sections and lays the catalog out.
Each group of filters keeps one choice, and an entry shows when it carries the tag of every choice
and matches the search; each button counts the entries its choice would show. The choices are the
address, joined by `+` (`#<filter>` or `#<filter>+<filter>`), and an entry is reached at `#<id>`, so
that the cards of `/examples/` and `/usecases/` can link to a filtered view. With a thousand
entries, a text is written into the page only when its details first open. The sources the
document cites appear as a line of links at the top and as a list at the foot (`#sources`); a link
that leaves the site opens in a new tab and sends no referrer.

### 2.4 The overview

Before a reader signs in, the overview explains how to create a token. Once a section has stored
one, the overview asks the API for the latest release of the private repository (neither a draft
nor a prerelease) and shows, in place of that help, the release and a button to the page
`/download/`. That page explains what github.com asks before it serves the file: a browser signed
in to github.com with an account added to the repository as a collaborator, since GitHub answers
404 Not Found to anyone else; it links to the sign-in and to the repository's invitations, and then
offers the asset's address on github.com, which serves the file under the asset's name with its
version. The host of release assets sends no CORS header, so a page cannot download the file
through the API with the token. Without a token, or when GitHub answers with an error, the help
stays.

### 2.5 Files

| File | Content |
|---|---|
| `index.html`, `assets/overview.js` | The overview, and the code that shows the latest release once signed in |
| `download/index.html`, `download/download.js` | The download page: what github.com asks, then the link to the file |
| `assets/release.js` | The PDF of the latest release, read through the API with the token |
| `slides/index.html`, `slides/viewer.js` | The sign-in page of the presentation, and the code that writes the deck into it and adds to it the icon and a button with the logo, top left, back to the overview |
| `examples/index.html`, `examples/examples.js` | The sign-in page of the examples, and the code that draws the chart of all the items and lays the document out with `assets/cards.js` |
| `usecases/index.html`, `usecases/usecases.js` | The sign-in page of the use cases, and the code that lays the document out with `assets/cards.js` |
| `assets/cards.js` | The tiles in their groups, and the card of each item in a dialog routed by the address, laid out by kinds of block; shared by `/examples/` and `/usecases/` |
| `assets/chart.js` | A chart drawn as SVG from a document: axes, regions in the three tones, boundary lines, and points with tooltips and links |
| `controls/index.html`, `controls/controls.js` | The sign-in page of the controls, and the code that lays the catalog out with its filters |
| `assets/site.css` | The style of every page, in the palette of the deck: a system typeface, thin rules, soft shadows, short transitions |
| `assets/logo.png`, `assets/favicon.png` | The logo, in the bar and in the button of the presentation; and the icon of every page. Both are made in the private repository and copied here |
| `assets/signin.js` | The sign-in of a section: its form, the shared token, and the messages of a failed read |
| `assets/token.js` | The token shared by the sections |
| `assets/github.js` | The API calls (a file, the latest release), and a message for each failure |
| `assets/config.js` | What the site reads from the private repository; the only file that names it |
| `.nojekyll` | Tells Pages to serve the files as they are |

## 3. Setting up on GitHub

The owner does this once, in this order; a new section needs none of it. The commands run from the
root of a Codespace (or a clone) of the private repository, where this repository is the folder
`demo/`.

### 3.1 Create the public repository

On [github.com/new](https://github.com/new): owner the organization `Agentic-Security-Initiative`, name
`agentic-ai-security-demo`, visibility *Public*, and nothing to initialize it with (no README,
`.gitignore`, or license), so that the first push meets an empty repository. From a machine where
`gh` is signed in as a member who may create repositories there, the same is
`gh repo create Agentic-Security-Initiative/agentic-ai-security-demo --public`.

### 3.2 Let the Codespace push to it

A Codespace can push only to the repository it was created from, unless its `devcontainer.json`
grants more, and it can grant only repositories of the same owner. The private repository's
`.devcontainer/devcontainer.json` grants *Contents* write on this repository, under
`customizations.codespaces.repositories`: GitHub asks to authorize it when a Codespace is created,
and it applies only to Codespaces created after that file reaches the branch they start from. Such a
Codespace pushes with plain `git push`.

A Codespace created before then needs a token for the push:

1. Create a [fine-grained token](https://github.com/settings/personal-access-tokens/new): resource
   owner `Agentic-Security-Initiative`; repository access *Only select repositories*, `agentic-ai-security-demo`;
   permission *Contents*, read and write; a short expiration. If the organization requires approval
   of fine-grained tokens, an owner approves it first.
2. Read it into the shell, without echoing it or writing it to the history:

   ```bash
   read -rs DEMO_TOKEN && export DEMO_TOKEN
   ```

3. Push with the token in the URL, as in 3.3. A URL with credentials overrides the Codespace's
   credential helper for that command only, and nothing is stored in the Git configuration.

### 3.3 Commit and push the site

Run these inside `demo/`, never from the root of the private repository: a remote of this
repository added there would let a push publish the private history.

```bash
cd demo
git add .
git commit -m "Add the presentation viewer"
git remote add origin https://github.com/Agentic-Security-Initiative/agentic-ai-security-demo.git

# A Codespace with the permission of 3.2:
git push -u origin master

# A Codespace created before it:
git push "https://x-access-token:${DEMO_TOKEN}@github.com/Agentic-Security-Initiative/agentic-ai-security-demo.git" master
git fetch origin && git branch --set-upstream-to=origin/master

cd ..
```

### 3.4 Record the submodule in the private repository

`demo/` and `.gitmodules` are in place; what remains is to record which commit of this repository
the private one points to. Git does this only once `demo/` has a commit (3.3):

```bash
git submodule add https://github.com/Agentic-Security-Initiative/agentic-ai-security-demo.git demo
git commit -m "Add the presentation viewer as the submodule demo"
```

Git answers "Adding existing repo at 'demo' to the index" and stages `.gitmodules` and `demo`. Push
`demo` (3.3) before the private repository, so that the commit it points to exists on GitHub.

### 3.5 Enable GitHub Pages

In this repository: *Settings*, *Pages*, *Build and deployment*, source *Deploy from a branch*,
branch `master`, folder `/ (root)`, *Save*. Within a minute or two the site is live at
`https://agentic-security-initiative.github.io/agentic-ai-security-demo/`. The same from a shell:

```bash
gh api -X POST repos/Agentic-Security-Initiative/agentic-ai-security-demo/pages \
  -f "source[branch]=master" -f "source[path]=/"
```

### 3.6 Give the site a custom domain

All project sites of an organization without a custom domain share one origin,
`https://agentic-security-initiative.github.io`, and a page of another such site, opened in the same tab, can read
this site's `sessionStorage`, the token included. A host of its own gives the site its own origin.
Every link in the site is relative, so the sections work unchanged at the root of the new host.

1. Verify the domain first, so that no other account can claim its subdomains: the organization's
   *Settings*, *Pages*, *Add a domain*, the domain, and add the TXT record GitHub shows.
2. Add a DNS record `CNAME` from the chosen host, for instance `site.example.org`, to
   `agentic-security-initiative.github.io.`
3. In this repository: *Settings*, *Pages*, *Custom domain*, the host, *Save*. GitHub commits a
   `CNAME` file to `master`; bring it into `demo/` with `git -C demo pull`.
4. Once the certificate is issued, tick *Enforce HTTPS*.

### 3.7 Publish the deck

Merge the private repository's changes into `master` and push. The workflow *Build documents*
builds the deck, and *Release* publishes it to the branch `deck`. To check:

```bash
gh api repos/Agentic-Security-Initiative/agentic-ai-security/branches/deck --jq .commit.commit.message
```

The answer reads `Deck v<version>.<build>`; the branch holds `index.html`, the deck, and
`examples.json`, `controls.json`, and `usecases.json`, the material of the other sections. Until a
file is there, its section answers that the token cannot see this material.

### 3.8 Grant and revoke access

A reader is anyone who can read the private repository. Make them members of the organization
and give them the *Read* role on that repository, best through a team, in the repository's
*Settings*, *Collaborators and teams*; or add them there as outside collaborators with the *Read*
role. Members can use fine-grained tokens, outside collaborators only classic ones (Section 4).
The organization's *Settings*, *Personal access tokens*, decide which tokens may reach its
repositories: fine-grained tokens must be allowed (and approved, if the organization requires
approval), and classic tokens must not be restricted while outside collaborators use them. Removing
a reader, or revoking a token, takes effect on the next request.

### 3.9 Moving to another owner

Both repositories were moved from a personal account to the organization `Agentic-Security-Initiative`. A later transfer
needs the same steps: update the owner in `assets/config.js`, the URLs in the private repository's
`.gitmodules` (then `git submodule sync`), and the repositories named in its `devcontainer.json`;
check *Settings*, *Pages* here, since the site moves to the new owner's `github.io` host and the old
address is not redirected; and tell the readers, whose fine-grained tokens name the old owner and
stop working. GitHub redirects Git and the API from the old names, but the site should not rely on
it.

## 4. For readers: the token

A fine-grained token with the least access is enough:

1. Sign in to GitHub, then *Settings*, *Developer settings*, *Personal access tokens*,
   *Fine-grained tokens*, *Generate new token*.
2. *Resource owner*: the organization that owns the repository. *Repository access*: *Only select
   repositories*, that repository.
3. *Permissions*: *Contents*, read-only. Nothing else.
4. A short expiration. Then paste the token into the sign-in page of a section.

Fine-grained tokens reach only repositories owned by the token's own account or by an organization
the account belongs to, and the organization may require an owner to approve them. An outside
collaborator, who is not a member of the organization, therefore needs a
[classic token](https://github.com/settings/tokens/new?scopes=repo&description=Private%20presentation)
with the `repo` scope. That token can read and write every repository the account can, so it should
get the shortest expiration and be deleted after use.

## 5. Updating the site

### 5.1 Publishing a change

Edit the files in `demo/`, then commit and push in `demo/`, then record the new commit in the
private repository:

```bash
cd demo && git add . && git commit -m "..." && git push && cd ..
git add demo && git commit -m "Update the site"
```

In a Codespace created before 3.2, whose own token cannot push here, push with the token of 3.2 in
`DEMO_TOKEN` instead, and fetch afterwards, since a push to a URL does not update `origin/master`:

```bash
cd demo
git push "https://x-access-token:${DEMO_TOKEN}@github.com/Agentic-Security-Initiative/agentic-ai-security-demo.git" master
git fetch origin
cd ..
```

A new Codespace checks `demo/` out on `master`, at its tip, since the submodule follows that
branch rather than a recorded commit; run `git -C demo pull` to bring it up to date.

### 5.2 Building a section

A section is a folder holding an `index.html`, served at `/<folder>/`.

1. Links are relative (`../assets/site.css`, `../`), never absolute: the site is served under
   `/agentic-ai-security-demo/` and, with a custom domain, at the root of another host.
2. Pages share `assets/`: `site.css` for the style, `signin.js` for the sign-in, `token.js` for
   the token, `github.js` for the API, and `config.js` for what is read from the private
   repository. A section that reads private material adds its source to `SOURCES` in `config.js`,
   copies the sign-in page of `examples/` (the `#gate` and its form), and calls `signIn` with a
   function that shows the file once GitHub returns it.
3. Nothing of the private material is committed here: a section holds only the code that fetches
   and shows it. Material that is meant to be public needs no token and can live in the section.
4. Each page carries a Content Security Policy in a `<meta>` tag: `default-src 'self'` on a page
   that loads only its own files, and `connect-src https://api.github.com` at least on a page that
   reads from the API. It also carries `<meta name="robots" content="noindex, nofollow">`.
5. When a section goes live, update its entry in the overview (`index.html`: drop the class
   `pending` and replace "In preparation") and its row in Section 1.

## 6. Security notes

1. The token is sent only to `api.github.com`: the Content Security Policy of each page blocks
   requests to any other host. It is kept in the tab's `sessionStorage`, so closing the tab forgets
   it, and `slides/?signout` clears it at once, for every section. The download of the overview is
   a link to github.com, which the browser follows with its own session there, not with the token.
2. Nothing secret is public. This repository reveals the names of the private repository and of its
   branch, which GitHub hides behind a 404 from anyone without access.
3. There is no offline copy to attack: the material is fetched on each visit, so revoking a token or
   a collaborator stops access immediately, and there is no password to brute-force.
4. A reader who can open the material can save it: access control ends at the browser, as with any
   document shared for reading.

## 7. Troubleshooting

| Symptom | Cause | Remedy |
|---|---|---|
| "This token cannot see this material" | The file is not on the branch `deck` yet, the account cannot read the repository, or the token does not include it | 3.7; 3.8; Section 4 |
| "GitHub did not accept this token" | The token is mistyped, expired, or revoked | Create a new token |
| "This token may not read repository contents" | A fine-grained token without the *Contents* permission | Section 4, step 3 |
| `git push` refused with 403 in the Codespace | The Codespace's token covers only its own repository | 3.2 |
| A new fine-grained token sees nothing | The organization requires approval of fine-grained tokens, and the token is pending | An owner approves it: the organization's *Settings*, *Personal access tokens*, *Pending requests* |
| The site answers 404 | Pages is not enabled yet, or still deploying | 3.5; the *Actions* tab of this repository |
| The slides or the examples show an old version | The private repository's *Release* workflow has not run, or failed | Its *Actions* tab |
