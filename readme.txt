Search engine for employees to search courses (MOOCs) based on some parameters: learning objectives of the employees, objectives of the employer, dependencies between courses, courses followed in parallel, etc.


How-to moocrank

Install stuff!
- install node: apt-get install nodejs
- install mongodb: apt-get install mongodb
- in the root directory, update dependencies: npm install

Configure it!
- install coursera courses: node parser/coursera-parser.js
- install udacity courses: node parser/udacity-parser.js
- install edx courses: node parser/edx-parser.js
- install outcomes database: node parser/outcomes-parser.js

Run it!
- node app.js
- access the app in localhost:3000
