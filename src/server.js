"use strict";
const express = require("express");
const serverless = require("serverless-http");
const cors = require('cors');
const app = express();
const pinyin = require("pinyin");

const router = express.Router();
router.get("/", (req, res) => {
  const query = decodeURI(req.query.q || "");
  res.json({
    query: query,
    pinyin: pinyin(query, {
      heteronym: true,
    }),
  });
});

app.use(cors())
app.use("/.netlify/functions/server", router);

module.exports = app;
module.exports.handler = serverless(app);
