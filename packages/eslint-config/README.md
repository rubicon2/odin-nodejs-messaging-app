# @repo/eslint-config

## Notes on dependencies

### typescript

This package uses an older version of typescript as a dependency since there is currently no API for typescipt version 7 so eslint cannot interoperate with it. For linting purposes, typescript version 6 will be used.

### eslint-plugin-import

I wanted to use ```eslint-plugin-import``` to automate the order of imported modules, but it is not compatible with eslint version 10, and version 9 is deprecated. I would rather use the up-to-date version of eslint rather than rolling back to a deprecated version just to use this plugin, so I will wait until they release a version that works with eslint version 10.
