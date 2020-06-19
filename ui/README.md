# Create-react-app-craco-template
A template project that uses CRA with craco to adjust for the NAV infrastructure

## What this template does
By using this template or by following the guide bellow your project has support for:
 - Typescript
 - Material UI (docs: https://material-ui.com/getting-started/usage/)
 - Unit Tests with Jest

## Requirements
nodejs v10.* or higher - https://nodejs.org/en/download/releases/
yarn - https://yarnpkg.com/getting-started/install

## How To Run

To install for development, which populates the `node_modules` directory.
```
yarn
```

Also install dependencies for the mock server

```
cd mock-server
yarn
```

Start the mock server:

```
cd mock-server
yarn start
```

*NOTE* see mock-server/README.md for instructions on how to query the server.

To start the app for development, this creates the development server which listens for changes in the ./src/ directory and queries the mock server:
```
yarn start
```

To run tests, this searches for files marked `*.test.js` in the src directory
```
yarn test
```

To build the app for deployment, this builds all typescript into js and copies the `public` directory into the `build` directory which can be uploaded to an s3 bucket.
```
yarn build
```