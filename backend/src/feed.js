const fs = require("fs");
const path = require('path');
const { prisma } = require('../prisma/generated/prisma-client');

const typeDefs = [`
	extend type Query {
		feed(search: String): [Post]
	}
	type User {
        name: String
        email: String
        posts: [Post]
        images: [Image]
    }
    type Image {
        id: ID!
        filename: String!
        user: User!
    }
    type Comment {
        user: User
        post: Post!
        text: String!
        time: DateTime!
    }
    type Post {
        id: ID!
        user: User
        location: String
        description: String
        image: Image
        likes: Int!
        comments: [Comment]
        time: DateTime
    }
    scalar DateTime
`];

const resolvers = {
    Query: {
        feed: async (root, { search }, context, info) => {
            if (search) { // Filter posts by search query
                console.log("TEST");
                return await searchFeed(search);
            } else { // No search has been made - show all posts
                return prisma.posts();
            }
        }
    },
    Post: {
        comments: async (root, args, context, info) => {
            return context.prisma.post({id: root.id}).comments();
        },
        user: async (root, args, context, info) => {
            return context.prisma.post({id: root.id}).user();
        },
        image: async (root, args, context, info) => {
            return context.prisma.post({id: root.id}).image();
        },
    }
};

/**
 * Case insensitive search in all posts uploaded by all users
 * @param searchQuery What to search
 * @returns {Promise<[]>} Array of Prisma Post db records
 */
const searchFeed = async (searchQuery) => {
    searchQuery = searchQuery.toLowerCase();
    let filteredFeed = [];
    const posts = await prisma.posts();
    for (let post of posts) {
        if (post.location.toLowerCase().includes(searchQuery)
            || post.description.toLowerCase().includes(searchQuery)
            || post.time.toLowerCase().includes(searchQuery)) {
            filteredFeed.push(post);
        }
    }
    return filteredFeed;
};

// Export typeDefs & resolvers to be combined into one schema along with others
module.exports = {
    typeDefs,
    resolvers
};
