const swaggerJsdoc = require("swagger-jsdoc");
const path = require("path");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Project API Documentation",
      version: "1.0.0",
      description: "Simple API documentation using Swagger"
    },
    servers: [
      {
        url: process.env.BASE_URL,
        description: process.env.NODE_ENV === "production" ? "Production Server" : "Local Development"
      }
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "accessToken"
        }
      }
    },
    security: [
      {
        cookieAuth: []
      }
    ]
  },
  apis: [path.join(__dirname, "../routes/**/*.js")] // Absolute path resolution
};

module.exports = swaggerJsdoc(options);
