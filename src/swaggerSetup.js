//@ts-check
const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUI = require("swagger-ui-express");

function setupSwaggerJSDocAndUI(app, port) {
    // Extended: https://swagger.io/specification/#infoObject
    const swaggerJSDocOptions = {
        definition: {
            openapi: "3.0.0",
            info: {
                title: "Jokes API",
                version: "1.0.3",
                description: "Documentation of Jokes API",
                servers: ["http://localhost:" + port],
            },
        },
        apis: ["src/index.js"], //where to look for the APIs
    };

    const pathToAPIDownload = "/api-docs/api.json";
    const openapiSpec = swaggerJSDoc(swaggerJSDocOptions);
    app.get(pathToAPIDownload, (req, res) => res.json(openapiSpec));

    app.use(
        "/api-docs",
        swaggerUI.serveFiles(undefined, { swaggerUrl: pathToAPIDownload }),
        swaggerUI.setup(openapiSpec),
    );
    //Have the UI provide a link to the spec document
    //https://github.com/scottie1984/swagger-ui-express?tab=readme-ov-file#link-to-swagger-document
}

module.exports = { setupSwaggerJSDocAndUI };
