import express from "express";
import { configDotenv } from "dotenv";
import pkg from "pg";

const app = express();

configDotenv();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const PORT = process.env.PORT || 8080;

// Routes
app.get("/", (req, res) => {
  res.send("Home Page");
});

app.get("/all", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM books_to_read"); // rows is an array of objects representing the rows returned by the query
    res.status(200).json(rows);
  } catch (error) {
    console.error("Failed to fetch Books", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/add", async (req, res) => {
  try {
    const { title, author } = req.body;
    const query =
      "INSERT INTO books_to_read(title, author) VALUES ($1, $2) RETURNING *;";
    const values = [title, author];
    const data = await pool.query(query, values);
    res.json(data.rows);
  } catch (error) {
    console.log("Error inserting books, Please Try Again.");
    res.status(500).json(error);
  }
});

app.put("/update", async (req, res) => {
  try {
    const { title, author, id } = req.body;
    const query =
      "UPDATE books_to_read SET title = $1, author = $2 WHERE id=$3 RETURNING *;";
    const values = [title, author, id];
    const data = await pool.query(query, values);
    console.log("Database updated Successfully. ^_^");
    res.json(data.rows[0]);
  } catch (error) {
    console.log("Error updating books table!!");
    res.status(500).json({ error: "Internal Server Error." });
  }
});

// Delete route
app.delete("/delete", async (req, res) => {
  try {
    const { id } = req.body;
    const query = "DELETE FROM books_to_read WHERE id=$1;";
    const values = [id];
    const data = await pool.query(query, values);
    res.json({message: "Deleted Successfully"});
  } catch (error) {
    console.log("Error while deleting row");
    res.status(500).json(error);
  }
});

// Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
