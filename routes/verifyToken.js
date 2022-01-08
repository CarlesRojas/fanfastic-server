// Token management
const webToken = require("jsonwebtoken");

module.exports = (request, response, next) => {
    // Get the token from the request header
    const token = request.header("token");
    if (!token) return response.status(401).json("Access denied");

    try {
        // Add the verification payload to the request (It contains the user _id)
        const verified = webToken.verify(token, process.env.TOKEN_SECRET);

        if (!("_id" in verified)) return response.status(401).json("Invalid token - No ID");
        request._id = verified._id;

        // Call the callback function
        next();
    } catch (error) {
        response.status(400).json("Invalid token");
    }
};
