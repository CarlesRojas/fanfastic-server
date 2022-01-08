// Get express Router
const router = require("express").Router();

// Dot env constants
const dotenv = require("dotenv");
dotenv.config();

// Get the Validation schemas
const {} = require("../validation");

// Get the schemes
const User = require("../models/User");

module.exports = router;
