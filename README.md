# Upper Player - APK Hosting and Distribution Platform

Client-side serverless web platform designed to analyze, upload, host, and distribute Android APK packages globally using GitHub infrastructure and Releases CDN.

---

## Overview

Upper Player is a serverless application built with modern vanilla web technologies. It allows developers to analyze APK binaries in the browser, extract application metadata, and publish them directly to GitHub Releases for global CDN delivery without requiring a custom backend server.

---

## Features

- Modern Dark UI: Glassmorphism interface styled with responsive CSS variables, subtle gradients, and clean layout geometry.
- Browser-Side APK Parsing: Integrated JSZip engine to inspect APK file structures and extract application launcher icons prior to uploading.
- GitHub Releases CDN Delivery: Direct multipart publishing through the GitHub REST API supporting binary files up to 2GB.
- Mobile Instant QR Distribution: On-the-fly QR code generation enabling mobile devices to scan and install applications immediately.
- Client Storage History: Local storage persistence for tracking previous deployments, release tags, and direct download URLs.
- Zero-Backend Architecture: Fully static and client-side, making the deployment 100% compatible with GitHub Pages.

---

## Tech Stack

- Frontend: HTML5, CSS3, Vanilla JavaScript
- Libraries: JSZip (binary inspection), QRCode.js (distribution)
- APIs: GitHub REST API (Releases and Assets endpoints)
- Hosting: GitHub Pages

---

## File Structure

```
├── activation_generator.html
├── app.js
├── index.html
├── styles.css
├── LICENSE
└── README.md
```

---

## Local Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/jitendra-io/Upper-Player.git
   cd Upper-Player
   ```

2. Open the application:
   Serve using any static web server (such as Live Server in VS Code, `npx serve`, or Python's `http.server`):
   ```bash
   python -m http.server 8000
   ```
   Open `http://localhost:8000` in your web browser.

---

## Configuration

To publish APK binaries directly from the browser:

1. Generate a GitHub Personal Access Token (classic) with `repo` permissions enabled.
2. In the configuration panel, specify:
   - Personal Access Token
   - GitHub Repository Owner: `jitendra-io`
   - Target Repository: `Upper-Player`
3. Click Test API Connection to verify authentication.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
