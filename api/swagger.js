const swaggerJsdoc = require('swagger-jsdoc');
const express = require('express');
const swaggerUi = require('swagger-ui-express');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Oni API',
    version: '1.0.0',
    description:
      'This is a REST API application made with Express to document Oni\'s API.',
    license: {
      name: 'GNU GENERAL PUBLIC LICENSE v3',
      url: 'https://www.gnu.org/licenses/gpl-3.0.en.html',
    },
    contact: {
      name: 'Arkisto Oni',
      url: 'https://github.com/arkisto-Platform/oni',
    },
  },
  servers: [
    {
      url: 'http://localhost:8080',
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      Bearer: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
  }
};

const options = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: ['./src/routes/**/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

var app = express();
app.use(express.json());
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen({port: 3000});
