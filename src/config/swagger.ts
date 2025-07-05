import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Block Survivor - AI Game API",
      version: "0.0.1",
      description:
        "Real-time AI difficulty adjustment API for Block Survivor using 0G Network LLM. Game created for EthGlobal Cannes 2025.",
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
      contact: {
        name: "Block Survivor Team",
        url: "https://github.com/your-username/block-survivor-api",
      },
    },
    servers: [
      {
        url: "/api",
        description: "Block Survivor Game API",
      },
    ],
    tags: [
      {
        name: "Game",
        description:
          "Block Survivor game session management and AI difficulty adjustment",
      },
    ],
    components: {
      schemas: {
        GameConfig: {
          type: "object",
          properties: {
            terrain: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: ["smooth", "sticky", "rugged"],
                  description: "Terrain type affecting player movement",
                },
                movementModifier: {
                  type: "number",
                  description: "Movement speed multiplier",
                },
              },
            },
            boss: {
              type: "object",
              properties: {
                speed: {
                  type: "number",
                  minimum: 1,
                  maximum: 100,
                  description: "Boss attack speed",
                },
                health: {
                  type: "number",
                  minimum: 50,
                  maximum: 500,
                  description: "Boss health points",
                },
                damage: {
                  type: "number",
                  minimum: 5,
                  maximum: 50,
                  description: "Boss attack damage",
                },
                shield: {
                  type: "number",
                  minimum: 0,
                  maximum: 100,
                  description: "Boss damage reduction",
                },
              },
            },
          },
        },
        PlayerMetrics: {
          type: "object",
          required: ["apm", "dodgeRatio", "round"],
          properties: {
            apm: {
              type: "number",
              description: "Actions per minute",
            },
            dodgeRatio: {
              type: "number",
              minimum: 0,
              maximum: 1,
              description: "Ratio of successfully dodged attacks",
            },
            round: {
              type: "number",
              minimum: 1,
              description: "Current game round",
            },
            distanceTraveled: {
              type: "number",
              description: "Total distance moved by player",
            },
            reactionTime: {
              type: "number",
              description: "Average reaction time in seconds",
            },
            damageDealt: {
              type: "number",
              description: "Total damage dealt to boss",
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"],
};

export default swaggerJsdoc(options);
