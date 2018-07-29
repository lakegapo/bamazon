// NPM Packages
var mysql = require("mysql");
var inquirer = require("inquirer");
// Package that will allow data to be neatly presented in the console.  https://www.hongkiat.com/blog/tabular-data-browser-console/
require("console.table");

// MYSQL - variable will refer to MYSQL as "connection"
var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "Cocoa123$",
  database: "bamazon"
});

// Connect to MySQL to call function to select all from products table
connection.connect(function(err) {
  if (err) {
    console.error("error connecting: " + err.stack);
  }
  listInventory();
});

// Function to run the select all query of products table and send to console
function listInventory() {
  // Selects all of the data from the MySQL products table
  connection.query("SELECT * FROM products", function(err, res) {
    if (err) throw err;

    console.table(res);
    // Can't use the usual for..loop here because the inventory would be presented vertically on the console
    // for (var i = 0; i < res.length; i++) {
    //     console.log("\n-----------------------------\n" + "Item ID: " + res[i].item_id + "\nProduct: " + res[i].product_name + "\nDepartment: " + res[i].department_name + "\nPrice: " + res[i].price + "\nIn Stock: " + res[i].stock_quantity + "\n-----------------------------\n");
    //   }

    // Take the input from the customer with the selection
    shopperSelectId(res);
  });
}

// Ask the customer for product ID choice
function shopperSelectId(inventory) {
  inquirer
    .prompt([
      {
        type: "input",
        name: "userEntry",
        message: "Enter Item ID to purchase.  Press q to end shopping.",
        validate: function(val) {
          return !isNaN(val) || val.toLowerCase() === "q";
        }
      }
    ])
    .then(function(val) {
      // Send to function which validates if user enters q to finish shopping
      finishShopping(val.userEntry);

      // Convert the user entry from text to numeric so that we can pass it to check against the DB
      var userEnteryParsed = parseInt(val.userEntry);
      var product = checkInventory(userEnteryParsed, inventory);

      // If there is a corresponding product, move the quantity selection
      if (product) {
        shopperSelectQty(product);
      }
      else {
        // If the user entry is invalid, present the inventory again and prompt for selection
        console.log("\nPlease enter a valid Item ID.");
        listInventory();
      }
    });
}

// Function for user entry for quantity of product desired
function shopperSelectQty(product) {
  inquirer
    .prompt([
      {
        type: "input",
        name: "quantity",
        message: "Enter quantity to purchase.  Press q to end shopping.",
        validate: function(val) {
          return val > 0 || val.toLowerCase() === "q";
        }
      }
    ])
    .then(function(val) {
      // Send to function which validates if user enters q to finish shopping
      finishShopping(val.quantity);
      var quantity = parseInt(val.quantity);

      // Start over if the product inventory is less than the desired quantity.  Start over.
      if (quantity > product.stock_quantity) {
        console.log("\nSorry - your last request exceeds our inventory. \n\n\n\n");
        listInventory();
      }
      else {
        // If quantity is okay, send to function to decrement inventory.
        decreaseInventory(product, quantity);
      }
    });
}

// Function to decrement inventory and give buyer the total
function decreaseInventory(product, quantity) {
  connection.query(
    "UPDATE products SET stock_quantity = stock_quantity - ? WHERE item_id = ?",
    [quantity, product.item_id, product.price],
    function(err, res) {
      // Let the user know the purchase was successful, re-run listInventory
      console.log("\nCompleted purchase of " + quantity + " " + product.product_name + " for total of $" + (quantity * product.price).toFixed(2));
      console.log("\n\n\n\n-------------------\n")
      listInventory();
    }
  );
}

// Function to check is user entry matches item_id in the MySQL.
function checkInventory(userEnteryParsed, inventory) {
  for (var i = 0; i < inventory.length; i++) {
    if (inventory[i].item_id === userEnteryParsed) {
      return inventory[i];
    }
  }
  return null;
}

// Check to see if the user wants to quit the program
function finishShopping(userEntry) {
  if (userEntry.toLowerCase() === "q") {
    // Closing message and node closure.
    console.log("Thank you for shopping with us.  Goodbye!");
    process.exit(0);
  }
}
