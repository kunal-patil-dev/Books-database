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

app.put("/update/:id", async (req, res) => {
  try {
    const { title, author } = req.body;
    const { id } = req.params;
    console.log("updating book with id: ", id);

    const query =
      "UPDATE books_to_read SET title = $1, author = $2 WHERE id=$3 RETURNING *;";
    const values = [title, author, id];
    const data = await pool.query(query, values);
    console.log("Database updated Successfully. ^_^");
    res.status(201).json(data.rows[0]);
  } catch (error) {
    console.log("Error updatign books table", error);
    console.log("Error updating books table!!");
    res.status(500).json({ error: "Internal Server Error." });
  }
});

// Patch route - handles partial updates
app.patch("/patch", async (req, res) => {
  try {
    const { title, author, id } = req.body;

    if (!id) {
      return res.status(400).json({ error: "ID is required !!" });
    }

    // Build dynamic query based on provided fields
    const updates = []; // This will hold the parts of the query that need to be updated
    const values = []; // This will hold the values to be passed to the query,
    let paramIndex = 1; // This will be used to track the index of the parameters in the query

    if (title !== undefined) {
      // If title is provided, add it to the updates array
      updates.push(`title = $${paramIndex}`); // This adds the title update to the query
      //updates.push("title = $" + paramIndex);
      values.push(title); // This adds the title value to the values array
      paramIndex++; // Increment the parameter index for the next value
    }

    if (author !== undefined) {
      updates.push(`author = $${paramIndex}`);
      values.push(author);
      paramIndex++;
    }

    // Check if at least one field is provided for update
    if (updates.length === 0) {
      return res.status(400).json({
        error: "At least one field (title or author) is required for update",
      });
    }

    // Add id as the last parameter for WHERE clause
    values.push(id);

    // Construct the final query
    const query = `UPDATE books_to_read SET ${updates.join(
      ", "
    )} WHERE id= $${paramIndex} RETURNING *;`;

    const data = await pool.query(query, values);

    // Check if any row was updated
    if (data.rows.length === 0) {
      return res.status(404).json({ error: "Book not found" });
    }

    return res.json(data.rows);

    // res.json(data.rows);
  } catch (error) {
    // console.log("Error updating books table!!");
    res.json(error);
    // res.status(500).json({ error: "Internal Server Error." });
  }
});

// Delete route
app.delete("/delete", async (req, res) => {
  try {
    const { id } = req.body;
    const query = "DELETE FROM books_to_read WHERE id=$1;";
    const values = [id];
    const data = await pool.query(query, values);
    res.json({ message: "Deleted Successfully" });
  } catch (error) {
    console.log("Error while deleting row");
    res.status(500).json(error);
  }
});

// Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
