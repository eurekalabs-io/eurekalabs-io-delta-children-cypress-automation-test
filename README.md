# Delta Children Automation Framework

This repository contains automated test cases for Delta Children e-Commerce webpage using Cypress as framework.

## Getting Started

Make sure to have node installed
Cross verify the Node.js installation by running the command:

```
node –version
```

To verify the npm version run the following command:

```
npm –version
```
## Download the repository

```bash
## Clone the repository into your local
git clone https://github.com/PilarTorres89/Automation-Delta-Children.git
```

then execute the command:

```bash
## Install the dependencies
npm install
```

This will install all the required dependences for the proyect to function properly.

## Cypress

It supports different types of testing like:

- End to End Testing
- Unit Testing
- Integration Testing
- API Testing

To execute Cypress type

```
npm run cy:open
npx cypress open
```

This will get the Cypress UI opened. Pick E2E Testing and choose a browser (Chrome or Electron were mainly used for this framework)
The spec files containing the tests are placed within the cypress/e2e folder:

Kidssets.cy.js
Nurserysets.cy.js

## POM Structure

We use Page Object Model as structure for this project, since there are several elements that are recursively used within tests, hence we create the objects and classes to make them available for reusability.


## Official Documentation for installing Cypress

For this particular project, [cloning the repository and setting everything up on this step](#download-the-repository) will install everything you need to execute Cypress.
But in case you want to start from scratch, you can
[follow these instructions to install Cypress.](https://on.cypress.io/installing-cypress)

|     |     |     |     |     |     |     |
| :-: | :-: | :-: | :-: | :-: | :-: | :-: |

### Versions

|         |         |
| :-----: | :-----: |
| Node.js | 20.12.2 |
|   Npm   |  9.0.0  |
| Cypress | 13.8.1  |

### Commands Github to push changes 
To create the repository, the following commands were used:
git init

git add .

git commit -m 'comment'

git remote add origin

git remote -v <--- to view that the repository was created

git push origin master <--- to upload the local project

Update local repository to work with the latest version
git pull origin master

Review local changes with the master:
git status

To add the change made::
git add .

git commit -m 'comments'

git push origin master

To execute Cypress type
npm run cy:open
