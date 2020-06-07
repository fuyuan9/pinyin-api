"use strict";
const express = require("express");
const serverless = require("serverless-http");
const cors = require("cors");
const app = express();
const pinyinConverter = require("pinyin");
const PINYIN_DICT = require("pinyin/data/dict-zi");

const router = express.Router();
router.get("/", (req, res) => {
  const input = decodeURI(req.query.q || "");
  const letters = input.split("");
  let chunks = [];
  let nohans = "";
  let pinyinList = [];
  let outputBuff = [];
  for (let i = 0; i < letters.length; i++) {
    const letter = letters[i];
    const firstCharCode = letter.charCodeAt(0);
    if (PINYIN_DICT[firstCharCode]) {
      if (nohans !== "") {
        chunks.push({ isHanzi: false, str: nohans });
        nohans = "";
      }
      chunks.push({ isHanzi: true, str: letter });
    } else {
      // non chinese
      nohans = nohans + letter;
    }
  }
  if (nohans != "") {
    chunks.push({ isHanzi: false, str: nohans });
    nohans = "";
  }

  for (let j = 0; j < chunks.length; j++) {
    const token = chunks[j];
    const isHanzi = token.isHanzi;
    const str = token.str;
    if (isHanzi) {
      const pinyinData = pinyinConverter(str, {
        heteronym: true,
      });
      pinyinList.push({
        hanzi: str,
        pinyin: pinyinData.length > 0 ? pinyinData[0] : [],
      });
      const pinyinDataString = pinyinData.map((item) => {
        const _item = [...item];
        const first = _item.shift();
        const others = _item.length > 0 ? " (" + _item.join(", ") + ")" : "";
        return first + others;
      });
      outputBuff.push(pinyinDataString);
    } else {
      pinyinList.push({
        hanzi: str,
        pinyin: [],
      });
      outputBuff.push(str);
    }
  }
  const output = outputBuff.join(" ");

  res.json({
    input: input,
    output: output,
    pinyin: pinyinList,
  });
});

app.use(cors());
app.use("/.netlify/functions/server", router);

module.exports = app;
module.exports.handler = serverless(app);
