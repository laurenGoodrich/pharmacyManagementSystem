# WonderWomen_SFWE402

## Name
Pharmacy Management System for SFWE 402

## Description
Allows pharmacists to add and manage prescriptions, medicines, and their patients. The project directory in public_html is split up
into scripts, styles, and pages directories. Each page within the website (ie medicines) has a file in each directory. medicines.html
in the pages directory is the layout of the website page, medicines.js in the scripts directory is the javascript functionality - calls
the server through API calls to update the database, and dynamically alters the webpage based on user input. The styles directory (medicines.css)
contains all styling for the medicines.html page. This pattern applies to all the other pages (accounts, checkout, login, patients, prescriptions, and reports).
Each set of pages (one html, css, and js file with the same naming pattern ie all 3 prescription files) combine to handle all the functionality for that gui.

There are a few pages not in this structure, including index.html which is the default landing page for the website and its styling and javascript (style.css and index.js).
Also not included is navbar.html and nav.js, which create the navigation bar at the top and are referenced in each of the pages mentioned above.

In the server directory, there is a schema.js file that connects to the database, describes all the schema used in this project to store data, and exports them. 
The file server.js contains all routes for all the backend functionality contained in the pages above (accounts, checkout, login, medicines, patients, prescriptions, 
and reports) as well as handles sessions and authentication. 

There is a tests directory that contains files for unit tests for some routes in server.js.

There is a .env file used to store connection info and update the database used in the case of testing.

## Development
You need to install mongoose (npm install mongoose), express(npm install express), chai (npm install --save-dev chai), 
mocha (npm install --save-dev mocha), and dotenv (npm install dotenv). This is done using node version 20.17.0.

## Running the code
To run the project, open a terminal in the PharmManager/server directory and run the command "node server.js"
Then enter http://localhost:3000/ in the browser. Use the username 'kari' and password 'pw' to see full functionality.

To test, the tests are in the PharmManager/tests folder. The tests can be run in a terminal from that folder using the 
command "npx mocha .\[test-name].test.js".

There is a .env file that is used to control which database (test or production) is used. ONLY CHANGE THE VARIABLE TEST.
It should be "test" if you're testing and anything else if not. 

