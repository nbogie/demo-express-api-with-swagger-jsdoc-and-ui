# Express API with Swagger docs and swagger-ui

## What's this?

A demo of a simple JSON Web API written in express with documentation in openapi 3 format written in JSDoc comments (courtesy of `swagger-jsdoc`). It also serves interactive documentation using `swagger-ui-express` on the same port, at `/api-docs`.

The compiled swagger json file is served at `/api-docs/api.json`

## how to use

```
yarn dev
```

This will start a server running on a port specified by the PORT environment variable, or 4000 by default.

### see the generated docs

-   Visit `http://localhost:4000/api-docs` to interact with the generated documentation.

###

-   Make requests to `http://localhost:4000/jokes/random`, etc, to work with the API

### look at how the openapi documentation is written

Look at the jsdoc comments in the js files in this repo to see examples of how the documentation was written in openapi format.
