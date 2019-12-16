const fs = require("fs");
const cors = require('cors');
const ws = require('ws');
const validator = require('validator');
const express = require('express');
const app = express();
const { graphqlUploadExpress } = require('graphql-upload');
const apollo = require('./apollo');
const constants = require('./common');

/* TODO
   use validator.isEmail() for frontend validated emails
   use Prisma for storing user emails and HASHED passwords
   implement authentication: use JSON Web Token (JWT) (recommended) or sessions
   change session id on login to protect against session fixation attacks
   use Synchronizing Token Pattern to protect against Cross-Site Request Forgeries (CSRF)
   Note: CORS does NOT necessarily protect against CSRF
*/

const startServers = () => {
	// ApolloServer from local file ./apollo.js
	apollo.startServer(4000);

	// WebSockets server setup
	const wss = new ws.Server({ port: 5001 });
	wss.on('connection', function connection(ws) {
		ws.on('message', function incoming(message) {
			if (validator.isAscii(message)) {
				console.log('received: %s', message);
			} else {
				console.log('error: received message is not a string');
			}
		});

		ws.send('authorized');
	});

	startExpress();
};

const startExpress = () => {
	// Allow Cross-Origin Requests
	app.use(cors());
	app.use(
		express.static(constants.FRONTEND_DIR, {
			extensions: ['html', 'htm'],
			// Other options here
		}),
		graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 })
	);

	// Create the folder if it doesn't exist
	if (!fs.existsSync(constants.IMAGES_DIR)) {
		fs.mkdirSync(constants.IMAGES_DIR);
	}
	app.use(express.static(constants.IMAGES_DIR, {
		extensions: ['jpg', 'png'],
		// Other options here
	}));

	expressGET();
	expressPOST();

	const port = 5000;
	const server = app.listen(port, () => console.log(`Express listening on port ${port}!`));
};

const expressGET = () => {
	app.get('/', (req, res) => res.render('/index.html'));
};

const expressPOST = () => {

};

module.exports = {
    startServers: () => { startServers() }
};
