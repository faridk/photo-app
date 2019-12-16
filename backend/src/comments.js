const fs = require("fs");
const path = require('path');
const { prisma } = require('../prisma/generated/prisma-client');
const constants = require('./common');
const common = require("./common");

const typeDefs = [`
	extend type Mutation {
		newComment(comment: String!, postID: ID!): String
	}
`];

const resolvers = {
    Mutation: {
        newComment: async (root, { comment, postID }, context, info) => {
            const originalPoster = await common.resolveUser(context.authToken);
            if (!originalPoster) {
                // If changed here must be changed on client
                return "not logged in";
            }
            console.log("OP");
            console.log(originalPoster);
            const prismaComment = await prisma.createComment({
                user: {
                    connect: { id: originalPoster.id }
                },
                post: {
                    connect: { id: postID }
                },
                text: comment,
                time: new Date()
            }).catch((error) => {
                console.error("Prisma createPost: " + error);
            });
            console.log(comment, postID);
            if (prismaComment) {
                return "ok";
            } else {
                return "unknown error";
            }
        }
    }
};

// Export typeDefs & resolvers to be combined into one schema along with others
module.exports = {
    typeDefs,
    resolvers
};
