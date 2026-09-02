# Issue tracker: Local Markdown

Issues and specs for this project live as markdown files in `docs/tickets/`.

## Conventions

- One feature per directory: `docs/tickets/<feature-slug>/`
- The feature spec is `docs/tickets/<feature-slug>/spec.md`
- Implementation issues are one file per ticket at `docs/tickets/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01` in dependency order
- Triage state is recorded as a `Status:` line near the top of each issue file
- Comments and conversation history append to the bottom of the file under a `## Comments` heading

When a skill says to publish to the issue tracker, create the feature directory and one markdown file per approved ticket. Do not combine tickets into one file.
