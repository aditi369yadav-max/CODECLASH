const express = require("express");
const router = express.Router();
const { runCode } = require("../controllers/compilerController");

router.post("/", runCode); // matches exported function name

module.exports = router;