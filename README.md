# The Quiet Room

A digital sanctuary where passing souls release their thoughts into the void. There are no metrics, no permanent profiles, and no expectations—only the quiet intimacy of anonymous expression and the comfort of knowing you are not alone. Say what you cannot say out loud.

## Built With

- Next.js (App Router)
- Tailwind CSS
- Framer Motion
- Google Sheets API (Database)
- Google Drive API (Audio Storage)

## Getting Started

To run this sanctuary locally on your machine:

1. Clone the repository to your local environment.
2. Run `npm install` to gather the necessary dependencies.
3. Create a `.env.local` file at the root of the project (reference the provided `.env.example` for the required structure).
4. Run `npm run dev` to start the local server. The room will open at `http://localhost:3000`.

## Google Cloud Setup

To breathe life into the database and audio storage, you must configure a Google Cloud project:

1. Create a new project in the Google Cloud Console.
2. Enable the **Google Sheets API** and **Google Drive API** for the project.
3. Create a **Service Account** and generate a new JSON key.
4. Extract the `client_email` and `private_key` from the JSON file to use in your `.env.local`.
5. Create a new Google Sheet. Note its ID from the URL and share it with your Service Account email (Editor access).
6. Create a new folder in Google Drive. Note its ID from the URL and share it with your Service Account email (Editor access).
7. Populate your `.env.local` with these IDs and credentials.

## Deploy

The Quiet Room is pre-configured for a seamless deployment on Vercel. Connect your repository to Vercel and input your environment variables during setup. **Crucially**, when adding the `GOOGLE_PRIVATE_KEY` in the Vercel dashboard, ensure it is pasted exactly as a single line containing literal `\n` characters, just as it appears in your JSON key file, rather than actual line breaks.

## Scaling Note

This application utilizes Google Sheets and Google Drive as an elegant, free-tier backend for small-scale intimacy. However, Google Sheets imposes strict read/write rate limits (typically around 60 requests per user per minute). If the room grows crowded and traffic exceeds these boundaries, you will begin to encounter 429 Too Many Requests errors. At that stage, you should consider migrating the data layer to a traditional relational database (like PostgreSQL) and an S3-compatible object store.
