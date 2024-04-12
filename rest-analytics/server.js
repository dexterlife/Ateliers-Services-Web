const express = require("express");
const { MongoClient } = require("mongodb");
const { z } = require("zod");

const app = express();
const port = 8000;

const client = new MongoClient("mongodb://localhost:27017");
let db;

// Définir les schémas Zod
const ViewSchema = z.object({
  source: z.string(),
  url: z.string(),
  visitor: z.string(),
  createdAt: z.date(),
  meta: z.object(),
});

const ActionSchema = ViewSchema.extend({
  action: z.string(),
});

const GoalSchema = ViewSchema.extend({
  goal: z.string(),
});

app.use(express.json());

// Route POST pour les vues
app.post("/views", async (req, res) => {
    const validData = {
      source: "web",
      url: "/home",
      visitor: "user123",
      createdAt: new Date(),
      meta: { pageType: "homepage", device: "desktop" }
    };
    
    const result = ViewSchema.safeParse(validData);
    handleValidationResult(res, result);
  });
  

// Route POST pour les actions
app.post("/actions", async (req, res) => {
    const validData = {
      source: "web",
      url: "/product/123",
      visitor: "user456",
      createdAt: new Date(),
      meta: { actionType: "click", buttonClicked: "Add to Cart" }
    };
    
    const result = ActionSchema.safeParse(validData);
    handleValidationResult(res, result);
  });
  

// Route POST pour les objectifs
app.post("/goals", async (req, res) => {
    const validData = {
      source: "web",
      url: "/checkout",
      visitor: "user789",
      createdAt: new Date(),
      meta: { goalType: "purchase", totalAmount: 100 }
    };
    
    const result = GoalSchema.safeParse(validData);
    handleValidationResult(res, result);
  });
  

async function handleValidationResult(res, validationResult) {
  if (validationResult.success) {
    try {
      const ack = await db.collection("analytics").insertOne(validationResult.data);
      res.send({ _id: ack.insertedId, ...validationResult.data });
    } catch (error) {
      res.status(500).send("Internal server error");
    }
  } else {
    res.status(400).send(validationResult.error.errors);
  }
}

client.connect().then(() => {
  db = client.db("analyticsDB");
  app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
  });
});
