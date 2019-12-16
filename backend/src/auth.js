const { prisma } = require('../prisma/generated/prisma-client');
// To show all object fields and methods instead of [object Object]
const util = require('util');

const typeDefs = [`
	extend type Mutation {
		login(email: String, password: String): String,
		signup(email: String, name: String, password: String): String
	}
`];

const resolvers = {
	Mutation: {
		login: async (_, { email, password }, context) => {
			// console.log(`\nLogin\ne-mail: ${email}\npassword: ${password}\n`);
			return logIn(email, password, context.ip);
		},
		signup: async (_, { email, name, password }, context) => {
			console.log("IP", context.ip);
			console.log(`\nSign Up\ne-mail: ${email}\nusername: ${name}\password: ${password}`);
			/* Simplified version of the code below (doesn't work)
				await signUp(email, name, password, context.ip).catch((error) => {
					if (error) {
						return error;
					} else {
						return logIn(email, password, context.ip);
					}
				});
			 */
			let errorMessage = 'ok';
			let errorTriggered = false;
			await signUp(email, name, password, context.ip).catch((error) => {
				if (error)
					errorTriggered = true;
				errorMessage = error;
			});
			if (errorTriggered) { // e.g. "email in use"
				return errorMessage;
			} else { // Signing up logs users in automatically (no email verification)
				return logIn(email, password, context.ip);
			}
		}
	}
};

// TODO Add a delay on 3 failed attempts; detect and ban bruteforcers
async function logIn(email, password, ip) {
	let attemptSuccessful;
	let loginResponse;
	let badEmail;
	let badPassword;
	// Will be set to an actual base64 token on successful attempt
	let authToken = 'none';
	// Lookup email in the DB
	const user = await prisma.user({ email: email });
	if (user === null) {
		attemptSuccessful = false;
		badEmail = true;
		badPassword = true;
		loginResponse = 'bad credentials';
	} else if (user.password !== password) {
		// User exists but the password is invalid
		attemptSuccessful = false;
		badEmail = false;
		badPassword = true;
		loginResponse = 'bad credentials';
	} else { // Login successful
		// Generate an authToken from random string
		let randomString = Math.random().toString(36).substring(2, 15)
		+ Math.random().toString(36).substring(2, 15); // 20-22 chars
		authToken = Buffer.from(randomString).toString('base64');
		attemptSuccessful = true;
		badEmail = false;
		badPassword = false;
		loginResponse = 'authToken: ' + authToken;
		// Add an additional token to the list
		user.authTokens.push(authToken);
		const updatedUser = await prisma.updateUser({
			data: {
				authTokens: {
					set: user.authTokens
				}
			},
			where: {
				id: user.id
			}
		});
	}
	recordLoginAttempt(attemptSuccessful,
		badEmail, badPassword, email, password, ip, authToken);
	return loginResponse;
}

// Used by logIn()
async function recordLoginAttempt(successful, badEmail, badPassword, email, password, ip, authToken) {
	return await prisma.createLoginAttempt({
		successful: successful,
		badEmail: badEmail,
		badPassword: badPassword,
		email: email,
		password: password,
		authToken: authToken,
		time: new Date(),
		ip: ip
	}).catch((error) => {
		// Show complete error object
		// console.log(util.inspect(error, {showHidden: false, depth: null}));
		let errorMessage = error.result.errors[0].message;
		console.log('\x1b[31m'); // Red color
		console.log('LogIn error: ', errorMessage);
		console.log('\x1b[0m'); // Reset color back to normal
	}).then((result) => {
		if (result === undefined) {
			console.log('\x1b[31m'); // Red color
			console.log('LogIn error: result is undefined');
			console.log('\x1b[0m'); // Reset color back to normal
			return Promise.reject('error: unknown error');
		}
		// Show complete result object
		// console.log(util.inspect(result, {showHidden: false, depth: null}));
		// No errors (GraphQL object not a string) thus .toString()
		if (!result.toString().includes("error")) {
			console.log(`\x1b[${successful ? '32' : '31'}m`); // Green or red color
			console.log(`New ${successful ? 'successful' : 'failed'} login attempt\n`
				+`email: ${result.email}\n`
				+`password: ${result.password}`);
			console.log('\x1b[0m'); // Reset color back to normal
			return Promise.resolve('OK');
		} else {
			return Promise.reject(result); // Return error
		}
	});
}

async function signUp(email, name, password, ip) {
	return await prisma.createUser({
		email: email,
		name: name,
		password: password,
		authTokens: {
			set: []
		},
		signedUpOn: new Date()
	}).catch((error) => {
		// Show complete error object
		// console.log(util.inspect(error, {showHidden: false, depth: null}));
		let errorMessage = error.result.errors[0].message;
		if (errorMessage.includes("A unique constraint would be violated on User." +
			" Details: Field name = email")) {
			console.log('\x1b[31m'); // Red color
			console.log(`Error: e-mail ${email} already in use;` +
				`password: ${password};\n` +
				`time: ${(new Date()).toString()}`);
			console.log('\x1b[0m'); // Reset color back to normal
			return 'error: email in use';
		} else {
			console.log('\x1b[31m'); // Red color
			console.log('SignUp error: ', errorMessage);
			console.log('\x1b[0m'); // Reset color back to normal
		}
	}).then((result) => {
		if (result === undefined) {
			console.log('\x1b[31m'); // Red color
			console.log('SignUp error: result is undefined');
			console.log('\x1b[0m'); // Reset color back to normal
			return Promise.reject('error: unknown error');
		}
		// Show complete result object
		// console.log(util.inspect(result, {showHidden: false, depth: null}));
		// No errors (GraphQL object not a string) thus .toString()
		if (!result.toString().includes("error")) {
			console.log(`New user signed up on ${result.signedUpOn}\n` +
			`ID: ${result.id}\n` +
			`email: ${result.email}\n` +
			`password: ${result.password}`);
			return Promise.resolve('OK');
		} else {
			return Promise.reject(result); // Return error
		}
	});
}

// Export typeDefs & resolvers to be combined into one schema along with others
module.exports = {
	typeDefs,
	resolvers
};
