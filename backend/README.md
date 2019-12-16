# Backend stack
[Prisma](https://www.prisma.io/), [Apollo](https://www.apollographql.com/), [Node](https://nodejs.org/en/), [Express](https://expressjs.com/)

## Getting started
1. Make sure you have Docker installed
2. Install Prisma CLI:
    ```sudo npm install -g prisma```

3. Check if Prisma is running by opening Prisma Admin at http://localhost:4466/_admin if Prisma (usually runs in a Java process that starts by default on boot) is not running, start it:  
  ```yarn run run-prisma```  
  or  
  ```npm run-script run-prisma```
  
4. Make sure you have all of the node modules installed:  
  ```yarn```  
  or  
  ```npm install```
5. Update Prisma data model during setup (will create `backend/prisma/generated` folder) and whenever any changes to the model are made:  
  ```yarn run update-prisma-datamodel```  
  or  
  ```npm run-script update-prisma-datamodel```
6. Run the server:  
  ```yarn run yarn-watch```  
  or  
  ```npm run-script watch```
  
7. Or build it for deployment later:  
  ```yarn run build```  
  or  
  ```npm run-script build```
 
