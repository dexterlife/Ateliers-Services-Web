const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const { z } = require("zod");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const port = 8000;

const client = new MongoClient("mongodb://localhost:27017");
let db;

const ProductSchema = z.object({
  _id: z.string(),
  name: z.string(),
  about: z.string(),
  price: z.number().positive(),
  categoryIds: z.array(z.string())
});

const CreateProductSchema = ProductSchema.omit({ _id: true });

const CategorySchema = z.object({
  _id: z.string(),
  name: z.string(),
});

const CreateCategorySchema = CategorySchema.omit({ _id: true });

app.use(express.json());

app.post("/products", async (req, res) => {
  const result = await CreateProductSchema.safeParse(req.body);

  if (result.success) {
    const { name, about, price, categoryIds } = result.data;
    const categoryObjectIds = categoryIds.map((id) => new ObjectId(id));

    const ack = await db.collection("products").insertOne({ name, about, price, categoryIds: categoryObjectIds });

    const newProduct = {
      _id: ack.insertedId,
      name,
      about,
      price,
      categoryIds: categoryObjectIds,
    };

    io.emit("newProduct", newProduct);

    res.send(newProduct);
  } else {
    res.status(400).send(result.error.errors);
  }
});

app.get("/products", async (req, res) => {
  try {
    const products = await db.collection("products").find({}).toArray();
    res.send(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/categories", async (req, res) => {
  const result = await CreateCategorySchema.safeParse(req.body);

  if (result.success) {
    const { name } = result.data;

    const ack = await db.collection("categories").insertOne({ name });

    const newCategory = {
      _id: ack.insertedId,
      name,
    };

    io.emit("newCategory", newCategory);

    res.send(newCategory);
  } else {
    res.status(400).send(result.error.errors);
  }
});

app.get("/categories", async (req, res) => {
  try {
    const categories = await db.collection("categories").find({}).toArray();
    res.send(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).send("Internal Server Error");
  }
});

io.on("connection", (socket) => {
  console.log("A user connected");
});

client.connect().then(() => {
  db = client.db("myDB");
  server.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
  });
});
