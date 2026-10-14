# @repo/eslint-config

## Notes on dependencies

### typescript

This package uses an older version of typescript as a dependency since there is currently no API for typescipt version 7 so eslint cannot interoperate with it. For linting purposes, typescript version 6 will be used.

### eslint-plugin-import

I wanted to use ```eslint-plugin-import``` to automate the order of imported modules, but it is not compatible with eslint version 10, and version 9 is deprecated. I would rather use the up-to-date version of eslint rather than rolling back to a deprecated version just to use this plugin, so I will wait until they release a version that works with eslint version 10.

## Issues

Upon importing the base config in another project, it gives this error:

> Parsing error: No tsconfigRootDir was set, and multiple candidate TSConfigRootDirs are present:
>
> - /Users/la149/Documents/repos/odin-nodejs-messaging-app/apps/server
> - /Users/la149/Documents/repos/odin-nodejs-messaging-app/packages/schemas
>
> You'll need to explicitly set tsconfigRootDir in your parser options.
See: https://tseslint.com/parser-tsconfigrootdir

Need to fix, but following the instructions at the link didn't help. Couldn't get ```__dirname``` or ```import.meta.filename``` to work.
