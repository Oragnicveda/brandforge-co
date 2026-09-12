# Google access and locked project workflow

## What will change
- Add separate **Log in** and **Create account** options on the public page and sign-in screen. Both will continue through Google/Gmail only.
- Keep the first project editable until its first successful AI report is saved.
- After that first report, show the project as locked and make every project field read-only.
- Add a clear **Create a new project with Premium** action beside the locked project notice.
- Keep existing projects and generated reports intact; users will not receive a delete action.

## Security and data rules
- Store the lock state in Lovable Cloud, based on whether the project has a saved generation, rather than relying on browser state.
- Enforce the lock in the database so a free user cannot bypass the screen and alter a locked project.
- Allow paid users to create a new project while preserving previous projects and their report history.
- Use authenticated, owner-scoped operations for all project access.

## Premium purchase
- Add the purchase entry point and locked-state upgrade message now.
- Connect the button to checkout after the Premium price or payment URL is provided. Until then, it will lead to the existing consultation booking page rather than pretending payment succeeded.

## Verification
- Test both Google entry choices, editing before generation, automatic locking after generation, blocked edits afterward, and the Premium action on desktop and mobile.
