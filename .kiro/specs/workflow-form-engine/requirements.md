# Requirements Document

## Introduction

The Workflow Form Engine upgrades the existing `ProjectWorkflowForm` shell in the Blih ERP system into a full-featured, production-grade form processing engine. Today, each of the 17 catalogued project workflow forms holds a free-form JSONB `data` blob, uses a single `reviewedByUserId` field for approvals, and renders only a title/summary pair in the UI. This feature replaces all of that with: per-form-type structured field schemas rendered as real UI controls, configurable sequential multi-approver chains wired to the existing `ApprovalWorkflow / ApprovalStep / ApprovalRequest / ApprovalAction` models, conditional approver logic evaluated at submission time, immutable versioning on resubmission, a full approval-history timeline, in-app notifications and activity log entries on every state change, a new four-permission model, and a frontend that renders actual form fields, an approver review panel, and a version-history drawer — all using `@/components/ui/blih` components exclusively and the existing React Query + api.ts patterns.

---

## Glossary

- **Form_Engine**: The upgraded system described in this document that renders, validates, submits, and routes project workflow forms through configurable approval chains.
- **Workflow_Form**: A `ProjectWorkflowForm` record with a `formKey` drawn from the 17-entry `PROJECT_WORKFLOW_FORMS` catalog.
- **Form_Schema**: A per-`formKey` static definition that declares the typed fields (label, key, type, required, options) the Form_Engine renders.
- **Form_Version**: An immutable snapshot of a Workflow_Form's `data` at the moment it is submitted. Each resubmission after a `returned-for-revision` creates a new version record.
- **Approval_Chain**: An `ApprovalWorkflow` record linked to a `formKey` via `FormDefinition.approvalWorkflowId`, consisting of ordered `ApprovalStep` records.
- **Conditional_Step**: An `ApprovalStep` whose `settings.condition` expression is evaluated against the form's `data` at submission time. Steps whose condition evaluates to `false` are skipped.
- **Approval_Request**: An `ApprovalRequest` record created when a Workflow_Form transitions to `submitted`. Its `id` is stored in `ProjectWorkflowForm.approvalRequestId`.
- **Approval_Action**: An `ApprovalAction` record written when an approver acts (approve / reject / return / cancel / skipped) on a step of an Approval_Request.
- **Approval_History**: The ordered list of Approval_Actions associated with an Approval_Request, representing the full decision timeline.
- **Submitter**: The authenticated user who creates or resubmits a Workflow_Form. Stored in `ProjectWorkflowForm.submittedByUserId`.
- **Approver**: The user or role designated in an `ApprovalStep` who must act before the Approval_Request advances to the next step.
- **Project_Manager**: The user identified by `Project.projectManagerUserId` for a given project.
- **ActivityLogger**: The singleton `ActivityService` instance exposed as `ActivityLogger` in `activity.service.ts`.
- **InternalNotifier**: The singleton `NotificationService` instance exposed as `InternalNotifier` in `notification.service.ts`.
- **Version_Drawer**: A frontend side-panel component that lists all Form_Versions of a Workflow_Form with their status and acting user.
- **Review_Panel**: A frontend component rendered in read-only mode that allows an Approver to approve, reject, or return a submitted Workflow_Form with a comment.
- **WORKFLOW_STATUS_TRANSITIONS**: The existing state-machine map in `projects.service.ts` governing valid `ProjectWorkflowForm.status` moves.

---

## Requirements

### Requirement 1: Per-Form-Type Structured Field Schemas

**User Story:** As a project manager, I want each workflow form to present the correct labeled input fields for its form type, so that team members fill in the right structured data rather than typing into a raw JSON blob.

#### Acceptance Criteria

1. THE Form_Engine SHALL define a static `FORM_SCHEMAS` registry that maps every one of the 17 `formKey` values in `PROJECT_WORKFLOW_FORMS` to an ordered array of field descriptors, where each descriptor contains at minimum: `key` (string), `label` (string), `type` (`text | textarea | number | select | date | boolean`), `required` (boolean), and `options` (string array, only for `select` type).
2. WHEN a user opens a Workflow_Form in edit mode — defined as `status` of `draft` or `returned-for-revision` where the user is permitted to edit per Requirement 8 — THE Form_Engine SHALL render one UI control per field descriptor from `FORM_SCHEMAS[formKey]`, using the `FormField` and `FormRow` components from `@/components/ui/blih`.
3. WHEN a field descriptor has `type: "select"`, THE Form_Engine SHALL render a `<select>` element whose options are drawn from the descriptor's `options` array.
4. WHEN a field descriptor has `required: true` and the user attempts to submit the form, IF the field value is `null`, `undefined`, or an empty string (for `text`, `textarea`, `select`, `date` types) or `null`/`undefined` (for `number` type, where `0` is valid), THEN THE Form_Engine SHALL display an inline validation error on that field using the `FormField` `error` prop and SHALL NOT invoke the submit API call.
5. THE Form_Engine SHALL include the following minimum fields for each named form type:
   - `project_brief`: `title` (text, required), `scope` (textarea, required), `objectives` (textarea, required), `budget` (number), `currency` (select: USD/EUR/KES/GBP), `startDate` (date), `endDate` (date).
   - `project_kickoff`: `title` (text, required), `description` (textarea), `notes` (textarea).
   - `milestone_setup`: `title` (text, required), `description` (textarea), `notes` (textarea).
   - `task_assignment`: `title` (text, required), `description` (textarea), `notes` (textarea).
   - `internal_deliverable_approval`: `title` (text, required), `description` (textarea), `notes` (textarea).
   - `client_deliverable_approval`: `title` (text, required), `description` (textarea), `notes` (textarea).
   - `change_request`: `title` (text, required), `description` (textarea, required), `impactDescription` (textarea, required), `costDelta` (number), `priority` (select: low/medium/high/critical, required), `riskLevel` (select: low/medium/high/critical, required).
   - `issue_bug_report`: `title` (text, required), `description` (textarea, required), `severity` (select: low/medium/high/critical, required), `stepsToReproduce` (textarea), `resolutionPlan` (textarea).
   - `risk_log`: `title` (text, required), `description` (textarea, required), `probability` (select: low/medium/high, required), `impact` (select: low/medium/high, required), `riskLevel` (select: low/medium/high/critical, required), `mitigationPlan` (textarea).
   - `completion_record`: `title` (text, required), `description` (textarea), `notes` (textarea).
   - `client_approval`: `title` (text, required), `description` (textarea), `notes` (textarea).
   - `final_project_closure`: `title` (text, required), `description` (textarea), `notes` (textarea).
   - `lessons_learned`: `title` (text, required), `description` (textarea), `notes` (textarea).
   - `project_evaluation_summary`: `title` (text, required), `description` (textarea), `notes` (textarea).
   - `client_feedback_summary`: `title` (text, required), `description` (textarea), `notes` (textarea).
   - `resource_handover`: `title` (text, required), `description` (textarea), `notes` (textarea).
   - `post_implementation_review`: `title` (text, required), `description` (textarea), `notes` (textarea).
6. WHEN a Workflow_Form has `status` of `approved` or `archived`, THE Form_Engine SHALL render all fields with the `disabled` attribute set and SHALL NOT render a save or submit button.
7. THE Form_Engine SHALL persist the complete structured `data` object (keyed by field `key`) to `ProjectWorkflowForm.data` via the existing `PATCH /:projectId/workflow-forms/:formId` endpoint without introducing new API routes for individual form types.

---

### Requirement 2: Sequential Multi-Approver Chains

**User Story:** As a business administrator, I want to configure sequential approval chains per form type, so that the right people review forms in the correct order before they are approved.

#### Acceptance Criteria

1. WHEN a Workflow_Form transitions to `submitted` status, THE Form_Engine SHALL look up the `FormDefinition` record whose `key` matches `formKey` and `businessId` matches the project's `businessId`, and SHALL read `FormDefinition.approvalWorkflowId` to identify the Approval_Chain to use, then set `ProjectWorkflowForm.approvalRequestId` to the newly created `ApprovalRequest.id`.
2. WHEN `FormDefinition.approvalWorkflowId` is `null` at submission time, THE Form_Engine SHALL complete the submission with `status: "submitted"` without creating an Approval_Request, and SHALL allow a user with `workflow_form.review` permission to transition the status to `approved` or `rejected` directly via the status endpoint.
3. WHEN an Approval_Request exists for a submitted Workflow_Form and the current Approver approves the current step, THE Form_Engine SHALL advance `ApprovalRequest.currentStepId` to the next `ApprovalStep` ordered by `stepOrder`.
4. WHEN an Approver approves the final `ApprovalStep` (where `isFinalStep = true`), THE Form_Engine SHALL atomically set `ApprovalRequest.status` to `approved`, `ApprovalRequest.finalDecision` to `approved`, `ApprovalRequest.completedAt` to the current UTC timestamp, and `ProjectWorkflowForm.status` to `approved` within a single database transaction.
5. WHEN an Approver rejects any step, THE Form_Engine SHALL atomically set `ApprovalRequest.status` to `rejected`, `ApprovalRequest.finalDecision` to `rejected`, `ApprovalRequest.completedAt` to the current UTC timestamp, and `ProjectWorkflowForm.status` to `rejected`.
6. WHEN an Approver returns a form for revision, THE Form_Engine SHALL atomically set `ApprovalRequest.status` to `returned`, `ApprovalRequest.currentStepId` to the first `ApprovalStep` (lowest `stepOrder`) of the workflow, and `ProjectWorkflowForm.status` to `returned-for-revision`.
7. THE Form_Engine SHALL record each approval action as an `ApprovalAction` record using the existing `RequestService.actOnRequest` method or an equivalent DAL call — it SHALL NOT duplicate the approval state machine logic.
8. THE Form_Engine SHALL expose a new API endpoint `POST /:projectId/workflow-forms/:formId/review` protected by `authRequired` and `requireActiveModule('projects')`, accepting `{ action: "approve" | "reject" | "return", comment?: string }` (comment max 1000 characters), that records the `ApprovalAction` and updates `ProjectWorkflowForm.status` to the corresponding target state (`approved`, `rejected`, or `returned-for-revision`).
9. WHEN the acting user is not designated as the Approver for the current `ApprovalStep` (neither by `approverUserId` nor by a matching `approverRoleId`), THE Form_Engine SHALL respond with HTTP 403 and a message indicating the user is not authorized to act on this step, and SHALL NOT record any `ApprovalAction` or change any status.
10. WHEN the `comment` field exceeds 1000 characters, THE Form_Engine SHALL respond with HTTP 400 and a message indicating the comment is too long.

---

### Requirement 3: Conditional Approver Steps

**User Story:** As a business administrator, I want approval steps to be skipped automatically based on the form's data values, so that forms only go to Finance when there is a cost impact and to the CEO only when the risk is critical.

#### Acceptance Criteria

1. THE Form_Engine SHALL support a `condition` expression stored in `ApprovalStep.settings.condition` as a JSON object with shape `{ field: string, operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in", value: unknown }`. An `ApprovalStep` with no `settings.condition` (null or absent) SHALL always be treated as active and SHALL never be skipped.
2. WHEN a Workflow_Form is submitted and an Approval_Request is created, THE Form_Engine SHALL evaluate each `ApprovalStep.settings.condition` against `ProjectWorkflowForm.data`. IF a condition expression references a field that does not exist in `data` or uses an unrecognized operator, THE Form_Engine SHALL treat that step's condition as evaluating to `true` (active, not skipped) to avoid silently dropping required approvals.
3. WHEN an `ApprovalStep.settings.condition` evaluates to `false` for the form's current `data`, THE Form_Engine SHALL skip that step, record an `ApprovalAction` with `action: "skipped"` for it, and continue evaluating the next step's condition, repeating until a non-skipped step is found or all steps are exhausted.
4. WHEN a non-skipped step is identified after skipping one or more steps, THE Form_Engine SHALL set `ApprovalRequest.currentStepId` to that non-skipped step and notify its Approver(s) per Requirement 6.
5. WHEN all steps in an Approval_Chain are skipped at submission time (before any human action), THE Form_Engine SHALL atomically set `ApprovalRequest.status` to `approved`, `ApprovalRequest.finalDecision` to `approved`, and `ProjectWorkflowForm.status` to `approved`.
6. WHEN all remaining steps are skipped after a human Approver approves the current step, THE Form_Engine SHALL atomically set `ApprovalRequest.status` to `approved`, `ApprovalRequest.finalDecision` to `approved`, and `ProjectWorkflowForm.status` to `approved`.
7. WHEN a `change_request` form has `data.costDelta` equal to `0` or absent, THE Form_Engine SHALL skip any `ApprovalStep` that has `condition: { field: "costDelta", operator: "gt", value: 0 }`.
8. WHEN a `change_request` or `risk_log` form has `data.riskLevel` not equal to `"critical"`, THE Form_Engine SHALL skip any `ApprovalStep` that has `condition: { field: "riskLevel", operator: "eq", value: "critical" }`.
9. WHEN an `ApprovalStep` is skipped, THE Form_Engine SHALL record an `ApprovalAction` with `action: "skipped"` and a system comment indicating the condition was not met, so that the Approval_History is complete.

---

### Requirement 4: Form Versioning

**User Story:** As a project team member, I want previous versions of a workflow form to be preserved when I resubmit after a revision request, so that auditors can see the complete edit history.

#### Acceptance Criteria

1. WHEN a Workflow_Form first transitions to `submitted`, THE Form_Engine SHALL create a `FormSubmission` record as a version snapshot, storing the complete `data` object (deep copy), `submittedByUserId`, `status: "submitted"`, `entityType: "project_workflow_form"`, `entityId: formId`, and initialize `ProjectWorkflowForm.metadata.version` to `1` if not already set.
2. WHEN a Workflow_Form in `returned-for-revision` status is resubmitted, THE Form_Engine SHALL atomically increment `ProjectWorkflowForm.metadata.version`, create a new `FormSubmission` snapshot with the updated `data`, and update `ProjectWorkflowForm.data`. IF any step (snapshot creation, version increment, or data update) fails, the entire operation SHALL be rolled back and an error returned to the caller.
3. THE Form_Engine SHALL expose a new API endpoint `GET /:projectId/workflow-forms/:formId/versions` that returns all `FormSubmission` records linked via `entityType: "project_workflow_form"` and `entityId: formId`, ordered by `createdAt` ascending. IF `formId` does not correspond to a valid `ProjectWorkflowForm` for the given `projectId` and `businessId`, THE Form_Engine SHALL respond with HTTP 404.
4. IF a `PATCH` request updates `data` fields on a Workflow_Form with `status` of `approved` or `archived`, THE Form_Engine SHALL reject the request, return an error indicating the form cannot be edited, and leave the form state unchanged.
5. THE Form_Engine SHALL ensure that `FormSubmission` version records are created without the `paranoid: true` soft-delete behavior, so that version history is permanently retained and cannot be soft-deleted via the standard destroy path.

---

### Requirement 5: Approval History Timeline

**User Story:** As a project stakeholder, I want to see a complete timeline of who approved, rejected, or returned each step and when, so that I have full visibility into the decision trail.

#### Acceptance Criteria

1. THE Form_Engine SHALL include all `ApprovalAction` records associated with the linked `ApprovalRequest.id` when returning a single Workflow_Form from `GET /:projectId/workflow-forms/:formId`, nested under an `approvalHistory` key, ordered by `createdAt` ascending.
2. THE Form_Engine SHALL include in each `ApprovalAction` entry: `id`, `action` (one of `approved`, `rejected`, `returned`, `skipped`), `comment`, `createdAt`, `actedByUserId`, and the acting user's `fullName` and `email` resolved via a joined `User` association.
3. THE Form_Engine SHALL include the linked `ApprovalRequest` record's `status`, `currentStepId`, and the current step's `stepOrder` and `approverType` when returning a single Workflow_Form, so the frontend can display the current position in the chain.
4. WHEN the `approvalHistory` array is non-empty, THE Review_Panel component SHALL render it as a vertical timeline within a `SectionCard` titled "Approval History", displaying one entry per `ApprovalAction` with: the actor's name via `UserAvatar`, the `action` label mapped to a human-readable string, the `comment` (or a dash if absent), and `createdAt` expressed as a human-readable elapsed time (e.g., "2 hours ago").
5. WHEN the `approvalHistory` array is empty, THE Review_Panel SHALL render the `SectionCard` with an `EmptyState` message indicating no approval actions have been recorded yet.
6. WHEN a Workflow_Form has no linked Approval_Request, THE Form_Engine SHALL return `approvalHistory: []` and `approvalRequest: null` rather than omitting these keys.

---

### Requirement 6: Activity Logs and In-App Notifications

**User Story:** As a project manager, I want to receive in-app notifications and see activity log entries whenever a workflow form changes state, so that I can track progress without polling the project.

#### Acceptance Criteria

1. WHEN a Workflow_Form transitions to `submitted`, THE Form_Engine SHALL call `ActivityLogger.log` with `moduleKey: "projects"`, `action: "WORKFLOW_FORM_SUBMITTED"`, `entityType: "project_workflow_form"`, `entityId: form.id`, and a human-readable `title` that includes the form name.
2. WHEN a Workflow_Form transitions to `submitted` and an Approval_Chain exists with at least one non-skipped first step, THE Form_Engine SHALL call `InternalNotifier.send` for each user identified as an Approver on that first step, with `type: "workflow_form_review_required"`, `priority: "high"`, and a message referencing the form name and project title. IF no Approvers are resolvable for the first step, THE Form_Engine SHALL log a warning but SHALL NOT fail the submission.
3. WHEN a Workflow_Form transitions to `approved`, THE Form_Engine SHALL call `ActivityLogger.log` with `action: "WORKFLOW_FORM_APPROVED"`.
4. WHEN a Workflow_Form transitions to `approved`, THE Form_Engine SHALL call `InternalNotifier.send` to notify the Submitter with `type: "workflow_form_approved"` and `priority: "high"`.
5. WHEN a Workflow_Form transitions to `rejected`, THE Form_Engine SHALL call `ActivityLogger.log` with `action: "WORKFLOW_FORM_REJECTED"`.
6. WHEN a Workflow_Form transitions to `rejected`, THE Form_Engine SHALL call `InternalNotifier.send` to notify the Submitter with `type: "workflow_form_rejected"`, including the rejecting Approver's comment in the message body. IF no comment was provided, the message SHALL omit the comment portion.
7. WHEN a Workflow_Form transitions to `returned-for-revision`, THE Form_Engine SHALL call `ActivityLogger.log` with `action: "WORKFLOW_FORM_RETURNED"`.
8. WHEN a Workflow_Form transitions to `returned-for-revision`, THE Form_Engine SHALL call `InternalNotifier.send` to notify the Submitter with `type: "workflow_form_returned"`, including the returning Approver's comment in the message body. IF no comment was provided, the message SHALL omit the comment portion.
9. WHEN a Workflow_Form transitions to `archived`, THE Form_Engine SHALL call `ActivityLogger.log` with `action: "WORKFLOW_FORM_ARCHIVED"` and SHALL call `InternalNotifier.send` to notify the Project_Manager with `type: "workflow_form_archived"` and `priority: "normal"`.
10. WHEN an Approval_Request advances to a new non-skipped step after a step approval, THE Form_Engine SHALL call `InternalNotifier.send` for each Approver designated for the new step with `type: "workflow_form_review_required"` and `priority: "high"`. IF no Approvers are resolvable for the new step, THE Form_Engine SHALL log a warning and continue.
11. THE Form_Engine SHALL use `moduleKey: "projects"` for all `ActivityLogger.log` and `InternalNotifier.send` calls related to Workflow_Forms.

---

### Requirement 7: Permission Model

**User Story:** As a system administrator, I want granular permissions for workflow forms, so that I can control who can read, submit, review, and manage forms independently.

#### Acceptance Criteria

1. THE Form_Engine SHALL add four new entries to `SYSTEM_PERMISSIONS` in `permissions.seed.ts`: one granting read access to workflow forms and their approval history; one granting creation and submission of workflow forms; one granting the ability to approve, reject, or return workflow forms; and one granting archive, chain configuration, and status override capabilities.
2. WHEN a request is made to `GET /:projectId/workflow-forms` or `GET /:projectId/workflow-forms/:formId` for that project, THE Form_Engine SHALL verify the authenticated user holds at least one of `workflow_form.read`, `workflow_form.submit`, `workflow_form.review`, or `workflow_form.manage`.
3. IF the authenticated user holds none of those four permissions for the project, THEN THE Form_Engine SHALL respond with HTTP 403 and a message indicating insufficient permissions.
4. WHEN a request is made to `POST /:projectId/workflow-forms` or `PATCH /:projectId/workflow-forms/:formId` for that project, THE Form_Engine SHALL verify the authenticated user holds `workflow_form.submit` or `workflow_form.manage`.
5. IF the authenticated user holds neither `workflow_form.submit` nor `workflow_form.manage`, THEN THE Form_Engine SHALL respond with HTTP 403 and a message indicating insufficient permissions.
6. WHEN a request is made to `POST /:projectId/workflow-forms/:formId/review` for that project, THE Form_Engine SHALL verify the authenticated user holds `workflow_form.review` or `workflow_form.manage`.
7. IF the authenticated user holds neither `workflow_form.review` nor `workflow_form.manage` for that endpoint, THEN THE Form_Engine SHALL respond with HTTP 403 and a message indicating insufficient permissions.
8. WHEN a request is made to `PATCH /:projectId/workflow-forms/:formId/status` with `status: "archived"`, THE Form_Engine SHALL verify the authenticated user holds `workflow_form.manage`. IF not, THE Form_Engine SHALL respond with HTTP 403.
9. WHEN the frontend `WorkflowFormsTab` component loads, THE Form_Engine frontend SHALL call `useMyPermissions()` to determine the current user's permission set.
10. IF the current user holds `workflow_form.submit` or `workflow_form.manage`, THE Form_Engine frontend SHALL display the create-form panel in `WorkflowFormsTab`.
11. IF the current user holds neither `workflow_form.submit` nor `workflow_form.manage`, THE Form_Engine frontend SHALL hide the create-form panel.
12. IF the current user holds `workflow_form.review` or `workflow_form.manage` and `form.status === "submitted"`, THE Form_Engine frontend SHALL display the Review_Panel.
13. IF the current user holds neither `workflow_form.review` nor `workflow_form.manage`, THE Form_Engine frontend SHALL hide the Review_Panel regardless of form status.

---

### Requirement 8: Resubmission After Revision

**User Story:** As the original submitter of a workflow form, I want to edit and resubmit a form that was returned for revision, so that I can address the reviewer's feedback and restart the approval chain.

#### Acceptance Criteria

1. IF a Workflow_Form has `status` of `returned-for-revision` and the requesting user is either the original Submitter (matched by `submittedByUserId = req.user.id`) or holds `workflow_form.manage`, THEN THE Form_Engine SHALL allow a `PATCH /:projectId/workflow-forms/:formId` call to update the `data` field. Non-data fields (status, version, approvalRequestId, submittedByUserId) SHALL remain immutable via this endpoint.
2. WHEN a Workflow_Form with `status: "returned-for-revision"` transitions to `submitted` via `PATCH /:projectId/workflow-forms/:formId/status`, THE Form_Engine SHALL create a new `FormSubmission` version snapshot before processing the transition. IF the snapshot creation fails, THE Form_Engine SHALL abort the transition, return an error to the caller, and leave the form status unchanged.
3. WHEN a resubmission occurs, THE Form_Engine SHALL cancel the previous `ApprovalRequest` by setting its `status` to `cancelled` and SHALL create a new `ApprovalRequest` against the same `ApprovalWorkflow`, with condition expressions re-evaluated against the updated `data` to determine which steps to skip.
4. WHEN a resubmission occurs, THE Form_Engine SHALL update `ProjectWorkflowForm.approvalRequestId` to the new `ApprovalRequest.id`.
5. WHEN a resubmission occurs and a new `ApprovalRequest` is created, THE Form_Engine SHALL call `InternalNotifier.send` to notify the first-step Approver(s) with `type: "workflow_form_resubmitted"` and a message indicating the form was revised and resubmitted.
6. IF a user who is not the original Submitter and does not hold `workflow_form.manage` attempts to edit a `returned-for-revision` form's `data`, THEN THE Form_Engine SHALL respond with HTTP 403 and a message indicating only the original submitter or a manager may edit a returned form.
7. IF a `PATCH /:projectId/workflow-forms/:formId/status` request attempts to transition to `submitted` from any status other than `draft` or `returned-for-revision`, THE Form_Engine SHALL reject the request with HTTP 422 and a message indicating the transition is not allowed from the current status.

---

### Requirement 9: Archiving

**User Story:** As a project manager, I want approved and old-version forms to be archived and preserved in read-only state, so that the record is immutable and always retrievable.

#### Acceptance Criteria

1. WHEN a user with `workflow_form.manage` requests an `approved` Workflow_Form to be transitioned to `archived` via `PATCH /:projectId/workflow-forms/:formId/status`, THE Form_Engine SHALL set `ProjectWorkflowForm.status` to `archived` and `ProjectWorkflowForm.archivedAt` to the current UTC timestamp.
2. WHILE a Workflow_Form has `status: "archived"`, THE Form_Engine SHALL reject any `PATCH` request to that form (data updates or status transitions) with an error indicating the form is archived and immutable.
3. THE Form_Engine SHALL allow `archived` Workflow_Forms to be retrieved via `GET /:projectId/workflow-forms` when the query includes `status=archived`.
4. IF a user without `workflow_form.manage` attempts to archive a Workflow_Form, THE Form_Engine SHALL respond with HTTP 403 and a message indicating insufficient permissions.
5. THE Form_Engine SHALL NOT allow any status transition out of `archived` — the existing `WORKFLOW_STATUS_TRANSITIONS.archived: []` map SHALL be preserved without modification.
6. WHEN a `GET /:projectId/workflow-forms/:formId/versions` request is made for an `archived` Workflow_Form, THE Form_Engine SHALL return all associated `FormSubmission` version records ordered by `createdAt` ascending. IF no versions exist, THE Form_Engine SHALL return an empty array.

---

### Requirement 10: Frontend Structured Form Rendering

**User Story:** As a project team member, I want to see the actual form fields on screen — inputs, selects, textareas, and date pickers — instead of a plain title and summary box, so that I can fill out the form correctly.

#### Acceptance Criteria

1. THE Form_Engine frontend SHALL replace the current `WorkflowFormsTab` creation panel (which uses raw `<input>` for title and summary) with a form renderer that reads `FORM_SCHEMAS[formKey]` and renders each field using `FormField` and `FormRow` from `@/components/ui/blih`.
2. WHEN a Workflow_Form is opened in edit mode (`status` of `draft` or `returned-for-revision` with edit permission), THE Form_Engine frontend SHALL pre-populate each rendered field with the value from `form.data[field.key]` if it exists.
3. THE Form_Engine frontend SHALL use a `<select>` element populated from the descriptor's `options` array for fields with `type: "select"`.
4. THE Form_Engine frontend SHALL use `<input type="number">` for fields with `type: "number"`.
5. THE Form_Engine frontend SHALL use a `<textarea>` element (via `@/components/ui/textarea`) for fields with `type: "textarea"`.
6. THE Form_Engine frontend SHALL use `<input type="date">` for fields with `type: "date"`.
7. WHEN the user saves a draft, THE Form_Engine frontend SHALL call `updateProjectWorkflowForm` from `api.ts` with the assembled `data` object without changing `status`.
8. WHEN the user submits a form, THE Form_Engine frontend SHALL first call `updateProjectWorkflowForm` to persist the current `data`, then call `changeProjectWorkflowFormStatus` with `status: "submitted"`.
9. THE Form_Engine frontend SHALL display a `StatusBadge` from `@/components/ui/blih` showing `form.status` next to each form entry in the list view.
10. THE Form_Engine frontend SHALL wrap each form detail panel in a `SectionCard` from `@/components/ui/blih`.

---

### Requirement 11: Approval Review UI

**User Story:** As an approver, I want a dedicated review panel where I can read the completed form fields in read-only mode and then approve, reject, or return it with a comment, so that I can act on approvals without leaving the project page.

#### Acceptance Criteria

1. THE Review_Panel component SHALL render all form fields from `FORM_SCHEMAS[formKey]` with their saved `data` values displayed using `FormField` from `@/components/ui/blih`, with all input elements having the `disabled` attribute set (read-only display, not editable).
2. THE Review_Panel SHALL include a `<textarea>` labeled "Comment" (max 1000 characters) where the Approver can enter a decision comment. The comment SHALL be required when the selected action is `"reject"` or `"return"`.
3. THE Review_Panel SHALL render three action buttons: "Approve" (primary), "Return for Revision" (secondary), and "Reject" (destructive variant), using the `Button` component from `@/components/ui/button`.
4. WHEN the Approver clicks "Approve", "Return for Revision", or "Reject", THE Review_Panel SHALL call a `reviewProjectWorkflowForm` API function in `api.ts` that issues `POST /:projectId/workflow-forms/:formId/review` with `{ action, comment }`.
5. WHEN the Approver clicks "Reject" or "Return for Revision" with an empty comment, THE Review_Panel SHALL display an inline validation error on the comment field using the `FormField` `error` prop and SHALL NOT invoke the API call.
6. THE Review_Panel SHALL render the `approvalHistory` as a vertical timeline in a `SectionCard` titled "Approval History" below the action buttons, displaying for each `ApprovalAction` entry: the actor's name via `UserAvatar`, the action label, the `comment` (or a dash if absent), and the `createdAt` timestamp as a human-readable elapsed time.
7. WHEN a review action succeeds, THE Review_Panel SHALL call `queryClient.invalidateQueries` on `projectKeys.workflowFormLists(projectId)` to refresh the form list.
8. THE Review_Panel SHALL be conditionally rendered only when `form.status === "submitted"` and the current user holds `workflow_form.review` or `workflow_form.manage`, checked via `useMyPermissions()`.
9. WHEN a review action mutation is pending, THE Review_Panel SHALL disable all three action buttons and render a `LoadingSpinner` from `@/components/ui/blih` inside the button corresponding to the clicked action.
10. WHEN a review action API call fails, THE Review_Panel SHALL display an `InfoAlert` with `variant="error"` showing a human-readable error message and SHALL re-enable all three action buttons.

---

### Requirement 12: Version History Drawer

**User Story:** As a project stakeholder, I want to open a side panel to browse all previous versions of a workflow form, so that I can compare what changed between revisions.

#### Acceptance Criteria

1. WHEN the user clicks a "History" button on a Workflow_Form list item or detail view, THE Version_Drawer SHALL open as a slide-in side panel with a minimum width of 480px.
2. WHEN the Version_Drawer is opened, THE Form_Engine frontend SHALL call a `listProjectWorkflowFormVersions` API function in `api.ts` that issues `GET /:projectId/workflow-forms/:formId/versions`.
3. THE Version_Drawer SHALL list each `FormSubmission` version in descending order (newest first), showing: version number taken from `metadata.version` if present, otherwise derived as the ordinal position in the ascending-sorted list; `status` as a `StatusBadge`; `submittedBy` name via `UserAvatar`; and `createdAt` formatted as "DD MMM YYYY".
4. WHEN a version entry is clicked, THE Version_Drawer SHALL expand that entry inline (accordion pattern) to show a read-only rendering of that version's `data` fields using `FORM_SCHEMAS[formKey]` and `FormField` from `@/components/ui/blih`, with all inputs rendered with the `disabled` attribute.
5. WHILE the `listProjectWorkflowFormVersions` query is loading, THE Version_Drawer SHALL display a `LoadingSpinner` from `@/components/ui/blih`. WHEN the query returns an empty array, THE Version_Drawer SHALL display an `EmptyState`. IF the query fails, THE Version_Drawer SHALL display an `InfoAlert` with `variant="error"`.
6. THE Version_Drawer SHALL be accessible to any user who holds at least `workflow_form.read`, checked via `useMyPermissions()`.
7. THE frontend SHALL add a `useProjectWorkflowFormVersions(projectId: string, formId: string)` hook in `hooks.ts` following the existing React Query pattern, with `queryKey: projectKeys.workflowFormVersions(projectId, formId)` and `staleTime: 30_000`.
8. THE `projectKeys` factory in `queryKeys.ts` SHALL be extended with a `workflowFormVersions: (projectId: string, formId: string) => readonly unknown[]` method that returns a stable, scoped cache key nested under the project detail key.
