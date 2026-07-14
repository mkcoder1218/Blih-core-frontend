<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Backend connection

Set the backend API URL before starting or building the frontend:

```env
VITE_API_BASE_URL="http://localhost:4000"
```

For the deployed Hostinger VPS backend, copy `.env.production.example` to `.env.production` and replace `YOUR_VPS_IP` with the VPS IP or API domain.

## Deploy to VPS with Docker

On the VPS, install Docker and the Docker Compose plugin, then set `.env.production` from `.env.production.example`.

Deploy or update the HR frontend on the VPS with your existing deploy script:

```sh
chmod +x .deploy.sh
./.deploy.sh
```

The GitHub Actions workflow keeps CI thin: it only SSHes into the VPS deploy folder and runs `./.deploy.sh`.

View your app in AI Studio: https://ai.studio/apps/dc9792d1-45a0-4773-8cf3-ddc6432ad3f2

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
