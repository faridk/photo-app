const { ApolloServer, gql } = require('apollo-server');
// To merge GraphQL resolvers from various imports below
const lodash = require('lodash');
const graphqlTools = require('graphql-tools');
const { GraphQLUpload } = require('graphql-upload');
// Import all typeDefs and resolvers
const auth = require('./auth');
const newpost = require('./newpost');
const feed = require('./feed');
const comments = require('./comments');
const { prisma } = require('../prisma/generated/prisma-client');

// Query fields not associated with a specific type
// So that other Queries can extend it
const Query = `
	type Query {
		_empty: String
	}
`;
// Same applies to Mutations
const Mutation = `
	type Mutation {
		_empty: String
	}
`;
const Upload = `
	scalar Upload
`;

const initialResolvers = {
	Upload: GraphQLUpload
};
// Merge both typeDefs and resolvers from imported files
const typeDefs = [Query, Mutation, Upload,
	auth.typeDefs.toString(), newpost.typeDefs.toString(), feed.typeDefs.toString(), comments.typeDefs.toString()];
const resolvers = lodash.merge(initialResolvers,
	auth.resolvers, newpost.resolvers, feed.resolvers, comments.resolvers);
// Generate a single schema from all merged typeDefs and resolvers
const schema = graphqlTools.makeExecutableSchema({typeDefs, resolvers});

/**
 * Start Apollo Server
 * @param port Port on which Apollo Server be listening
 * @param maxUploadSize Largest allowed client upload file size
 * @param maxUploadCount Largest allowed client upload file count
 */
const startServer = (port, maxUploadSize, maxUploadCount) => {
	const server = new ApolloServer({
		uploads: {
			// Limits here should be stricter than config for surrounding
			// infrastructure such as Nginx so errors can be handled elegantly by
			// graphql-upload:
			// https://github.com/jaydenseric/graphql-upload#type-processrequestoptions
			maxFileSize: maxUploadSize, // 100 MB
			maxFiles: maxUploadCount
		},
		typeDefs,
		resolvers,
		//
		//
		//
		// THIS IS SERVER SIDE ONLY CONTEXT
		// CHANGING THIS WITHOUT UPDATING CLIENT SIDE CONTEXT WILL BREAK THINGS
		//
		context: async ({ req }) => {
			let ip = (req.headers['x-forwarded-for'] || '').split(',').pop() ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         req.connection.socket.remoteAddress;
			let authToken = req.headers['authorization'];
			try {
				if (authToken) {
					// Token exists
					console.log("AuthToken: " + authToken);
				}
			 } catch (e) {
					console.warn(`Unable to authenticate using auth token: ${authToken}`);
			}
			// Return values so that they can be accessed from resolvers
			// when 'context' is passed as a third parameter of a resolver
			return {
				ip: ip,
				authToken: authToken,
				prisma
			};
		}
	});
	server.listen(port, () => console.log('ApolloServer listening on localhost:'
		+ port + '/graphiql'));
}

module.exports = {
	startServer
};
