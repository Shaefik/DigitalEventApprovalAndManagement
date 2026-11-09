# College Permission & Event Management System (Frontend)

React + Vite + Tailwind + React Router + Recharts + Framer Motion + Lucide + Axios.
Mock data and localStorage only. `src/services/api.js` holds the Axios layer for a future Node/Express + MySQL backend.

## Run
    npm install
    npm run dev

## Demo logins
Student & staff tab (password `password123`): student@, secretary@, tutor@, faculty-advisor@, hod@, dean-su@, dean-admin@, principal@ + `college.edu`
Admin tab: username `admin`, password `admin123`
(Login page has click-to-fill buttons.) Reset data: Admin > Settings > Reset demo data.

## Workflows (src/utils/workflow.js)
- OD: Faculty Advisor -> Tutor -> Student notified (no HOD)
- Association booking: FA -> HOD -> Dean SU -> Dean Admin -> Principal
- Club booking: FA -> Dean SU -> Dean Admin -> Principal (HOD skipped)
- Any rejection (reason required) stops the flow and keeps history.
