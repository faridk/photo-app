# Securing your Prisma server
### From [here](https://www.prisma.io/docs/1.29/get-started/01-setting-up-prisma-new-database-JAVASCRIPT-a002/)

The Prisma server is currently unprotected, meaning everyone with access to its endpoint can send arbitrary requests to it. To secure the Prisma server, you need to set the managementApiSecret property in your Docker Compose file when deploying the server.

When using the Prisma CLI, you then need to set the PRISMA_MANAGEMENT_API_SECRET to the same value so that the CLI can authenticate against the secured server. Learn more [here](https://www.prisma.io/docs/prisma-server/authentication-and-security-kke4/).