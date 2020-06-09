"use textict";
const express = require("express");
const serverless = require("serverless-http");
const cors = require("cors");
const app = express();
const convertToPinyin = require("pinyin");
const PINYIN_DICT = require("pinyin/data/dict-zi");

const router = express.Router();
router.get(
  "/",
  cors({
    origin: "*",
    optionsSuccessStatus: 200,
  }),
  (req, res) => {
    const input = decodeURI(req.query.q || "");
    const letters = input.split("");
    let chunks = [];
    let nonHanziText = "";
    let pinyinList = [];
    for (let i = 0; i < letters.length; i++) {
      const letter = letters[i];
      const firstCharCode = letter.charCodeAt(0);
      if (PINYIN_DICT[firstCharCode]) {
        if (nonHanziText !== "") {
          chunks.push({ isHanzi: false, text: nonHanziText });
          nonHanziText = "";
        }
        chunks.push({ isHanzi: true, text: letter });
      } else {
        nonHanziText = nonHanziText + letter;
      }
    }
    if (nonHanziText != "") {
      chunks.push({ isHanzi: false, text: nonHanziText });
      nonHanziText = "";
    }

    for (let j = 0; j < chunks.length; j++) {
      const token = chunks[j];
      const isHanzi = token.isHanzi;
      const text = token.text;
      const pinyinData = isHanzi
        ? convertToPinyin(text, {
            heteronym: true,
          })
        : [];
      const pinyin = pinyinData.length > 0 ? pinyinData[0] : [];
      pinyinList.push({
        isHanzi,
        text,
        pinyin,
      });
    }

    const segmentedPinyinData = convertToPinyin(input, {
      heteronym: true,
      segment: true,
    });
    const output = segmentedPinyinData
      .flat()
      .filter((e) => /\S/.test(e))
      .join(" ");

    res.json({
      input,
      output,
      pinyinList,
    });
  }
);

app.use("/.netlify/functions/server", router);

module.exports = app;
module.exports.handler = serverless(app);
