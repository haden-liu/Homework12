var mysql = require("mysql");
var inquirer = require("inquirer");

// create the connection information for the sql database
var connection = mysql.createConnection({
  host: "localhost",

  // Your port; if not 3306
  port: 3306,

  // Your username
  user: "root",

  // Your password
  password: "12345678",
  database: "employees_DB"
});

connection.connect(function(err) {
    if (err) throw err;
    start();
});

function start() {
    inquirer
      .prompt({
        name: "action",
        type: "list",
        message: "What would you like to do?",
        choices: [
            "View departments",
            "View roles",
            "View employees",
            "Add a department",
            "Add a role",
            "Add an employee",
            "Update employee role",
            "Exit"

        ]
      })
      .then(function(answer) {
        switch (answer.action) {
        case "View departments":
          viewDepartments();
          break;
  
        case "View roles":
          viewRoles();
          break;
  
        case "View employees":
          viewEmployees();
          break;
  
        case "Add a department":
          addDepartment();
          break;
        
        case "Add a role":
          addRole();
          break;
        
        case "Add an employee":
          addEmployee();
          break;
        
        case "Update employee role":
          updateRole();
          break;

        case "Exit":
          connection.end();
          break;
        }
      });
}

function viewDepartments() {
    inquirer
      .prompt({
        name: "departmentName",
        type: "input",
        message: "What department would you like to search for?"
      })
      .then(function(answer) {
        var query = "SELECT * FROM department WHERE ?";
        connection.query(query, { name: answer.departmentName }, function(err, res) {
          if (err) throw err;
          for (var i = 0; i < res.length; i++) {
            console.log("Position: " + res[i].id + " || Department Name: " + res[i].name);
          }
          start();
        });
      })
};

function viewEmployees() {
    inquirer
      .prompt([
          {
            name: "firstName",
            type: "input",
            message: "What is your employee's First Name?"
          },
          {
            name: "lastName",
            type: "input",
            message: "What is your employee's Last Name?"
          }        
     ]).then(function(answer) {
        var query = "SELECT * FROM employee LEFT JOIN role ON employee.role_id = role.id WHERE employee.first_name = ? AND employee.last_name = ? ";
        connection.query(query, [answer.firstName, answer.lastName], function(err, res) {
          if (err) throw err;
          for (var i = 0; i < res.length; i++) {
            console.log("First Name: " + res[i].first_name + " || Last Name: " + res[i].last_name + " || Role ID: " + res[i].role_id + " || Role: " + res[i].title +  " || Manager ID: " + res[i].manager_id);
          }
          start();
        });
      })
};

function viewRoles() {
    inquirer
      .prompt({
        name: "roleName",
        type: "input",
        message: "What role would you like to search for?"
      })
      .then(function(answer) {
        var query = "SELECT * FROM role WHERE ?";
        connection.query(query, { title: answer.roleName }, function(err, res) {
          if (err) throw err;
          for (var i = 0; i < res.length; i++) {
            console.log("Title: " + res[i].title + " || Salary: " + res[i].salary + " || Department ID: " + res[i].department_id);
          }
          start();
        });
      })
};

function addDepartment() {
    inquirer
        .prompt({
            name: "department",
            type: "input",
            message: "What is the name of the new department?",
          })
        .then(function(answer) {
        var query = "INSERT INTO department (name) VALUES ( ? )";
        connection.query(query, answer.department, function(err, res) {
            console.log(`You have added this department: ${(answer.department).toUpperCase()}.`)
            start();
        });
        
        });
}

function addRole() {
  // query the database for all departments
  connection.query("SELECT * FROM department", function(err, results) {
    if (err) throw err;
    // once you have the items, prompt user to input the new role
    inquirer
      .prompt([
        {
          name: "roleTitle",
          type: 'input',
          message: "What is the new role title?"
        },
        {
          name: "roleSalary",
          type: "input",
          message: "What is the new role's salary?"
        },
        {
          name: "departmentChoice",
          type: "rawlist",
          message: "what is the department assoicated with the new role?",
          choices: function() {
            var choiceArray = [];
            for (var i = 0; i < results.length; i++) {
              choiceArray.push(results[i].name);
            }
            return choiceArray;
          }
        }

      ])
      .then(function(answer) {
        // get the information of the department associated with new role
        connection.query("SELECT * FROM department where ?", {name:answer.departmentChoice}, function(err, results) {
          if (err) throw err;
          console.log(results[0].id);

          connection.query("INSERT INTO role SET ?", {
            title: answer.roleTitle,
            salary: parseInt(answer.roleSalary),
            department_id: parseInt(results[0].id)
          });

          console.log(`You have added this role: ${(answer.roleTitle).toUpperCase()}.`)
          start();
        });
      });
  });
}

function addEmployee() {
  // query the database for all departments
  connection.query("SELECT * FROM role", function(err, results) {
    if (err) throw err;
    // once you have the items, prompt user to input the new role
    inquirer
      .prompt([
        {
          name: "firstName",
          type: 'input',
          message: "What is the new employee's first name?"
        },
        {
          name: "lastName",
          type: "input",
          message: "What is the new employee's last name?"
        },
        {
          name: "roleChoice",
          type: "rawlist",
          message: "what is the role for the new employee?",
          choices: function() {
            var choiceArray = [];
            for (var i = 0; i < results.length; i++) {
              choiceArray.push(results[i].title);
            }
            return choiceArray;
          }
        }

      ])
      .then(function(answer) {
        // get the information of the role associated with new employee
        connection.query("SELECT * FROM role where ?", {title:answer.roleChoice}, function(err, results) {
          if (err) throw err;
          console.log(results[0].id);

          connection.query("INSERT INTO employee SET ?", {
            first_name: answer.firstName,
            last_name: answer.lastName,
            role_id: results[0].id
          });

          console.log(`You have added this employee: ${(answer.firstName)} ${(answer.lastName)}.`)
          start();
        });
      });
  });
}

function updateRole() {
  connection.query("SELECT * FROM employee", function (err, allEmps) {
      if (err) throw err;
      connection.query("SELECT * FROM role", function (err, allRoles) {
          if (err) throw err;
          inquirer.prompt([
              {
                  name: "Emp",
                  type: "rawlist",
                  choices: function () {
                      var choiceArray = [];
                      for (var i = 0; i < allEmps.length; i++) {
                          choiceArray.push({
                              name: allEmps[i].first_name,
                              value: allEmps[i].id
                          })
                      }
                      return choiceArray;

                  },
                  message: "Select Employee to update",

              },
              {
                  name: "new_Role",
                  type: "rawlist",
                  choices: function () {
                      var choice2Array = [];
                      for (var i = 0; i < allRoles.length; i++) {
                          choice2Array.push({
                              name: allRoles[i].title,
                              value: allRoles[i].id
                          })
                      }
                      return choice2Array;
                  }

              }]).then(function (answer) {
                  console.log(answer)
                  connection.query("UPDATE employee SET ? WHERE ?", [
                      {
                          role_id: answer.new_Role,
                      },
                      {
                          id: answer.Emp
                      }],
                      function (err) {
                          if (err) throw err;
                          console.log("Employee Role changed");
                          
                          start();
                      })

              })
      })
  })
}



/*function updateRole() {
  // query the database to join all employees and roles tables
  connection.query("SELECT * FROM employee INNER JOIN role ON employee.role_id = role.id;", function(err, results) {
    if (err) throw err;
    // once you have the items, prompt user to input the new role
    inquirer
      .prompt([
        {
          name: "firstName",
          type: 'rawlist',
          message: 'What is the first name of the employee need to be updated?'
          choices: function() {
            var newEmployeeArray = [];
            for (var i = 0; i < results.length; i++) {
              newEmployeeArray.push(results[i].first_name);
            }
            return newEmployeeArray;
          }
        },
        {
          name: "newRoleChoice",
          type: "rawlist",
          message: "what is the new role for the employee?",
          choices: function() {
            var newroleArray = [];
            for (var i = 0; i < results.length; i++) {
              newroleArray.push(results[i].title);
            }
            return newroleArray;
          }
        }

      ])
      .then(function(answer) {
        // get the information of the role associated with new employee
        connection.query("SELECT * FROM role WHERE ?", {title:answer.newRoleChoice}, function(err, results) {
          if (err) throw err;
          console.log(results[0].id);

          connection.query("UPDATE employee SET role_id = ? WHERE first_name = ?", [results[0].id, answer.firstName]

          );

          console.log(`You have updated this employee role: ${(answer.firstName)}.`)
          start();
        });
      });
  });
}*/

