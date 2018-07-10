# Cellar door

[![Build Status](https://travis-ci.org/nilsnh/cellar-door.svg?branch=master)](https://travis-ci.org/nilsnh/cellar-door)

[![dependencies Status](https://david-dm.org/nilsnh/cellar-door/status.svg)](https://david-dm.org/nilsnh/cellar-door)

Login to services using your own website.

Inspired by the [IndieWeb movement](https://indieweb.org) I wanted to build a well-tested personal authorization server that implements the [IndieAuth protocol](https://indieweb.org/IndieAuth).

## Deploy your own authorization server using glitch.com

1.  Remix my Glitch app.
2.  Complete the .env file configuration.
3.  Add `<link rel="authorization_endpoint" href="https://your-glitch-app.com">` within the `<head></head>` portion of your site's html.
4.  Test logging into a site, for examples:
    - [pin13.net](https://pin13.net/login/)
    - [Telegraph](https://telegraph.p3k.io/login)
    - [The IndieWeb wiki](https://indieweb.org/Special:UserLogin)

## Development

1.  Remix or git clone this project.
2.  Use command `npm test` to run tests. Or `npm test -- --watch` to start the tests in watch mode.

## License

Project is licensed under [AGPL-3.0](/license.md).
