// ~/modules/mangodb.js, the module for table operations.
const router = require('express').Router();
const crypto = require('crypto');
const app = require("../app.js");
const fs = require('fs');
var tables = {};

// Routes
router.all("/:table/:id", (req, res, nextLayer) => {
    app.log(req.method + " request made on resource " + req.url);
    nextLayer();
});

router.get("/:table/:id", (req, res) => {
    try { res.status(200).json(
            JSON.parse(fs.readFileSync(tables[req.params.table]))[req.params.id]); }
    catch (ex) { res.status(404).json(ex); }
});

router.delete("/:table/:id", (req, res) => {
    try {
        var table = JSON.parse(fs.readFileSync(tables[req.params.table]));
        delete table[req.params.id];
        fs.writeFileSync(tables[req.params.table], JSON.stringify(table))
        res.status(200).json(null);
    }
    catch (ex) { res.status(404).json(ex); }
});

router.patch("/:table/:id", (req, res) => {
    try {
        var table = JSON.parse(fs.readFileSync(tables[req.params.table]));
        table[req.params.id] = Object.assign(table[req.params.id], req.body);
        fs.writeFileSync(tables[req.params.table], JSON.stringify(table));
        res.status(200).json(table[req.params.id]);
    }
    catch (ex) { res.status(404).json(ex); }
});

router.post("/:table/", (req, res) => {
    try {
        var id, table = JSON.parse(fs.readFileSync(tables[req.params.table]));
        do { id = crypto.randomUUID(); } while (Object.keys(table).includes(id));
        table[id] = req.body;
        fs.writeFileSync(tables[req.params.table], JSON.stringify(table));
        res.status(200).json(table[id]);
    }
    catch (ex) { res.status(404).json(ex); }
});

// Export the module...
module.exports = function (tablePaths) {
    tables = tablePaths;
    return router;
};