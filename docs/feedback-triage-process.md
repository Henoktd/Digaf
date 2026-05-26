# Feedback Triage Process

## How to Collect Feedback

Collect feedback during demos, local testing, deployed demo testing, compliance walkthroughs, technical reviews, and executive review sessions.

Use [feedback-capture-template.md](feedback-capture-template.md) for each feedback item. Capture enough detail for another person to reproduce or understand the issue without needing the original conversation.

Each feedback item should include:

- Reviewer name and department or role
- Review date
- Environment tested
- Module reviewed
- Feedback type
- Description
- Expected behavior
- Actual behavior
- Screenshot or evidence link where useful
- Initial severity and priority if known

## How to Classify Feedback

Classify feedback by type:

- `bug`: Incorrect or broken behavior.
- `enhancement`: New or expanded capability.
- `usability`: Experience, wording, layout, clarity, or navigation concern.
- `compliance`: Governance, regulatory, evidence, approval, or policy concern.
- `security`: Authentication, authorization, data exposure, secrets, or hardening concern.
- `data/reporting`: Data quality, metrics, exports, dashboard, or reporting concern.
- `integration`: Microsoft 365, SharePoint, Power Automate, Power BI, Entra ID, Vercel, Neon, or external system concern.

Classify the affected module and whether the issue is local-only, deployed-demo-only, or applies to both.

## Severity vs Priority Definitions

Severity describes impact. Priority describes when the team intends to act.

Severity:

- `low`: Minor polish, wording, or low-impact usability issue.
- `medium`: Workflow issue with a workaround, or moderate review concern.
- `high`: Major workflow, data, compliance, or security concern that blocks meaningful use or review.
- `critical`: Production-blocking issue, severe security risk, data integrity risk, or regulatory blocker.

Priority:

- `P0`: Must be resolved before production or before the next formal review gate.
- `P1`: Required to complete MVP scope.
- `P2`: Useful post-MVP improvement.
- `P3`: Future roadmap item.

High severity does not always mean immediate P0 if the affected feature is outside current scope, but any critical security, compliance, or data integrity issue should be reviewed for P0 treatment.

## Weekly Triage Rhythm

Run triage once per week during active review periods.

Suggested agenda:

1. Review new feedback items.
2. Confirm duplicates and merge where appropriate.
3. Classify feedback type.
4. Confirm severity and priority.
5. Assign owner.
6. Decide whether the item becomes backlog, immediate fix, or deferred.
7. Set target stage or sprint for accepted work.
8. Close items that are already resolved and verified.

For urgent P0 or critical findings, do not wait for the weekly triage meeting. Escalate immediately to the product owner, technical owner, and relevant business owner.

## Who Should Attend Triage

Core attendees:

- Product owner or business sponsor
- Technical lead
- Governance process owner
- Compliance or risk representative
- Operations representative
- QA or reviewer coordinator

Optional attendees:

- Security reviewer
- Data/reporting owner
- Microsoft 365 integration owner
- Deployment or infrastructure owner
- Executive sponsor for major scope decisions

## How Feedback Becomes Backlog

Feedback becomes a backlog item when it is:

- Understood well enough to act on
- Classified by type
- Assigned severity and priority
- Given an owner
- Mapped to a module or workflow
- Accepted as required, valuable, or intentionally deferred

Accepted items should be added to [mvp-backlog.md](mvp-backlog.md) or the team's issue tracker with a clear description and target stage or sprint.

## How Backlog Becomes Implementation Stage

A backlog item becomes an implementation stage when:

- Scope is clear and bounded
- Acceptance criteria are written
- Dependencies are identified
- Required environment variables, data, or integrations are known
- Testing expectations are defined
- Business logic, schema, package, and deployment impacts are understood

Large items should be split into smaller stages that can be implemented, reviewed, and tested safely.

## Definition of Ready

A backlog item is ready for implementation when it has:

- Problem statement
- Expected behavior
- Affected modules
- Priority
- Owner
- Acceptance criteria
- Test plan
- Known dependencies
- Decision on whether schema, package, or deployment changes are allowed
- Target stage or sprint

## Definition of Done

A backlog item is done when:

- Implementation is complete
- Acceptance criteria are met
- Relevant builds and tests pass
- Documentation is updated where needed
- Reviewer or owner has validated the result
- Known limitations are documented
- Feedback item status is updated to `done`

For production-impacting items, done may also require security, compliance, deployment, or data protection sign-off.

## How to Close the Feedback Loop with Reviewers

For each resolved item:

1. Notify the reviewer or reviewer coordinator.
2. Summarize what changed.
3. Provide the environment where it can be retested.
4. Ask the reviewer to confirm whether the issue is resolved.
5. Update the feedback status to `done` or reopen if the issue remains.

For deferred items, explain why the item was deferred and where it sits in the backlog or roadmap.
