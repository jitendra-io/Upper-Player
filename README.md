# Upper Player Official - APK hosting and Sharing Platform

Welcome to **Upper Player Official**! This is a simple, premium, and fully serverless web application designed to help you upload, host, and share your Android APK files globally using GitHub infrastructure. 

The website runs entirely in your browser and uses the **GitHub Releases API** to upload files, making it completely compatible with free static hosting platforms like **GitHub Pages**.

---

## Features

1. **Stunning Dark Theme UI**: Built with modern CSS variables, glassmorphism, responsive grids, and clean glowing effects.
2. **Client-side APK Analysis**: Uses `JSZip` to extract and display the launcher icon of your APK *before* you upload it.
3. **Dual Hosting Options**:
   - **GitHub Releases (Recommended)**: Permanent hosting backed by GitHub's Global CDN (supports files up to 2GB).
   - **Instant Share**: Zero-setup anonymous file sharing via GoFile (temporary hosting, ideal for quick testing).
4. **Instant Sharing**: Generates QR codes and short links for mobile devices to scan and install APKs immediately.
5. **Local History**: Tracks your previous uploads using local browser storage (`localStorage`) so you can access them again anytime.
6. **No Backend Required**: 100% serverless, securing your GitHub Personal Access Token directly inside your browser.

---

## 🚀 How to Host This Site Globally on GitHub Pages

Follow this simple guide to host your custom "Upper Player Official" deployment page online:

### Step 1: Create a GitHub Repository
1. Log in to [GitHub](https://github.com).
2. Click the **`+`** icon in the top-right corner and select **New repository**.
3. Name your repository (e.g., `upper-player-official`).
4. Set it to **Public** (required for free GitHub Pages hosting) and click **Create repository**.

### Step 2: Push the Files to Your Repository
Open your terminal/command prompt, navigate to the folder containing these files, and run the following commands:

```bash
# Initialize git in the folder
git init

# Add all files (index.html, styles.css, app.js, README.md)
git add .

# Commit files
git commit -m "Initial commit of Upper Player Official"

# Rename the default branch to main
git branch -M main

# Link to your GitHub repository (replace with your username and repo name)
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/upper-player-official.git

# Push the code
git push -u origin main
```

### Step 3: Enable GitHub Pages
1. Go to your repository settings page on GitHub.
2. In the left-hand sidebar, scroll down to the **Code and automation** section and click on **Pages**.
3. Under **Build and deployment**:
   - **Source**: Select `Deploy from a branch`.
   - **Branch**: Choose `main` and set the folder to `/ (root)`.
4. Click **Save**.
5. Wait 1-2 minutes. GitHub will display a live URL, typically:  
   `https://YOUR_GITHUB_USERNAME.github.io/upper-player-official/`

---

## 🔑 Setting up GitHub Release Uploads

To upload APKs directly to your GitHub Releases, the website needs a **Personal Access Token (PAT)**. This token is only stored locally in your browser's secure cache and is never sent to any server other than GitHub.

### How to generate a Classic Token:
1. In your GitHub account, click your profile picture (top right) and go to **Settings**.
2. Scroll to the bottom of the left sidebar and click **Developer settings**.
3. Click **Personal access tokens** -> **Tokens (classic)**.
4. Click **Generate new token** -> **Generate new token (classic)**.
5. Provide a note (e.g., `Upper Player Upload Token`).
6. Set the Expiration (e.g., 90 days, or No Expiration).
7. Select the **`repo`** scope checkmark (this allows the token to create releases and upload files).
8. Scroll to the bottom and click **Generate token**.
9. **Copy the token immediately** (GitHub won't show it to you again!).

### Connecting the Token:
1. Open your live hosted website.
2. In the **Hosting Target Setup** panel:
   - Select **GitHub Releases**.
   - Paste your token into the **GitHub Personal Access Token (PAT)** field.
   - Enter your **GitHub Username / Owner** (e.g. `YOUR_GITHUB_USERNAME`).
   - Enter your **Repository Name** (e.g. `upper-player-official` or a dedicated repository where you want to keep your APKs).
3. Click **Test API Connection** to verify your setup. You are now ready to upload APKs permanently!

---

## 🔒 Authorization Password
To prevent unauthorized users from deploying updates or uploading files to your repository, all uploads are protected by a security gate password:
*   **Security Password**: `Jitu@1234`
*   Before deploying any release, the uploader dashboard will require you to enter this password in the **Authorization Password** field. If incorrect, the upload will be aborted.

---

## 🛡️ Security & Privacy Notice
This website is client-side only. Your Personal Access Token (PAT) is obfuscated and saved directly in your browser's `localStorage`. It is only communicated directly to the official GitHub API (`https://api.github.com` and `https://uploads.github.com`). 

For added safety, you can create a completely separate, dedicated public repository (e.g., `my-apk-storage`) for your uploads, so your main source code repositories are unaffected.
