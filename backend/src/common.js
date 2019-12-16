const { prisma } = require('../prisma/generated/prisma-client');

const FRONTEND_DIR = "./../frontend/build";
const IMAGES_DIR = "images";

/**
 * Used by various parts of the backend to retrieve a user's db record
 * @param token Authentication token used to locate the user's db record
 * @returns {Promise<*>} Prisma User db record
 */
const resolveUser = async (token) => {
  // Find which user uploaded the file using authToken
  const allUsers = await prisma.users();
  for (let user of allUsers) {
    for (let authToken of user.authTokens) {
      if (authToken === token) {
        return user;
      }
    }
  }
};

module.exports = {
  FRONTEND_DIR,
  IMAGES_DIR,
  resolveUser
};
