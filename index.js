const express = require("express");
const app = express();
const pg = require("pg");
const client = new pg.Client(process.env.DATABASE || "postgres://localhost/hr_directory");
app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

app.get('/api/employee', async (req, res, next) => {
  try {
    const sql = `
      SELECT * 
      FROM employee
    `;
    const response = await client.query(sql);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

app.get('/api/department', async (req, res, next) => {
  try {
    const sql = `
      SELECT * 
      FROM department
    `;
    const response = await client.query(sql);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

app.post('/api/employee', async (req, res, next) => {
  try {
    console.log(req.body);
    const sql = `
      INSERT INTO employee (name, department_id) VALUES ($1, $2)
      RETURNING *
    `;
    const response = await client.query(sql, [req.body.name, req.body.department_id]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/employee/:id', async (req, res, next) => {
  try {
    const sql = `
      DELETE FROM employee 
      WHERE id = $1
      RETURNING *
    `;
    await client.query(sql, [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

app.put('/api/employees/:id', async (req, res, next) => {
  try {
    const sql = `
      UPDATE employee 
      SET name = $1, department_id = $2 
      WHERE id = $3
      RETURNING *
    `;
    const response = await client.query(sql, [req.body.name, req.body.department_id, req.params.id]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

const init = async () => {
  try {
    await client.connect();
    console.log("Connected to database");
    
    const sql = `
      DROP TABLE IF EXISTS employee CASCADE;
      DROP TABLE IF EXISTS department CASCADE;
      
      CREATE TABLE department (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100)
      );

      CREATE TABLE employee (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        department_id INTEGER REFERENCES department(id)
      );

      INSERT INTO department (name) VALUES ('Sales');
      INSERT INTO department (name) VALUES ('Marketing');
      INSERT INTO department (name) VALUES ('Engineering');
      INSERT INTO department (name) VALUES ('Human Resources');

      INSERT INTO employee (name, department_id) VALUES ('John Doe', 1);
      INSERT INTO employee (name, department_id) VALUES ('Jane Smith', 2);
      INSERT INTO employee (name, department_id) VALUES ('Jim Beam', 3);
      INSERT INTO employee (name, department_id) VALUES ('David Lee', 4);
    `;

    await client.query(sql);
    console.log("Database seeded successfully");
    
    const PORT = 3000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error during initialization:", error);
    process.exit(1);
  }
}

init();