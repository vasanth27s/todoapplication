const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

app.get("/todos/", async (request, response) => {
  const { status, priority, search_q } = request.query;
  let query = `
        SELECT
            id,
            todo,
            priority,
            status
        FROM
            todo
        WHERE 1=1`;

  if (status) {
    query += ` AND status = '${status}'`;
  }
  if (priority) {
    query += ` AND priority = '${priority}'`;
  }
  if (search_q) {
    query += ` AND todo LIKE '%${search_q}%'`;
  }

  const todos = await database.all(query);
  response.send(todos);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
        SELECT
            id,
            todo,
            priority,
            status
        FROM
            todo
        WHERE
            id = ${todoId};`;
  const todo = await database.get(getTodoQuery);
  response.send(todo);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const postTodoQuery = `
        INSERT INTO
            todo (id, todo, priority, status)
        VALUES
            (${id}, '${todo}', '${priority}', '${status}')`;
  await database.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { todo, priority, status } = request.body;

  let updateQuery = "UPDATE todo SET ";
  if (todo) {
    updateQuery += `todo = '${todo}'`;
  }
  if (priority) {
    if (todo) {
      updateQuery += `, `;
    }
    updateQuery += `priority = '${priority}'`;
  }
  if (status) {
    if (todo || priority) {
      updateQuery += `, `;
    }
    updateQuery += `status = '${status}'`;
  }
  updateQuery += ` WHERE id = ${todoId};`;

  try {
    await database.run(updateQuery);

    if (status) {
      response.send("Status Updated");
    } else if (priority) {
      response.send("Priority Updated");
    } else if (todo) {
      response.send("Todo Updated");
    } else {
      response.status(400).send("Bad Request");
    }
  } catch (error) {
    response.status(500).send("Internal Server Error");
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
        DELETE FROM todo WHERE id = ${todoId};`;
  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
