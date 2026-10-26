# Digital Event Approval and Management System

A front-end academic prototype built with HTML, CSS, JavaScript and browser `localStorage`.

## Run the project
1. Extract `Digital_Event_Approval_System.zip`.
2. Open the `digital_event_approval_system` folder.
3. Double-click `index.html` to open it in Chrome, Edge, or Firefox.
4. Choose a demo role and enter a display name.

For a more consistent local development experience, open the folder in VS Code and run it using the Live Server extension.

## Demo workflow
1. Sign in as **Student** using the same display name you will use for later student sessions.
2. Create and submit an event request.
3. Switch user to **Class Tutor**, then approve, return, or reject the request.
4. If approved, switch to the next role (**HOD**, **Dean**, then **Principal**) and approve it at each stage.
5. Sign in again as the same student to view status/history and the final permission letter.
6. For a returned request, sign in as the student, correct the form and resubmit.

## Important prototype limitations
- Data is saved in `localStorage` in the current browser only.
- The role selector is for demonstration; it is not secure authentication.
- This prototype has no server, database, email notifications, or official college integration.
- The generated permission letter is a demo document, not an official authorization.
- Use sample/demo data only.

## Files
- `index.html` — page structure
- `style.css` — styling and responsive layout
- `script.js` — form handling, approval flow, localStorage, status/history, letter printing
