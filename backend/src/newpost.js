const fs = require("fs");
const path = require('path');
const { prisma } = require('../prisma/generated/prisma-client');
const common = require('./common');

const typeDefs = [`
	type File {
		filename: String!
		mimetype: String!
		encoding: String!
	}
	extend type Mutation {
		singleUpload(file: Upload!, location: String, description: String): String!
	}
`];

const resolvers = {
	Mutation: {
		// Crashes on Node v13.0.1 - v.13.1.0 use v12.13.0 (LTS) instead
		// https://github.com/prisma-labs/graphql-yoga/issues/604
		// internal/fs/streams.js:120
		// function _openReadFs(stream) {
		// RangeError: Maximum call stack size exceeded
		singleUpload: async (root, { file, location, description }, context, info) => {
			console.log(location, description);
			// 10 character long random string generator
			const genRandomStr = () => {
				return Math.round(Math.pow(36, 11) - Math.random() * Math.pow(36, 10)).toString(36).slice(1);
			}
			let { createReadStream, filename, mimetype, encoding } = await file;
			const stream = createReadStream();
			let saveAs = '';
			// 50 chars long to make collision and access to files just
			// by guessing/bruteforcing their urls impossible
			for (let i = 0; i < 5; i++) {
				saveAs += genRandomStr();
			}
			saveAs += '.' + mimetype.split('/')[1];
			// Re-create the folder if removed after backend start
			// where it's also created if doesn't exist
			if (!fs.existsSync(common.IMAGES_DIR)) {
				fs.mkdirSync(common.IMAGES_DIR);
			}
			const filePath = path.join(__dirname, '..', common.IMAGES_DIR, saveAs);
			await new Promise((resolve, reject) => {
				stream.on('error', error => {
					fs.unlink(filePath, () => {
						reject(error);
					});
				})
				// Save the file to disk
					.pipe(fs.createWriteStream(filePath)).on('finish', resolve);
			});
			// Check tokens, attach fields
			const user = await common.resolveUser(context.authToken);
			if (user) {
				const image = await createImage(context.ip, user, saveAs, filename);
				const post = await createPost(image, saveAs, user, location, description);
				return "ok";
			} else {
				// TODO delete the file
				console.log("context.authToken");
				console.log(context.authToken);
				return "error: log in to upload files or refresh the page";
			}

		}
	}
};

const createPost = async (image, filename, user, location, description) => {
	return await prisma.createPost({
		user: {
			connect: { email: user.email }
		},
		location: location,
		description: description,
		image: {
			connect: { id: image.id }
		},
		time: new Date(),
		likes: 0,
	}).catch((error) => {
		console.error("Prisma createPost: " + error);
	});
};

/**
 * Creates a new Prisma Image db record for a new image
 * file upload stored in filesystem separately
 * @param ip
 * @param user
 * @param saveAs
 * @param filename
 * @returns {Promise<Image>}
 */
const createImage = async (ip, user, saveAs, filename) => {
	return await prisma.createImage({
		filename: saveAs,
		originalFilename: filename,
		user: {
			connect: { email: user.email }
		},
		uploadTime: new Date(),
		uploadIP: ip
	}).catch((error) => {
		console.error("Prisma createImage: " + error);
	});
};

// Export typeDefs & resolvers to be combined into one schema along with others
module.exports = {
	typeDefs,
	resolvers
};
