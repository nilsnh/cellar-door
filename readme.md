# Cellar door

[![Build Status](https://travis-ci.org/nilsnh/cellar-door.svg?branch=master)](https://travis-ci.org/nilsnh/cellar-door) [![dependencies Status](https://david-dm.org/nilsnh/cellar-door/status.svg)](https://david-dm.org/nilsnh/cellar-door) [![codecov](https://codecov.io/gh/nilsnh/cellar-door/branch/master/graph/badge.svg)](https://codecov.io/gh/nilsnh/cellar-door)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

Login to services using your own website.

Inspired by the [IndieWeb movement](https://indieweb.org) I wanted to build a well-tested personal authorization server that implements the [IndieAuth protocol](https://indieweb.org/IndieAuth).

Features:

- IndieAuth support.
- [h-card](https://indieweb.org/h-card) support.
- [Token endpoint support](https://indieweb.org/token-endpoint) using [JSON Web Tokens](https://jwt.io).

## Deploy your own authorization server

**Setup server:**

1. git clone this project.
1. Run `npm install` to install dependencies.
1. Copy and rename `.env-example` to a file called `.env` and then fill out the missing configuration.
1. Run `npm start`.

**Connect web page to authorization server:**

1. Within the `<head></head>` portion of your personal site's html:
   - Add `<link rel="authorization_endpoint" href="https://your-glitch-app.com">` to make authorization endpoint discoverable.
   - Add `<link rel="token_endpoint" href="https://your-glitch-app.com/token">` to make token endpoint discoverable.
1. Test logging into a site, for example [indielogin.com](https://indielogin.com).
   - And if you want, manually test the access token flow using [this tool](https://gimme-a-token.5eb.nl/) by [Sebastiaan Andeweg](https://indieweb.org/User:Seblog.nl).

## Development

1.  git clone this project.
2.  Use command `npm test` to run tests. Or `npm test -- --watch` to start the tests in watch mode.

## License

Project is licensed under [AGPL-3.0](/license.md).
