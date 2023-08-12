export const storyPrompt: string = `
Write me a user story using the template above for <I_WANT_TO_TEXT> as a <AS_A_TEXT>
The template below is a user story for a registered user who wants to access a login page:
User Story:
AS A registered user,
I WANT TO access the login page
SO THAT I can log in with my username and password and access the app.
Description:
This page requires user identification and authentication by entering the correct username and password combination. It contains the following elements:
Title page
Two fields for username and password
Login button
Remember me checkbox
Command button that initiates the password-checking action
Social Media Accounts Login CTA
Acceptance Criteria:
AC1: Login successfully
GIVEN I have access to the login page,
WHEN I enter the correct username and password combination,
AND I click on the Login button,
THEN I will be redirected to the Homepage.
AC1.1: Login failed - wrong username and/or password
GIVEN I have access to the login page,
WHEN I enter an incorrect username and/or password combination,
AND I click on the Login button,
THEN an error message will be displayed below the field corresponding to the mistake, saying “Wrong username and/or password. Please fill in the correct credentials.”
AC1.2: Login failed - empty username and/or password
GIVEN I have access to the login page,
WHEN I leave at least one of the username and password fields empty,
THEN the Login button will not be clickable.
AC2: Remember me
GIVEN I have access to the login page,
AND I enter the correct username and password combination,
WHEN I want the app to remember my credentials,
THEN I have to check the Remember me checkbox before clicking on the Login button.
AC3: Forgot my password
GIVEN I have access to the login page,
WHEN I click on the “Forgot your password?” link,
THEN I will be redirected to the Password reset page (functionality covered by the “Remember me” user story).
AC4: Login with a social media/email account
GIVEN I have access to the login page,
WHEN I select to log in with my Gmail/Facebook account,
THEN a new page will be displayed to get access to my credentials (functionality covered by the “Login with Social Accounts” user story).
When the user acceptance criteria is numbered AC1.1 or AC1.2 and so on, this means that this acceptance criteria are negative scenarios for the opposite one who is numbered as AC1. Keep the AS A/I WANT TO/ SO THAT structure for a user story and add as many negative scenarios as possible for acceptance criteria.

`;


export const prompt1: string = `write me description as a user story for <I_WANT_TO_TEXT> as a <AS_A_TEXT> using the following structure
AS A
I WANT TO
SO THAT`;

export const prompt2: string = `write user acceptance criteria for <I_WANT_TO_TEXT> as a <AS_A_TEXT> considering the following format:
AC1: Title
GIVEN
WHEN
THEN.
AC3.1, for example, will be listed after AC3 as a negative scenario for AC3.  Add as many negative scenarios as possible.`;