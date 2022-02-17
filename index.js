// #################################################
//   IMPORTS
// #################################################

// Libraries
const dotenv = require("dotenv");
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const schedule = require("node-schedule");
const webPush = require("web-push");

// Routes
const userRoutes = require("./routes/user");
const fastRoutes = require("./routes/fast");
const healthRoutes = require("./routes/health");
const pushRoutes = require("./routes/push");
const validateRoutes = require("./routes/validate");

// Every week function
const twicePerHour = require("./jobs/twicePerHour");

// #################################################
//   ENVIROMENT
// #################################################

// Dot env constants
dotenv.config();

// #################################################
//   SERVER
// #################################################

// Express Server
const app = express();

// HTTP access
const server = http.createServer(app);

// #################################################
//   PUSH NOTIFICATIONS
// #################################################

webPush.setVapidDetails(
    "mailto:fanfastic@carlesrojas.com",
    process.env.PUBLIC_VAPID_KEY,
    process.env.PRIVATE_VAPID_KEY
);

// #################################################
//   DATABASE
// #################################################

// Connect to Mongoose DB
mongoose.connect(process.env.DB_URL, () => console.log("Connected to DB."));

// #################################################
//   ROUTES
// #################################################

// No Cors Middleware
app.use(cors());

// Middleware to parse the body of requests
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Routes middlewares
app.use("/api_v1/user", userRoutes);
app.use("/api_v1/fast", fastRoutes);
app.use("/api_v1/health", healthRoutes);
app.use("/api_v1/push", pushRoutes);
app.use("/api_v1/validate", validateRoutes);

// #################################################
//   SCHEDULE JOBS
// #################################################

schedule.scheduleJob("*/30 * * * *", twicePerHour);

// #################################################
//   START SERVER
// #################################################

// Get port
const port = process.env.PORT || 3100;

// Start the server
server.listen(port, () => console.log(`Server up and running on port ${port}.`));
