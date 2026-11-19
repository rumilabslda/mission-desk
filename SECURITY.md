# Security

Mission Desk holds the logins of many accounts, so we take security reports seriously.

## Reporting a problem

Please **don't open a public issue** for a security problem. Use GitHub's private reporting instead: on this repository, go to **Security → Report a vulnerability**. Only the maintainers can see it.

Include what you found, how to reproduce it, and what someone could do with it. We'll confirm we've received it within a few working days and keep you informed until it's fixed. If you'd like to be credited in the release notes, say so.

## Supported versions

Fixes go into the latest release. Please check the problem still happens on the newest version before reporting.

## What's in scope

- Mission Desk leaking one account's data to another account, another app, a web page or the network.
- A web page in Mission Desk reaching Mission Desk's own functions, files or other accounts.
- The assistant or a connected Claude acting in an app without the permission Mission Desk is meant to ask for.
- Secrets (such as an OpenRouter key) stored or sent in a way they shouldn't be.

Problems in the services themselves (Google, Microsoft, Slack and so on) should go to those companies.
