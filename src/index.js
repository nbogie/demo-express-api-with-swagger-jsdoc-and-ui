//@ts-check
const express = require("express");
const allJokes = require("./data/jokesData.json");
const lodash = require("lodash");
const cors = require("cors");
const { setupSwaggerJSDocAndUI } = require("./swaggerSetup");
const app = express();

const port = process.env.NODE_ENV === "production" ? process.env.PORT : 4000;

// be prepared to parse application/json if seen in body and substitute req.body as the parsed object
app.use(express.json());
app.use(cors());

let nextJokeId = 10000000;
setupSwaggerJSDocAndUI(app, port);
/**
 * @openapi
 * tags:
 *  - name: Jokes
 *    description: The joke-management API
 *  - name: Misc
 *    description: An assortment of other end-points for testing and exploration
 */

//Configure the application (the API server)
/**
 * @openapi
 * components:
 *   schemas:
 *     JokeCandidate:
 *       type: object
 *       required:
 *         - type
 *         - setup
 *         - punchline
 *       properties:
 *         type:
 *           type: string
 *           description: The category of the joke (e.g., general, pun, knock-knock).
 *         setup:
 *           type: string
 *           description: The leading part of the joke that introduces the humorous situation.
 *         punchline:
 *           type: string
 *           description: The concluding part of the joke that delivers the humour.
 *     Joke:
 *       allOf:
 *        - $ref: "#/components/schemas/JokeCandidate"  # Inherit from JokeCandidate
 *       properties:
 *         id:
 *           type: integer
 *           description: The unique identifier of the joke.
 *       required:
 *         - id
 *       example:
 *         id: 1
 *         type: general
 *         setup: What did the fish say when it hit the wall?
 *         punchline: Dam.
 */
/**
 * @openapi
 * /:
 *   get:
 *     tags: [Misc]
 *     summary: root route - welcome
 *     responses:
 *       200:
 *         description: Returns a plaintext greeting listing some common routes.
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: This is a jokes API server.  Try /jokes or /jokes/random or /api-docs for documentation.
 */
app.get("/", (req, res) => {
    res.send("This is a jokes API server.  Try /jokes or /jokes/random");
});

/**
 * @openapi
 * /time:
 *   get:
 *     tags: [Misc]
 *     summary: get the current time where the server is running
 *     responses:
 *       200:
 *         description: return a string
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: "Wed Jul 10 2024 09:48:15 GMT+0000"
 */
app.get("/time", handleGetTime);
function handleGetTime(req, res) {
    res.send("" + new Date());
}

/**
 * @openapi
 * /jokes:
 *   get:
 *     tags: [Jokes]
 *     summary: list all jokes
 *     responses:
 *       200:
 *         description: return a list of jokes objects in JSON
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Joke'
 */
app.get("/jokes", function (req, res) {
    //res.header('Access-Control-Allow-Origin', '*');
    res.json(allJokes);
});

/**
 * @openapi
 * /jokes/first:
 *   get:
 *     tags: [Jokes]
 *     summary: Get first joke
 *     responses:
 *       200:
 *         description: return the first joke in the database
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Joke'
 */
app.get("/jokes/first", handleRequestForFirstJoke);
function handleRequestForFirstJoke(req, res) {
    res.json([allJokes[0]]);
}

/**
 * @openapi
 * /jokes/{id}:
 *   delete:
 *     summary: Delete a joke by ID
 *     description: Deletes a joke from the system based on the provided ID.
 *     tags:
 *       - Jokes
 *     parameters:
 *       - in: path
 *         name: id
 *         description: The unique identifier of the joke to delete.
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Joke deleted successfully.  Returns deleted joke.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Joke'
 *       400:
 *         description: Bad request (e.g., missing or invalid ID format)
 *       404:
 *         description: Joke not found for the provided ID
 */
app.delete("/jokes/:id", (req, res) => {
    const soughtId = req.params.id;
    if (soughtId === undefined) {
        res.status(404).send("missing id");
        return;
    }
    const indexOfJokeToDelete = allJokes.findIndex(
        (j) => j.id === parseInt(soughtId),
    );
    if (indexOfJokeToDelete < 0) {
        res.status(404).send("joke not found");
        return;
    }
    const jokeToDelete = allJokes[indexOfJokeToDelete];
    allJokes.splice(indexOfJokeToDelete, 1);
    res.json(jokeToDelete);
});
/**
 * @openapi
 * /jokes/tag:
 *   get:
 *     summary: Get jokes by tag
 *     description: Returns an array of jokes that contain the specified tag in either the setup or punchline.
 *     tags:
 *       - Jokes
 *     parameters:
 *       - in: query
 *         name: searchTerm
 *         description: The searchTerm to search for (case-insensitive).
 *         required: true
 *         schema:
 *           type: string
 *           example: "dentist"
 *     responses:
 *       200:
 *         description: Array of jokes matching the searchTerm
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Joke'
 *       400:
 *         description: Bad request (e.g., missing tag parameter)
 */

app.get("/jokes/tag", (req, res) => {
    const searchTerm = req.query.searchTerm?.toString();
    if (!searchTerm) {
        res.status(400).send("missing searchTerm query parameter");
        return;
    }

    const foundJokes = allJokes.filter(
        (j) => j.setup.includes(searchTerm) || j.punchline.includes(searchTerm),
    );
    res.json(foundJokes);
});

function handleRequestForRandomJoke(req, res) {
    const chosenJoke = lodash.sample(allJokes);
    res.json([chosenJoke]);
}

/**
 * @openapi
 * /jokes/random:
 *   get:
 *     tags: [Jokes]
 *     summary: get a random joke
 *     responses:
 *       200:
 *         description: return a random joke from the database
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Joke'
 */
app.get("/jokes/random", handleRequestForRandomJoke);

//Configure express to be able to receive a POST request with a new joke

function handleRequestForPOSTJoke(req, res) {
    //get body from request, store as newJoke
    const newJoke = req.body;
    //check it exists (not null / undefined)
    if (newJoke === undefined || newJoke === null) {
        res.status(400).send(
            "where is your joke! it's not in the body, i think",
        );
        return;
    }

    //add an id to the joke
    const id = nextJokeId++;
    newJoke.id = id;
    newJoke.timestamp = new Date() + "";
    //put newJoke into the allJokes array
    allJokes.push(newJoke);
    res.status(201).json(newJoke);
}

/**
 * @openapi
 * /jokes:
 *   post:
 *     tags: [Jokes]
 *     summary: create a joke
 *     requestBody:
 *       description: contents of new joke to create
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JokeCandidate'
 *     responses:
 *       201:
 *         description: joke has been accepted.  the content of the created joke is returned, including a newly assigned id.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Joke'
 *       400:
 *         description: an error when the request is bad
 *         content:
 *           application/plain:
 *             schema:
 *               type: string
 *
 */
app.post("/jokes", handleRequestForPOSTJoke);

app.listen(port, () => {
    console.log(`Jokes API listening on port ${port} at ` + new Date());
});
