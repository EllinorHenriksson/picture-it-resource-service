# Resource service

The resource service is responsible for handling resources in the system.

This RESTful API should be implemented to match (in every detail) the API documentation found at:
[https://courselab.lnu.se/picture-it/api/v1/docs/](https://courselab.lnu.se/picture-it/api/v1/docs/)

You are free to extend the API; however, the endpoints described in the documentation must still work and serve at least the data described above.

## Things to note

### Payload maximum

The default payload max size in the body-parser JSON in Express is limited to 100kb; however, our application should handle larger images. To do this, we need to extend the limit to 500kb by sending in an option to `express.json()` called "limit":

```javascript
 app.use(express.json({ limit: "500kb" }))
```

Reference: [http://expressjs.com/en/api.html#express.json](http://expressjs.com/en/api.html#express.json)

### Multiple MongoDB instances

It is recommended that each service runs its own MongoDB instance on the production server, even though it would be possible to use the same one or an existing one on the production server. The reason for this is that services in microservice architectures should strive to be loosely coupled so that they can be developed, deployed, and scaled independently.

To achieve this, you can start different containers of the same image on the production server or on localhost.

```bash
$ docker run -d -p 27017:27017 --name mongodb-resource mongo:5.0.6
54b0c78a016d36b2eca2dfa42a8eeabd1a2596bb6acd2721d21bd57cbc6fc381

$ docker run -d -p 27018:27017 --name mongodb-auth mongo:5.0.6
15ce7744f18deedcfdac35839e3f8b184f2e6c83222e79b5ea89ac561dfbb885

$ docker ps
CONTAINER ID   IMAGE         COMMAND                  CREATED         STATUS             PORTS                      NAMES
15ce7744f18d   mongo:5.0.6   "docker-entrypoint.s…"   8 seconds ago   Up 6 seconds       0.0.0.0:27018->27017/tcp   mongodb-auth
54b0c78a016d   mongo:5.0.6   "docker-entrypoint.s…"   6 weeks ago     Up About an hour   0.0.0.0:27017->27017/tcp   mongodb-resource
```

Now you can let the resource service connect to port 27017.
