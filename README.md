# agentic-ai-security-demo

A GitHub Pages viewer that shows a presentation kept in a private repository to the GitHub users who
can read that repository, and to no one else. This repository is public and holds only generic
JavaScript: the presentation is never committed here. The browser reads it from the private
repository through the GitHub API, with each reader's own token, so GitHub, not this page, decides
who sees it.

The presentation is the slide deck of the private repository `andreagalle/agentic-ai-security`, in
which this repository is the submodule `demo/`.

## 1. How it works

1. On every push to `master`, the private repository builds its reveal.js deck as one
   self-contained HTML file (reveal.js, the stylesheet, and the figures embedded). Its release
   workflow force-pushes that file, as `index.html`, to the branch `deck`, which holds a single
   commit.
2. A visitor opens this site. The front page shows only a generic invitation to sign in with
   GitHub, so a visitor without access learns nothing of the presentation.
3. A reader pastes a personal access token, and the page requests
   `GET https://api.github.com/repos/andreagalle/agentic-ai-security/contents/index.html?ref=deck`
   with the raw media type. GitHub returns the file only if the token's account can read the
   repository, and 404 otherwise.
4. The page writes the deck into itself, so reveal.js runs as if served directly: slide links,
   fullscreen, and the speaker view (key `S`) work.

| File | Content |
|---|---|
| `index.html`, `viewer.css` | The front page: the generic message, the token form, and help on creating a token |
| `viewer.js` | Keeps the token for the tab, reads the deck, and shows it |
| `github.js` | The one API call, and a message for each failure |
| `config.js` | The repository, branch, and file to read; the only file that names them |
| `.nojekyll` | Tells Pages to serve the files as they are |

## 2. Setting up on GitHub

The owner does this once, in this order. The commands run from the root of a Codespace (or a
clone) of the private repository, where this repository is the folder `demo/`.

### 2.1 Create the public repository

On [github.com/new](https://github.com/new): owner `andreagalle`, name `agentic-ai-security-demo`,
visibility *Public*, and nothing to initialize it with (no README, `.gitignore`, or license), so that
the first push meets an empty repository. From a machine where `gh` is signed in as the owner, the
same is `gh repo create andreagalle/agentic-ai-security-demo --public`.

### 2.2 Let the Codespace push to it

A Codespace can push only to the repository it was created from, unless its `devcontainer.json`
grants more. The private repository's `.devcontainer/devcontainer.json` grants *Contents* write on
this repository, under `customizations.codespaces.repositories`: GitHub asks to authorize it when a
Codespace is created, and it applies only to Codespaces created after that file reaches the branch
they start from. Such a Codespace pushes with plain `git push`.

A Codespace created before then needs a token for the push:

1. Create a [fine-grained token](https://github.com/settings/personal-access-tokens/new): resource
   owner `andreagalle`; repository access *Only select repositories*, `agentic-ai-security-demo`;
   permission *Contents*, read and write; a short expiration.
2. Read it into the shell, without echoing it or writing it to the history:

   ```bash
   read -rs DEMO_TOKEN && export DEMO_TOKEN
   ```

3. Push with the token in the URL, as in 2.3. A URL with credentials overrides the Codespace's
   credential helper for that command only, and nothing is stored in the Git configuration.

### 2.3 Commit and push the viewer

```bash
cd demo
git add .
git commit -m "Add the presentation viewer"
git remote add origin https://github.com/andreagalle/agentic-ai-security-demo.git

# A Codespace with the permission of 2.2:
git push -u origin master

# A Codespace created before it:
git push "https://andreagalle:${DEMO_TOKEN}@github.com/andreagalle/agentic-ai-security-demo.git" master
git fetch origin && git branch --set-upstream-to=origin/master

cd ..
```

### 2.4 Record the submodule in the private repository

`demo/` and `.gitmodules` are in place; what remains is to record which commit of this repository
the private one points to. Git does this only once `demo/` has a commit (2.3):

```bash
git submodule add https://github.com/andreagalle/agentic-ai-security-demo.git demo
git commit -m "Add the presentation viewer as the submodule demo"
```

Git answers "Adding existing repo at 'demo' to the index" and stages `.gitmodules` and `demo`. Push
`demo` (2.3) before the private repository, so that the commit it points to exists on GitHub.

### 2.5 Enable GitHub Pages

In this repository: *Settings*, *Pages*, *Build and deployment*, source *Deploy from a branch*,
branch `master`, folder `/ (root)`, *Save*. Within a minute or two the site is live at
`https://andreagalle.github.io/agentic-ai-security-demo/`. The same from a shell:

```bash
gh api -X POST repos/andreagalle/agentic-ai-security-demo/pages \
  -f "source[branch]=master" -f "source[path]=/"
```

### 2.6 Give the site a custom domain

All project sites of an account without a custom domain share one origin,
`https://andreagalle.github.io`, and a page of another such site, opened in the same tab, can read
this site's `sessionStorage`, the token included. A host of its own gives the viewer its own
origin.

1. Verify the domain first, so that no other account can claim its subdomains: account *Settings*,
   *Pages*, *Add a domain*, `andrew.style`, and add the TXT record GitHub shows.
2. Add a DNS record `CNAME` from the chosen host, for instance `cap.andrew.style`, to
   `andreagalle.github.io.`
3. In this repository: *Settings*, *Pages*, *Custom domain*, the host, *Save*. GitHub commits a
   `CNAME` file to `master`; bring it into `demo/` with `git -C demo pull`.
4. Once the certificate is issued, tick *Enforce HTTPS*.

### 2.7 Publish the deck

Merge the private repository's changes into `master` and push. The workflow *Build documents*
builds the deck, and *Release* publishes it to the branch `deck`. To check:

```bash
gh api repos/andreagalle/agentic-ai-security/branches/deck --jq .commit.commit.message
```

The answer reads `Deck v<version>.<build>`. Until the branch exists, the viewer answers that the
token cannot see the presentation.

### 2.8 Grant and revoke access

A reader is anyone who can read the private repository: invite them in its *Settings*,
*Collaborators*, *Add people*. On a repository owned by a personal account every collaborator can
also push, since only organizations offer a read-only role (2.9). Removing a collaborator, or
revoking a token, takes effect on the next request.

### 2.9 Moving to an organization (optional)

On a personal account, collaborators get write access and cannot use fine-grained tokens (Section
3). Transferring the private repository to an organization, with the readers as members holding
the *Read* role, removes both limits. After a transfer, update the owner in `config.js`, the URL in
the private repository's `.gitmodules`, and the repository named in its `devcontainer.json`.

## 3. For readers: the token

A fine-grained token with the least access is enough:

1. Sign in to GitHub, then *Settings*, *Developer settings*, *Personal access tokens*,
   *Fine-grained tokens*, *Generate new token*.
2. *Resource owner*: the owner of the repository. *Repository access*: *Only select repositories*,
   that repository.
3. *Permissions*: *Contents*, read-only. Nothing else.
4. A short expiration. Then paste the token into the page.

Fine-grained tokens reach only repositories owned by the token's own account or by an organization
the account belongs to. A collaborator on a repository owned by a personal account therefore needs a
[classic token](https://github.com/settings/tokens/new?scopes=repo&description=Private%20presentation)
with the `repo` scope. That token can read and write every repository the account can, so it should
get the shortest expiration and be deleted after use.

## 4. Updating the viewer

Edit the files in `demo/`, then commit and push in `demo/` (with the token URL of 2.3 in a
Codespace created before 2.2), then record the new commit in the private repository:

```bash
cd demo && git add . && git commit -m "..." && git push && cd ..
git add demo && git commit -m "Update the presentation viewer"
```

A new Codespace checks `demo/` out at the recorded commit, detached from any branch; run
`git -C demo switch master` before committing there.

To point the viewer at another repository, branch, or file, change `config.js` only.

## 5. Security notes

1. The token is sent only to `api.github.com`: the page's Content Security Policy blocks requests to
   any other host. It is kept in the tab's `sessionStorage`, so closing the tab forgets it, and
   `?signout` clears it at once.
2. Nothing secret is public. This repository reveals the names of the private repository and of its
   branch, which GitHub hides behind a 404 from anyone without access.
3. There is no offline copy to attack: the deck is fetched on each visit, so revoking a token or a
   collaborator stops access immediately, and there is no password to brute-force.
4. A reader who can open the deck can save it: access control ends at the browser, as with any
   document shared for reading.

## 6. Troubleshooting

| Symptom | Cause | Remedy |
|---|---|---|
| "This token cannot see the presentation" | The branch `deck` is not published yet, the account cannot read the repository, or the token does not include it | 2.7; 2.8; Section 3 |
| "GitHub did not accept this token" | The token is mistyped, expired, or revoked | Create a new token |
| "This token may not read repository contents" | A fine-grained token without the *Contents* permission | Section 3, step 3 |
| `git push` refused with 403 in the Codespace | The Codespace's token covers only its own repository | 2.2 |
| The site answers 404 | Pages is not enabled yet, or still deploying | 2.5; the *Actions* tab of this repository |
| The deck shows an old version | The private repository's *Release* workflow has not run, or failed | Its *Actions* tab |
