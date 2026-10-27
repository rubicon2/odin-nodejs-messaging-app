# @repo/db

## Environment Variables

There are a few env files in this package. These are basically just so that when the client gets built, it doesn't throw an error about loading variables. No env variables get baked in to the generated client, and it ends up using whatever env variables are provided by the program that imports this package.

So when importing into @repo/server, or any other package, it will need to provide its own DATABASE_URL environment variable.
