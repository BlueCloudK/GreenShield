# Domain Model

- User belongs to a Workspace through Workspace Membership.
- Workspace owns Projects.
- Project owns Targets and Scans.
- Scan stores a configuration and Test Executions.
- A failed execution creates a Finding with Evidence and a Recommendation.
- Finding can have multiple Retests.
- Completed Scan has one Report view.
- Audit Event records important workspace mutations.

Project data is queried through the authenticated workspace ID. Target credentials are excluded from API responses and encrypted at rest.
