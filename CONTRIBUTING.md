# Contributing to Mission Desk

Thanks for helping. Mission Desk is made by Rumi Labs, Lda. and released under the [GPL-3.0-or-later](LICENSE) license. By contributing, you agree that your work is released under the same license.

## Before your first pull request

Sign off every commit. Mission Desk uses the [Developer Certificate of Origin](DCO) (DCO): with a `Signed-off-by` line you certify that you wrote the change, or otherwise have the right to submit it under the project's license. You keep the copyright in your work.

Add the line with `-s`:

```bash
git commit -s -m "Describe the change"
```

It adds `Signed-off-by: Your Name <your@email>` with the name and email from your git settings, which must match the commit's author. Forgot it? Sign off the last commit with `git commit --amend -s --no-edit`, or every commit on your branch with `git rebase --signoff main`, then push with `--force-with-lease`. The DCO check on your pull request tells you which commits are missing it.

## Working on the code

```bash
npm install
npm run dev        # the app with hot reload
npm test           # unit tests (Vitest)
npm run typecheck
```

- Write a failing test first for any change to logic, then make it pass.
- Keep `npm test` and `npm run typecheck` green (the CI workflow runs both on every pull request).
- Use "space" for a group of apps in anything people read (never "client").
- Mission Desk runs on macOS, Windows and Linux: avoid paths, shells or APIs that exist on only one of them, or guard them.
- Don't put real emails, names or account data in tests or fixtures.
- Explain what changed and why in the pull request; screenshots help for UI changes.

## Reporting security problems

Please don't open a public issue; see [SECURITY.md](SECURITY.md).

## Reporting bugs

Open an issue with what you did, what you expected and what happened. Leave out personal data such as emails, messages and screenshots of your accounts.
