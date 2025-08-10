Run project by this command:

1, Run docker-compose.dev.yml

```bash

docker compose up --build -d

```

2, Start development server

```bash

yarn start:dev

```


## Commit Message

```
<type>(<scope>):<Jira ID> - <short summary>
  │       │             │
  │       │             └─⫸ Summary in present tense. Not capitalized. No period at the end.
  │       │
  │       └─⫸ Commit Scope: animations|bazel|benchpress|common|compiler|compiler-cli|core|
  │                          elements|forms|http|language-service|localize|platform-browser|
  │                          platform-browser-dynamic|platform-server|router|service-worker|
  │                          upgrade|zone.js|packaging|changelog|docs-infra|migrations|
  │                          devtools
  │
  └─⫸ Commit Type: build|ci|chore|docs|feat|fix|perf|refactor|revert|style|test
```

#### Type

Must be one of the following:

- **build**: Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)
- **ci**: Changes to our CI configuration files and scripts (examples: CircleCi, SauceLabs)
- **chore**: add something without touching production code (Eg: update npm dependencies)
- **docs**: Documentation only changes
- **feat**: A new feature
- **fix**: A bug fix
- **perf**: A code change that improves performance
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **revert**: Reverts a previous commit
- **style**: Changes that do not affect the meaning of the code (Eg: adding white-space, formatting, missing semi-colons, etc)
- **test**: Adding missing tests or correcting existing tests

The `<type>` and `<summary>` fields are mandatory, the `(<scope>)` field is optional.
