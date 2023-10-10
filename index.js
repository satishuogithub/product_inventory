const express = require('express');
const app = express();
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const dbPath = path.join(__dirname, 'Productpractice.db');
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log(`Server is listening at port: ${port}`);
    });
  } catch (e) {
    console.log(`Server error: ${e.message}`);
  }
};

initializeDbAndServer();

//Retrieves list of products from the database using a JSON Web Token for authentication.

app.get('/Products/', (request, response) => {
  let jwtToken;
  const authHeader = request.headers['authorization'];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1];
  }
  if (jwtToken === undefined) {
    response.status(401).send('Invalid Access Token');
  } else {
    jwt.verify(jwtToken, 'MY_SECRET_TOKEN', async (error, payload) => {
      if (error) {
        response.send('Invalid Access Token');
      } else {
        const getProductsQuery = `
            SELECT
              *
            FROM
             Product
            ORDER BY
              Product_id;`;
        const ProductsArray = await db.all(getProductsQuery);
        response.send(ProductsArray);
      }
    });
  }
});

//Gets single Product details from database using JSON Web Token for authentication

app.get('/Products/:ProductId/', (request, response) => {
  let jwtToken;
  const authHeader = request.headers['authorization'];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1];
  }
  if (jwtToken === undefined) {
    response.status(401).send('Invalid Access Token');
  } else {
    jwt.verify(jwtToken, 'MY_SECRET_TOKEN', async (error, payload) => {
      if (error) {
        response.send('Invalid Access Token');
      } else {
        const { ProductId } = request.params;
        const getProductQuery = `SELECT
                      *
                    FROM 
                    Product
                    WHERE 
                    Product_id = ${ProductId};`;
        const Product = await db.get(getProductQuery);
        response.send(Product);
      }
    });
  }
});

// Posts Product details  with a JSON Web Token 

app.post('/addProduct/', (request, response) => {
  let jwtToken;
  const authHeader = request.headers['authorization'];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1];
  }
  if (jwtToken === undefined) {
    response.status(401).send('Invalid Access Token');
  } else {
    jwt.verify(jwtToken, 'MY_SECRET_TOKEN', async (error, payload) => {
      if (error) {
        response.send('Invalid Access Token');
      } else {
        const ProductDetails = {
      
            Product_id: 1,
            title: 'Product10',
            product_id: 'product10',
            rating: 4.5,
            rating_Count: 10000,
            
          };
        
          
          const {
              Product_id,
              title,
              product_id,
              rating,
              rating_Count,
          } = ProductDetails;
        
          const addProductQuery = `
            INSERT INTO
              Product (title,author_id,rating,rating_count)
            VALUES
              (
                 ${Product_id},
                 '${title}',
                 ${product_id},
                 ${rating},
                 ${rating_Count},
                 
                
              );`;
        
          const dbResponse = await db.run(addProductQuery);
          const ProductId = dbResponse.lastID;
        
          
          response.send({ ProductId: ProductId });
      }
    });
  }
});

// Updates a Product to database using a JSON Web Token for authenticatin 

app.put('/Products/:ProductId/', (request, response) => {
  let jwtToken;
  const authHeader = request.headers['authorization'];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1];
  }
  if (jwtToken === undefined) {
    response.status(401).send('Invalid Access Token');
  } else {
    jwt.verify(jwtToken, 'MY_SECRET_TOKEN', async (error, payload) => {
      if (error) {
        response.send('Invalid Access Token');
      } else {
        const { ProductId } = request.params;
        const ProductDetails = request.body;
        const {
            Product_id,
            title,
            author_id,
            rating,
            rating_Count,
        } = ProductDetails;
        const updateProductQuery = `
        UPDATE
            Product
        SET
        ${Product_id},
        '${title}',
        ${author_id},
        ${rating},
        ${rating_Count},
        WHERE
            Product_id = ${ProductId};`;
        await db.run(updateProductQuery);
        response.send("Product Updated Successfully");
      }
    });
  }
});

// Deletes a Product with help of JSON WEB TOKEN
app.delete('/Products/:ProductId/', (request, response) => {
  let jwtToken;
  const authHeader = request.headers['authorization'];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1];
  }
  if (jwtToken === undefined) {
    response.status(401).send('Invalid Access Token');
  } else {
    jwt.verify(jwtToken, 'MY_SECRET_TOKEN', async (error, payload) => {
      if (error) {
        response.send('Invalid Access Token');
      } else {
        const { ProductId } = request.params;
        const deleteProductQuery = `
        DELETE FROM
            Product
        WHERE
            Product_id = ${ProductId};`;
        await db.run(deleteProductQuery);
        response.send("Product Deleted Successfully");
      }
    });
  }
});

///registeration - Hash code generated with bcrypt and stored in db
app.post("/users/", async (request, response) => {
    const { username, name, password, gender, location } = request.body;
    const hashedPassword = await bcrypt.hash(request.body.password, 10);
    const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
    const dbUser = await db.get(selectUserQuery);
    if (dbUser === undefined) {
      const createUserQuery = `
        INSERT INTO 
          user (username, name, password, gender, location) 
        VALUES 
          (
            '${username}', 
            '${name}',
            '${hashedPassword}', 
            '${gender}',
            '${location}'
          )`;
      const dbResponse = await db.run(createUserQuery);
      const newUserId = dbResponse.lastID;
      response.send(`Created new user with ${newUserId}`);
    } else {
      response.status = 400;
      response.send("User already exists");
    }
  });

//login -  here hashed password is compared with user password with bcrypt.compare

  app.post("/login", async (request, response) => {
    const { username, password } = request.body;
    const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
    const dbUser = await db.get(selectUserQuery);
    if (dbUser === undefined) {
      response.status(400);
      response.send("Invalid User");
    } else {
      const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
      if (isPasswordMatched === true) {
        response.send("Login Success!");
      } else {
        response.status(400);
        response.send("Invalid Password");
      }
    }
  });
