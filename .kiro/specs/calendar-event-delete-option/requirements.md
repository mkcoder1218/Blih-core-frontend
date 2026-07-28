# Requirements Document

## Introduction

This feature adds a direct delete option to the calendar event action menu in the Blih ERP attendance calendar. Currently, users can only delete calendar events by first clicking "View details" and then clicking the delete button, or by using the Delete keyboard key. This enhancement surfaces the existing delete functionality directly in the initial action menu, reducing the number of clicks required to delete an event.

## Glossary

- **Calendar_Event_Action_Menu**: The popup menu that appears when a user clicks on a calendar event, displaying options like "View details", "Edit event", "Add event here", "Request meeting here", and "Block this time"
- **Delete_Button**: A button component with variant="destructive" that triggers the event deletion flow
- **Attendance_Calendar**: The calendar component in AttendanceCalendarTab.tsx that displays user events and allows event management
- **Read_Only_Calendar**: A calendar view where the user does not have permission to modify events (isReadOnlyCalendar flag)
- **Read_Only_Event**: An individual calendar event that cannot be modified (event.readOnly flag)
- **Meeting_Response_Event**: A calendar event representing a meeting invitation where the user can respond with Accept/Decline (canRespondToSelectedMeeting flag)
- **removeEvent_Function**: The existing function at line 514 that calls deleteEvent.mutateAsync(id) to delete a calendar event

## Requirements

### Requirement 1: Add Delete Button to Action Menu

**User Story:** As a calendar user, I want to delete an event directly from the action menu, so that I can remove events with fewer clicks.

#### Acceptance Criteria

1. WHEN a user clicks on a calendar event, THE Calendar_Event_Action_Menu SHALL display a Delete_Button
2. THE Delete_Button SHALL appear after the "Block this time" button in the menu order
3. THE Delete_Button SHALL use variant="destructive" for visual emphasis
4. THE Delete_Button SHALL display a Trash2 icon from lucide-react
5. THE Delete_Button SHALL have label text "Delete event" for clarity

### Requirement 2: Respect Permission Constraints

**User Story:** As a system administrator, I want delete permissions to be enforced, so that users cannot delete events they don't have permission to modify.

#### Acceptance Criteria

1. WHEN isReadOnlyCalendar is true, THE Delete_Button SHALL be disabled
2. WHEN the selected event has readOnly set to true, THE Delete_Button SHALL be disabled
3. WHEN canRespondToSelectedMeeting is true, THE Delete_Button SHALL be disabled
4. THE Delete_Button SHALL follow the same permission logic as the existing "Edit event" button

### Requirement 3: Execute Deletion Action

**User Story:** As a calendar user, I want the delete button to remove the event immediately, so that I can manage my calendar efficiently.

#### Acceptance Criteria

1. WHEN a user clicks the Delete_Button, THE Attendance_Calendar SHALL call the removeEvent_Function with the selected event's id
2. WHEN the deletion succeeds, THE Attendance_Calendar SHALL close the action menu
3. WHEN the deletion succeeds, THE Attendance_Calendar SHALL display the success message "Calendar item deleted."
4. WHEN the deletion fails, THE Attendance_Calendar SHALL display an error message from the server response

### Requirement 4: Maintain Visual Consistency

**User Story:** As a UI designer, I want the delete button to match the Blih design system, so that the interface remains consistent.

#### Acceptance Criteria

1. THE Delete_Button SHALL use size="sm" to match other action menu buttons
2. THE Delete_Button SHALL use className="justify-start gap-2" to align with other menu buttons
3. THE Delete_Button SHALL use a Trash2 icon with className="h-3.5 w-3.5" to match icon sizing
4. THE Delete_Button SHALL maintain the same hover and focus states as other action menu buttons
