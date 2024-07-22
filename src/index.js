//@ts-check
const express = require("express");
const originalJokesList = require("./data/jokesData.json");
const lodash = require("lodash");
const cors = require("cors");
const morgan = require("morgan");

const { setupSwaggerJSDocAndUI } = require("./swaggerSetup");
const app = express();
let allJokes = [...originalJokesList];

const port = process.env.NODE_ENV === "production" ? process.env.PORT : 4000;

// be prepared to parse application/json if seen in body and substitute req.body as the parsed object
app.use(express.json());
app.use(cors());
app.use(morgan("tiny"));

let nextJokeId = 10000000;
setupSwaggerJSDocAndUI(app, port);
//See https://spec.openapis.org/oas/latest.html

//openapi tags are categories / groupings of end-points.
/**
 * @openapi
 * tags:
 *  - name: Jokes
 *    description: The joke-management API
 *  - name: Misc
 *    description: An assortment of other end-points for testing and exploration
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     JokeCandidate:
 *       description: Representation of a Joke submitted before it has been validated and assigned an ID.
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
 *       description: Representation of a Joke after it has been validated and assigned an ID.
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
    res.send(
        "Hello - this is a jokes API server.  Try /jokes or /jokes/random or /api-docs for documentation.",
    );
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
app.get("/time", function handleGetTime(req, res) {
    res.send("" + new Date());
});

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
app.get("/jokes", function handleGetAllJokes(req, res) {
    //or use the CORS middleware
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
 *       404:
 *         description: no jokes in db - first joke not found
 */
app.get("/jokes/first", function handleGetFirstJoke(_req, res) {
    if (allJokes.length > 0) {
        res.json(allJokes[0]);
        return;
    }
    res.status(404).json({
        outcome: "failure",
        message: "no jokes in database",
    });
});

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
 *           minimum: 1
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
app.delete("/jokes/:id", function handleDeleteJoke(req, res) {
    const soughtId = req.params.id;
    if (soughtId === undefined) {
        res.status(404).send("missing id");
        return;
    }
    const indexOfJokeToDelete = allJokes.findIndex(
        (j) => j.id === parseInt(soughtId),
    );
    if (indexOfJokeToDelete < 0) {
        res.status(404).json({ outcome: "failure", message: "joke not found" });
        return;
    }
    const jokeToDelete = allJokes[indexOfJokeToDelete];
    allJokes.splice(indexOfJokeToDelete, 1);
    res.json(jokeToDelete);
});

/**
 * @openapi
 * /jokes:
 *   delete:
 *     summary: Delete all jokes
 *     description: Deletes all jokes from the system.  Can reset with /jokes/reset
 *     tags:
 *       - Jokes
 *     responses:
 *       200:
 *         description: Jokes deleted successfully.
 */
app.delete("/jokes", function handleDeleteAllJokes(req, res) {
    allJokes.length = 0;
    res.status(200).json({ outcome: "success", message: "all jokes deleted" });
});

/**
 * @openapi
 * /jokes/search:
 *   get:
 *     summary: Get jokes matching a searchTerm
 *     description: Returns an array of jokes that contain the specified search in either the setup or punchline.
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
 *         description: Bad request (e.g., missing search parameter)
 */

app.get("/jokes/search", function handleJokesSearch(req, res) {
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
app.get("/jokes/random", function handleRequestForRandomJoke(req, res) {
    const chosenJoke = lodash.sample(allJokes);
    res.json([chosenJoke]);
});

/**
 * @openapi
 * /jokes/{id}:
 *   get:
 *     tags: [Jokes]
 *     summary: Get one joke by id
 *     parameters:
 *     - in: path
 *       name: id   # Note the name is the same as in the path
 *       required: true
 *       schema:
 *         type: integer
 *         minimum: 1
 *       description: The joke ID
 *     responses:
 *       200:
 *         description: return the joke with the matching id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Joke'
 *       404:
 *         description: joke not found
 */
app.get("/jokes/:id", function handleGetJokeById(req, res) {
    const soughtId = parseInt(req.params.id ?? "");

    if (Number.isNaN(soughtId)) {
        res.status(400).json({
            outcome: "failure",
            message: "missing id to search for.",
        });
        return;
    }

    const foundJoke = allJokes.find((j) => j.id === soughtId);
    if (!foundJoke) {
        res.status(404).json({
            outcome: "failure",
            message: "can't find joke with that id.",
            soughtId,
        });
        return;
    }
    res.json(foundJoke);
});

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

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
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
 * /jokes/reset:
 *   post:
 *     tags: [Jokes]
 *     summary: Reset list of jokes back to original populated list
 *     responses:
 *       200:
 *         description: accepted.  reset completed.
 */
app.post("/jokes/reset", (req, res) => {
    allJokes = [...originalJokesList];
    res.json({
        outcome: "success",
        message: "jokes list has been reset",
    });
});

app.listen(port, () => {
    console.log(`Jokes API listening on port ${port} at ` + new Date());
});
