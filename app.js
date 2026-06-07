// Upper Player Official - Core Application Logic

document.addEventListener('DOMContentLoaded', () => {
    // State management
    const state = {
        currentFile: null,
        extractedIcon: null, // Base64 icon data
        config: {
            destination: 'github',
            githubToken: '',
            githubOwner: '',
            githubRepo: ''
        },
        history: []
    };

    // DOM Elements
    const el = {
        // Destination selectors
        btnDestGithub: document.getElementById('btn-dest-github'),
        btnDestInstant: document.getElementById('btn-dest-instant'),
        githubConfigFields: document.getElementById('github-config-fields'),
        instantConfigInfo: document.getElementById('instant-config-info'),
        
        // GitHub configuration inputs
        inputGhToken: document.getElementById('gh-token'),
        inputGhOwner: document.getElementById('gh-owner'),
        inputGhRepo: document.getElementById('gh-repo'),
        btnToggleToken: document.getElementById('btn-toggle-token'),
        btnTestConnection: document.getElementById('btn-test-connection'),
        testSpinner: document.getElementById('test-spinner'),
        testConnectionStatus: document.getElementById('test-connection-status'),
        
        // Upload areas
        dropZone: document.getElementById('drop-zone'),
        fileInput: document.getElementById('file-input'),
        
        // Progress panel
        analysisProgress: document.getElementById('analysis-progress'),
        progressStatusText: document.getElementById('progress-status-text'),
        progressPercent: document.getElementById('progress-percent'),
        progressBarFill: document.getElementById('progress-bar-fill'),
        
        // APK details panel
        apkDetailsCard: document.getElementById('apk-details-card'),
        apkIconContainer: document.getElementById('apk-icon-container'),
        detailFileName: document.getElementById('detail-file-name'),
        detailFileSize: document.getElementById('detail-file-size'),
        inputApkDisplayName: document.getElementById('apk-display-name'),
        inputApkVersion: document.getElementById('apk-version'),
        inputApkBuild: document.getElementById('apk-build'),
        inputApkReleaseNotes: document.getElementById('apk-release-notes'),
        btnCancelUpload: document.getElementById('btn-cancel-upload'),
        btnConfirmUpload: document.getElementById('btn-confirm-upload'),
        
        // Result panel
        uploadResultCard: document.getElementById('upload-result-card'),
        resultSuccessMessage: document.getElementById('result-success-message'),
        resultQrCode: document.getElementById('result-qr-code'),
        resultDownloadUrl: document.getElementById('result-download-url'),
        btnCopyUrl: document.getElementById('btn-copy-url'),
        resAppName: document.getElementById('res-app-name'),
        resAppVersion: document.getElementById('res-app-version'),
        resFileSize: document.getElementById('res-file-size'),
        resRepoLink: document.getElementById('res-repo-link'),
        btnUploadAnother: document.getElementById('btn-upload-another'),
        
        // History panel
        historyListBody: document.getElementById('history-list-body'),
        btnClearHistory: document.getElementById('btn-clear-history'),
        
        // Modal
        qrModal: document.getElementById('qr-modal'),
        modalTitle: document.getElementById('modal-title'),
        modalQrCanvas: document.getElementById('modal-qr-canvas'),
        modalUrl: document.getElementById('modal-url'),
        modalCopyBtn: document.getElementById('modal-copy-btn'),
        closeModal: document.querySelector('.close-modal')
    };

    // Initialize the app
    init();

    function init() {
        loadConfig();
        loadHistory();
        setupEventListeners();
        renderHistory();
        
        // Handle routing
        handleRouting();
        window.addEventListener('hashchange', handleRouting);
    }

    // --- Routing & Public View ---

    async function handleRouting() {
        const hash = window.location.hash;
        
        // Elements for views
        const adminView = document.getElementById('admin-view');
        const publicView = document.getElementById('public-view');
        const linkGotoAdmin = document.getElementById('link-goto-admin');
        const linkGotoPublic = document.getElementById('link-goto-public');
        const linkDivider = document.getElementById('link-divider');

        if (hash === '#admin') {
            if (adminView) adminView.style.display = 'grid';
            if (publicView) publicView.style.display = 'none';
            if (linkGotoAdmin) linkGotoAdmin.style.display = 'none';
            
            // Show public link if repository details exist
            if (state.config.githubOwner && state.config.githubRepo) {
                if (linkGotoPublic) linkGotoPublic.style.display = 'inline-block';
                if (linkDivider) linkDivider.style.display = 'inline-block';
            } else {
                if (linkGotoPublic) linkGotoPublic.style.display = 'none';
                if (linkDivider) linkDivider.style.display = 'none';
            }
            return;
        }

        // Check if hosted on GitHub Pages or configured
        let owner = state.config.githubOwner;
        let repo = state.config.githubRepo;

        const hostname = window.location.hostname;
        const pathname = window.location.pathname;

        if (hostname.endsWith('.github.io')) {
            owner = hostname.split('.')[0];
            // Pathname on github pages is usually /repo-name/
            const pathParts = pathname.split('/').filter(Boolean);
            if (pathParts.length > 0) {
                repo = pathParts[0];
            }
        }

        if (owner && repo) {
            try {
                // Fetch latest release publicly without credentials
                const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`);
                if (response.ok) {
                    const data = await response.json();
                    // Find APK asset
                    const apkAsset = data.assets.find(asset => asset.name.endsWith('.apk'));
                    if (apkAsset) {
                        renderPublicDownloadView(data, apkAsset, owner, repo);
                        if (adminView) adminView.style.display = 'none';
                        if (publicView) publicView.style.display = 'block';
                        if (linkGotoAdmin) linkGotoAdmin.style.display = 'inline-block';
                        if (linkGotoPublic) linkGotoPublic.style.display = 'none';
                        if (linkDivider) linkDivider.style.display = 'inline-block';
                        return;
                    }
                }
            } catch (e) {
                console.warn("Error fetching latest release:", e);
            }
        }

        // Default to admin view if no release found or not configured
        if (adminView) adminView.style.display = 'grid';
        if (publicView) publicView.style.display = 'none';
        if (linkGotoAdmin) linkGotoAdmin.style.display = 'none';
        if (linkGotoPublic) linkGotoPublic.style.display = 'none';
        if (linkDivider) linkDivider.style.display = 'none';
    }

    function renderPublicDownloadView(releaseData, apkAsset, owner, repo) {
        const pubAppName = document.getElementById('pub-app-name');
        const pubAppVersion = document.getElementById('pub-app-version');
        const pubFileSize = document.getElementById('pub-file-size');
        const pubReleaseDate = document.getElementById('pub-release-date');
        const pubReleaseNotes = document.getElementById('pub-release-notes');
        const btnPubDownload = document.getElementById('btn-pub-download');
        const pubApkIcon = document.getElementById('pub-apk-icon');

        // Extract clean app name
        let cleanName = releaseData.name || repo;
        cleanName = cleanName.replace(/v?\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?/g, '').trim();
        pubAppName.textContent = cleanName || 'Upper Player';

        pubAppVersion.textContent = releaseData.tag_name;
        
        const sizeMB = (apkAsset.size / (1024 * 1024)).toFixed(2);
        pubFileSize.textContent = `${sizeMB} MB`;
        
        const pubDate = new Date(releaseData.published_at);
        pubReleaseDate.textContent = pubDate.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Strip uploader notes footer and display description
        let notesText = releaseData.body || 'No release notes provided.';
        notesText = notesText.split('*Uploaded via Upper Player')[0].trim();
        pubReleaseNotes.textContent = notesText;

        // Set download URL
        btnPubDownload.href = apkAsset.browser_download_url;

        // Try to match icon data from history cache
        let cachedIcon = null;
        if (state.history && state.history.length > 0) {
            const historyMatch = state.history.find(h => h.version === releaseData.tag_name);
            if (historyMatch && historyMatch.iconData) {
                cachedIcon = historyMatch.iconData;
            }
        }
        
        if (cachedIcon) {
            pubApkIcon.innerHTML = `<img src="${cachedIcon}" alt="App Icon">`;
        } else {
            pubApkIcon.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="android-fallback">
                    <line x1="6" y1="3" x2="6" y2="5"></line>
                    <line x1="18" y1="3" x2="18" y2="5"></line>
                    <path d="M12 5a7 7 0 0 0-7 7v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a7 7 0 0 0-7-7z"></path>
                    <circle cx="8.5" cy="11.5" r="1"></circle>
                    <circle cx="15.5" cy="11.5" r="1"></circle>
                </svg>`;
        }

        // Draw QR code for mobile scanner
        new QRious({
            element: document.getElementById('pub-qr-code'),
            value: apkAsset.browser_download_url,
            size: 300,
            background: '#ffffff',
            foreground: '#08090f',
            level: 'H'
        });
    }

    // --- State & Config Management ---

    function loadConfig() {
        const savedDest = localStorage.getItem('up_destination');
        const savedToken = localStorage.getItem('up_gh_token');
        const savedOwner = localStorage.getItem('up_gh_owner');
        const savedRepo = localStorage.getItem('up_gh_repo');

        if (savedDest) {
            state.config.destination = savedDest;
            updateDestinationUI(savedDest);
        }
        if (savedToken) {
            state.config.githubToken = atob(savedToken); // Decode basic obfuscation
            el.inputGhToken.value = state.config.githubToken;
        }
        if (savedOwner) {
            state.config.githubOwner = savedOwner;
            el.inputGhOwner.value = savedOwner;
        }
        if (savedRepo) {
            state.config.githubRepo = savedRepo;
            el.inputGhRepo.value = savedRepo;
        }
    }

    function saveConfig() {
        localStorage.setItem('up_destination', state.config.destination);
        localStorage.setItem('up_gh_token', btoa(state.config.githubToken)); // Basic obfuscation to prevent plain sight reading
        localStorage.setItem('up_gh_owner', state.config.githubOwner);
        localStorage.setItem('up_gh_repo', state.config.githubRepo);
    }

    function loadHistory() {
        const savedHistory = localStorage.getItem('up_history');
        if (savedHistory) {
            try {
                state.history = JSON.parse(savedHistory);
            } catch (e) {
                console.error("Failed to parse history", e);
                state.history = [];
            }
        }
    }

    function saveHistory() {
        localStorage.setItem('up_history', JSON.stringify(state.history));
    }

    function addToHistory(item) {
        // Keep only last 15 items to manage storage space
        state.history.unshift(item);
        if (state.history.length > 15) {
            state.history.pop();
        }
        saveHistory();
        renderHistory();
    }

    // --- UI State Transitions ---

    function updateDestinationUI(dest) {
        state.config.destination = dest;
        const radios = document.getElementsByName('upload_destination');
        radios.forEach(radio => {
            if (radio.value === dest) {
                radio.checked = true;
                radio.closest('.radio-option').classList.add('active');
            } else {
                radio.closest('.radio-option').classList.remove('active');
            }
        });

        if (dest === 'github') {
            el.githubConfigFields.style.display = 'block';
            el.instantConfigInfo.style.display = 'none';
        } else {
            el.githubConfigFields.style.display = 'none';
            el.instantConfigInfo.style.display = 'block';
        }
    }

    function resetUploadState() {
        state.currentFile = null;
        state.extractedIcon = null;
        
        el.fileInput.value = '';
        el.dropZone.style.display = 'block';
        el.analysisProgress.style.display = 'none';
        el.apkDetailsCard.style.display = 'none';
        el.uploadResultCard.style.display = 'none';
        
        // Reset progress bar
        updateProgress(0, 'Ready');
    }

    function updateProgress(percent, statusText) {
        el.progressBarFill.style.width = `${percent}%`;
        el.progressPercent.textContent = `${Math.round(percent)}%`;
        el.progressStatusText.textContent = statusText;
    }

    // --- Event Listeners Setup ---

    function setupEventListeners() {
        // Destination selectors
        el.btnDestGithub.addEventListener('click', () => {
            updateDestinationUI('github');
            saveConfig();
        });
        el.btnDestInstant.addEventListener('click', () => {
            updateDestinationUI('instant');
            saveConfig();
        });

        // Config Inputs
        el.inputGhToken.addEventListener('input', (e) => {
            state.config.githubToken = e.target.value.trim();
            saveConfig();
        });
        el.inputGhOwner.addEventListener('input', (e) => {
            state.config.githubOwner = e.target.value.trim();
            saveConfig();
        });
        el.inputGhRepo.addEventListener('input', (e) => {
            state.config.githubRepo = e.target.value.trim();
            saveConfig();
        });

        // Toggle Token Visibility
        el.btnToggleToken.addEventListener('click', () => {
            const isPassword = el.inputGhToken.type === 'password';
            el.inputGhToken.type = isPassword ? 'text' : 'password';
            
            // Swap eye icon
            el.btnToggleToken.innerHTML = isPassword 
                ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-closed">
                     <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                     <line x1="1" y1="1" x2="23" y2="23"></line>
                   </svg>`
                : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-open">
                     <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                     <circle cx="12" cy="12" r="3"></circle>
                   </svg>`;
        });

        // Test API Connection
        el.btnTestConnection.addEventListener('click', testGitHubConnection);

        // File Drag & Drop
        el.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            el.dropZone.classList.add('dragover');
        });

        el.dropZone.addEventListener('dragleave', () => {
            el.dropZone.classList.remove('dragover');
        });

        el.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            el.dropZone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                handleSelectedFile(e.dataTransfer.files[0]);
            }
        });

        el.dropZone.addEventListener('click', () => {
            el.fileInput.click();
        });

        el.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleSelectedFile(e.target.files[0]);
            }
        });

        // Details Panel Buttons
        el.btnCancelUpload.addEventListener('click', resetUploadState);
        el.btnConfirmUpload.addEventListener('click', startDeployment);

        // Upload another & copy url
        el.btnUploadAnother.addEventListener('click', resetUploadState);
        el.btnCopyUrl.addEventListener('click', () => {
            copyToClipboard(el.resultDownloadUrl.value, el.btnCopyUrl, 'Copy', 'Copied!');
        });

        // History Actions
        el.btnClearHistory.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear your entire deployment history?')) {
                state.history = [];
                saveHistory();
                renderHistory();
            }
        });

        // Modal Close
        el.closeModal.addEventListener('click', () => {
            el.qrModal.classList.remove('active');
        });
        window.addEventListener('click', (e) => {
            if (e.target === el.qrModal) {
                el.qrModal.classList.remove('active');
            }
        });
        el.modalCopyBtn.addEventListener('click', () => {
            copyToClipboard(el.modalUrl.textContent, el.modalCopyBtn, 'Copy Link', 'Link Copied!');
        });
    }

    // --- GitHub Connection Verification ---

    async function testGitHubConnection() {
        if (!state.config.githubToken || !state.config.githubOwner || !state.config.githubRepo) {
            showTestStatus('Please fill in Token, Owner, and Repository.', 'error');
            return;
        }

        el.btnTestConnection.disabled = true;
        el.testSpinner.style.display = 'inline-block';
        showTestStatus('Connecting to GitHub API...', '');

        try {
            const response = await fetch(`https://api.github.com/repos/${state.config.githubOwner}/${state.config.githubRepo}`, {
                headers: {
                    'Authorization': `token ${state.config.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                showTestStatus(`Connected successfully! Repository: ${data.full_name}`, 'success');
            } else {
                const errData = await response.json().catch(() => ({}));
                const errMsg = errData.message || `HTTP ${response.status}`;
                showTestStatus(`Failed to connect: ${errMsg}. Check credentials/scopes.`, 'error');
            }
        } catch (e) {
            showTestStatus(`Connection error: ${e.message}`, 'error');
        } finally {
            el.btnTestConnection.disabled = false;
            el.testSpinner.style.display = 'none';
        }
    }

    function showTestStatus(msg, type) {
        el.testConnectionStatus.textContent = msg;
        el.testConnectionStatus.className = 'status-msg';
        if (type) {
            el.testConnectionStatus.classList.add(type);
        }
    }

    // --- Local File Processing & APK Extraction ---

    function handleSelectedFile(file) {
        if (!file.name.toLowerCase().endsWith('.apk')) {
            alert('Please select a valid Android package file (.apk).');
            return;
        }

        state.currentFile = file;
        el.dropZone.style.display = 'none';
        el.analysisProgress.style.display = 'block';
        
        updateProgress(20, 'Reading file contents...');

        const reader = new FileReader();
        
        reader.onload = async function(e) {
            updateProgress(45, 'Scanning APK structure...');
            const arrayBuffer = e.target.result;
            
            try {
                // Load APK as a zip archive using JSZip
                const zip = await JSZip.loadAsync(arrayBuffer);
                updateProgress(70, 'Searching for application assets...');
                
                // Attempt to extract the app launcher icon
                const iconBase64 = await extractLauncherIcon(zip);
                state.extractedIcon = iconBase64;
                
                updateProgress(100, 'APK Analysis Complete!');
                
                setTimeout(() => {
                    showApkDetailsPanel(file, iconBase64);
                }, 400);
                
            } catch (err) {
                console.error("Error unzipping APK:", err);
                updateProgress(100, 'APK parsed (no resource extraction)');
                // Fallback to normal details without icon extraction
                setTimeout(() => {
                    showApkDetailsPanel(file, null);
                }, 400);
            }
        };

        reader.onerror = function() {
            alert('Failed to read the file.');
            resetUploadState();
        };

        reader.readAsArrayBuffer(file);
    }

    async function extractLauncherIcon(zip) {
        // Scan the files list inside the zip
        const files = Object.keys(zip.files);
        
        // Search criteria for launcher icons:
        // Commonly: res/mipmap-.../ic_launcher.png, res/drawable-.../ic_launcher.png, or custom names matching *icon*.png
        const iconPaths = files.filter(path => {
            const lowerPath = path.toLowerCase();
            return (lowerPath.includes('ic_launcher') || lowerPath.includes('app_icon') || lowerPath.includes('launcher_icon')) 
                   && lowerPath.endsWith('.png') 
                   && !lowerPath.includes('__macosx'); // Exclude mac files
        });

        if (iconPaths.length === 0) {
            // Backup search: search for any PNG file inside mipmap or drawable folders containing "icon"
            const backupPaths = files.filter(path => {
                const lowerPath = path.toLowerCase();
                return (lowerPath.includes('mipmap') || lowerPath.includes('drawable')) 
                       && lowerPath.includes('icon') 
                       && lowerPath.endsWith('.png');
            });
            if (backupPaths.length > 0) {
                iconPaths.push(...backupPaths);
            }
        }

        if (iconPaths.length === 0) return null;

        // Choose the best resolution file (e.g. xxxhdpi or xxhdpi if available)
        // Sort by path string length or directory name hints to try and get higher resolutions
        iconPaths.sort((a, b) => {
            const score = (path) => {
                if (path.includes('xxxhdpi')) return 5;
                if (path.includes('xxhdpi')) return 4;
                if (path.includes('xhdpi')) return 3;
                if (path.includes('hdpi')) return 2;
                if (path.includes('mdpi')) return 1;
                return 0;
            };
            return score(b) - score(a);
        });

        const chosenPath = iconPaths[0];
        console.log("Extracting icon from path:", chosenPath);
        
        // Extract file as base64 string
        const base64Data = await zip.file(chosenPath).async("base64");
        return `data:image/png;base64,${base64Data}`;
    }

    function showApkDetailsPanel(file, iconBase64) {
        el.analysisProgress.style.display = 'none';
        el.apkDetailsCard.style.display = 'block';

        // File stats
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        el.detailFileName.textContent = file.name;
        el.detailFileSize.textContent = `${sizeMB} MB`;

        // Extracted Icon
        if (iconBase64) {
            el.apkIconContainer.innerHTML = `<img src="${iconBase64}" alt="App Icon">`;
        } else {
            // Fallback Android icon SVG
            el.apkIconContainer.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="android-fallback">
                    <line x1="6" y1="3" x2="6" y2="5"></line>
                    <line x1="18" y1="3" x2="18" y2="5"></line>
                    <path d="M12 5a7 7 0 0 0-7 7v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a7 7 0 0 0-7-7z"></path>
                    <circle cx="8.5" cy="11.5" r="1"></circle>
                    <circle cx="15.5" cy="11.5" r="1"></circle>
                </svg>`;
        }

        // Set metadata defaults
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        el.inputApkDisplayName.value = capitalizeWords(cleanName);
        
        // Generate pre-filled version
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        el.inputApkVersion.value = `v1.0.0-${year}${month}${day}`;
        el.inputApkBuild.value = `${hours}${minutes}`;
        el.inputApkReleaseNotes.value = 'Initial APK deployment for testing.';
    }

    // --- Deployment Handler (Uploader Router) ---

    async function startDeployment() {
        // Password validation gate
        const passwordInput = document.getElementById('upload-password');
        if (!passwordInput || passwordInput.value !== 'Jitu@1234') {
            alert('Incorrect authorization password. Upload aborted.');
            return;
        }

        const appName = el.inputApkDisplayName.value.trim() || 'Android App';
        const versionTag = el.inputApkVersion.value.trim().replace(/\s+/g, '-').toLowerCase() || 'v1.0.0';
        const buildCode = el.inputApkBuild.value.trim();
        const notes = el.inputApkReleaseNotes.value.trim() || 'No description provided.';

        if (!state.currentFile) return;

        el.apkDetailsCard.style.display = 'none';
        el.analysisProgress.style.display = 'block';

        // Clear password input for security
        passwordInput.value = '';

        if (state.config.destination === 'github') {
            // Validate setup
            if (!state.config.githubToken || !state.config.githubOwner || !state.config.githubRepo) {
                alert('GitHub configuration is incomplete. Please configure your settings first.');
                showApkDetailsPanel(state.currentFile, state.extractedIcon);
                return;
            }
            await deployToGitHub(appName, versionTag, notes);
        } else {
            await deployToInstantShare(appName, versionTag, notes);
        }
    }

    // --- GitHub Deployment Implementation ---

    async function deployToGitHub(appName, versionTag, notes) {
        updateProgress(10, 'Initializing GitHub Connection...');
        const token = state.config.githubToken;
        const owner = state.config.githubOwner;
        const repo = state.config.githubRepo;
        const file = state.currentFile;

        try {
            // 1. Create Github Release
            updateProgress(30, 'Creating repository release tag...');
            const releasePayload = {
                tag_name: versionTag,
                target_commitish: 'main',
                name: `${appName} ${versionTag}`,
                body: `${notes}\n\n*Uploaded via Upper Player Official*`,
                draft: false,
                prerelease: false
            };

            let releaseResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases`, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(releasePayload)
            });

            // Handle existing tag conflict by appending unique string
            if (releaseResponse.status === 422) {
                updateProgress(35, 'Release tag exists, generating unique tag...');
                const uniqueTag = `${versionTag}-${Date.now().toString().slice(-6)}`;
                releasePayload.tag_name = uniqueTag;
                releasePayload.name = `${appName} ${uniqueTag}`;
                
                releaseResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(releasePayload)
                });
            }

            if (!releaseResponse.ok) {
                const err = await releaseResponse.json().catch(() => ({}));
                throw new Error(`Failed to create release: ${err.message || releaseResponse.statusText}`);
            }

            const releaseData = await releaseResponse.json();
            const releaseId = releaseData.id;
            const releaseHtmlUrl = releaseData.html_url;

            // 2. Upload APK file as Release Asset
            updateProgress(50, 'Uploading APK binary to GitHub Release CDN...');
            
            // Clean upload URL template {?name,label}
            const cleanUploadUrl = `https://uploads.github.com/repos/${owner}/${repo}/releases/${releaseId}/assets?name=${encodeURIComponent(file.name)}`;

            // Standard Fetch does not support upload progress tracking for request bodies. 
            // We use XMLHttpRequest for fine-grained progress updates during file uploading.
            await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', cleanUploadUrl, true);
                xhr.setRequestHeader('Authorization', `token ${token}`);
                xhr.setRequestHeader('Accept', 'application/vnd.github.v3+json');
                xhr.setRequestHeader('Content-Type', 'application/octet-stream');

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = (event.loaded / event.total) * 45; // Span 50% to 95%
                        updateProgress(50 + percentComplete, `Uploading binary: ${Math.round(percentComplete * 2)}%`);
                    }
                };

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const assetData = JSON.parse(xhr.responseText);
                            resolve(assetData);
                        } catch (e) {
                            reject(new Error('Failed to parse asset data response'));
                        }
                    } else {
                        try {
                            const err = JSON.parse(xhr.responseText);
                            reject(new Error(`Asset upload failed: ${err.message || xhr.statusText}`));
                        } catch (e) {
                            reject(new Error(`Asset upload failed: HTTP ${xhr.status}`));
                        }
                    }
                };

                xhr.onerror = () => reject(new Error('Network error during asset upload.'));
                xhr.send(file);
            }).then(assetData => {
                // 3. Success! Display sharing screen
                updateProgress(100, 'Deployment Complete!');
                
                const downloadUrl = assetData.browser_download_url;
                
                setTimeout(() => {
                    showDeploymentResult({
                        appName: appName,
                        version: releasePayload.tag_name,
                        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
                        downloadUrl: downloadUrl,
                        repoLink: releaseHtmlUrl,
                        repoName: `${owner}/${repo}`,
                        destination: 'github'
                    });
                }, 400);

            }).catch(err => {
                throw err;
            });

        } catch (e) {
            console.error(e);
            alert(`GitHub Deployment Failed: ${e.message}`);
            showApkDetailsPanel(state.currentFile, state.extractedIcon);
        }
    }

    // --- GoFile (Instant Mode) Deployment Implementation ---

    async function deployToInstantShare(appName, versionTag, notes) {
        updateProgress(15, 'Contacting file storage server...');
        const file = state.currentFile;

        try {
            // 1. Get available upload server
            const serverResponse = await fetch('https://api.gofile.io/servers');
            if (!serverResponse.ok) {
                throw new Error('Could not contact GoFile server selector API.');
            }
            
            const serverData = await serverResponse.json();
            if (serverData.status !== 'ok' || !serverData.data.servers.length) {
                throw new Error('GoFile selector returned an invalid status.');
            }

            const bestServer = serverData.data.servers[0].name;
            updateProgress(30, `Server allocated (${bestServer}). Starting upload...`);

            // 2. Perform File Upload with progress
            const uploadUrl = `https://upload.gofile.io/uploadfile`; // Fallback/Standard GoFile API endpoint

            const formData = new FormData();
            formData.append('file', file);

            // Upload via XMLHttpRequest for progress tracking
            const uploadResult = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                // Send to the allocated server
                xhr.open('POST', `https://${bestServer}.gofile.io/uploadfile`, true);

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = (event.loaded / event.total) * 65; // Span 30% to 95%
                        updateProgress(30 + percentComplete, `Uploading files: ${Math.round(event.loaded * 100 / event.total)}%`);
                    }
                };

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const resJson = JSON.parse(xhr.responseText);
                            resolve(resJson);
                        } catch (e) {
                            reject(new Error('Invalid JSON response from server'));
                        }
                    } else {
                        reject(new Error(`Upload failed with status code ${xhr.status}`));
                    }
                };

                xhr.onerror = () => reject(new Error('Network error during file transfer.'));
                xhr.send(formData);
            });

            if (uploadResult.status !== 'ok') {
                throw new Error(uploadResult.data || 'Upload was rejected by host.');
            }

            // GoFile response contains downloadPage URL which acts as the sharing link
            const downloadUrl = uploadResult.data.downloadPage;

            updateProgress(100, 'Deployment Complete!');

            setTimeout(() => {
                showDeploymentResult({
                    appName: appName,
                    version: versionTag,
                    fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
                    downloadUrl: downloadUrl,
                    repoLink: '#',
                    repoName: 'GoFile Cloud Storage',
                    destination: 'gofile'
                });
            }, 400);

        } catch (e) {
            console.error(e);
            alert(`Instant Share Upload Failed: ${e.message}. Please try again or use GitHub hosting.`);
            showApkDetailsPanel(state.currentFile, state.extractedIcon);
        }
    }

    // --- Success & Result Screen Renders ---

    function showDeploymentResult(result) {
        el.analysisProgress.style.display = 'none';
        el.uploadResultCard.style.display = 'block';

        // Load values into UI
        el.resultDownloadUrl.value = result.downloadUrl;
        el.resAppName.textContent = result.appName;
        el.resAppVersion.textContent = result.version;
        el.resFileSize.textContent = result.fileSize;

        if (result.destination === 'github') {
            el.resultSuccessMessage.textContent = 'Your APK is hosted globally on GitHub CDN.';
            el.resRepoLink.innerHTML = `<a href="${result.repoLink}" target="_blank">${result.repoName}</a>`;
        } else {
            el.resultSuccessMessage.textContent = 'Your APK is uploaded to GoFile Cloud Storage.';
            el.resRepoLink.textContent = 'Anonymous File Share';
        }

        // Generate QR code
        new QRious({
            element: el.resultQrCode,
            value: result.downloadUrl,
            size: 300,
            background: '#ffffff',
            foreground: '#08090f',
            level: 'H'
        });

        // Add to localStorage history
        addToHistory({
            id: Date.now().toString(),
            appName: result.appName,
            version: result.version,
            fileSize: result.fileSize,
            downloadUrl: result.downloadUrl,
            uploadDate: new Date().toLocaleDateString(),
            destination: result.destination,
            repoName: result.repoName,
            iconData: state.extractedIcon // Store base64 icon in history (or null)
        });
    }

    // --- History Table Management ---

    function renderHistory() {
        if (state.history.length === 0) {
            el.historyListBody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-history">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="empty-icon">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                            <polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline>
                            <polyline points="7.5 19.79 7.5 14.67 3 12"></polyline>
                            <polyline points="16.5 19.79 16.5 14.67 21 12"></polyline>
                            <polyline points="12 22.08 12 12"></polyline>
                            <line x1="12" y1="12" x2="3" y2="6.81"></line>
                            <line x1="12" y1="12" x2="21" y2="6.81"></line>
                        </svg>
                        <p>No deployment history found</p>
                    </td>
                </tr>`;
            el.btnClearHistory.style.display = 'none';
            return;
        }

        el.btnClearHistory.style.display = 'inline-block';
        el.historyListBody.innerHTML = '';

        state.history.forEach(item => {
            const tr = document.createElement('tr');
            
            // App Icon
            let iconHtml = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="android-fallback">
                    <line x1="6" y1="3" x2="6" y2="5"></line>
                    <line x1="18" y1="3" x2="18" y2="5"></line>
                    <path d="M12 5a7 7 0 0 0-7 7v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a7 7 0 0 0-7-7z"></path>
                    <circle cx="8.5" cy="11.5" r="1"></circle>
                    <circle cx="15.5" cy="11.5" r="1"></circle>
                </svg>`;
            if (item.iconData) {
                iconHtml = `<img src="${item.iconData}" alt="${item.appName}">`;
            }

            // Destination badge
            const destBadge = item.destination === 'github' 
                ? `<span class="badge badge-primary" style="font-size: 9px; cursor: help;" title="${item.repoName}">GitHub Release</span>` 
                : `<span class="badge badge-secondary" style="font-size: 9px;">GoFile Cloud</span>`;

            tr.innerHTML = `
                <td>
                    <div class="history-app-info">
                        <div class="history-app-icon">${iconHtml}</div>
                        <div class="history-app-meta">
                            <span class="history-app-name" title="${item.appName}">${item.appName}</span>
                            <span class="history-app-ver">${item.version}</span>
                        </div>
                    </div>
                </td>
                <td>${destBadge}</td>
                <td>${item.fileSize}</td>
                <td>${item.uploadDate}</td>
                <td class="actions-col">
                    <div class="action-buttons-cell">
                        <button class="btn btn-secondary btn-share-history" style="padding: 6px 12px; font-size: 11px;">Share</button>
                        <button class="btn btn-secondary btn-delete-history" style="padding: 6px 12px; font-size: 11px; color: var(--accent-pink);">Delete</button>
                    </div>
                </td>
            `;

            // Wire actions
            tr.querySelector('.btn-share-history').addEventListener('click', () => openQRModal(item));
            tr.querySelector('.btn-delete-history').addEventListener('click', () => {
                if (confirm(`Remove "${item.appName} (${item.version})" from local history?`)) {
                    state.history = state.history.filter(h => h.id !== item.id);
                    saveHistory();
                    renderHistory();
                }
            });

            el.historyListBody.appendChild(tr);
        });
    }

    // --- Modal Handler ---

    function openQRModal(item) {
        el.modalTitle.textContent = `Scan to Download ${item.appName}`;
        el.modalUrl.textContent = item.downloadUrl;
        el.qrModal.classList.add('active');

        // Draw Modal QR
        new QRious({
            element: el.modalQrCanvas,
            value: item.downloadUrl,
            size: 400,
            background: '#ffffff',
            foreground: '#08090f',
            level: 'H'
        });
    }

    // --- Utility Functions ---

    function capitalizeWords(str) {
        return str.replace(/\b\w/g, c => c.toUpperCase());
    }

    function copyToClipboard(text, buttonElement, originalText, successText) {
        navigator.clipboard.writeText(text).then(() => {
            buttonElement.textContent = successText;
            buttonElement.classList.add('btn-success');
            setTimeout(() => {
                buttonElement.textContent = originalText;
                buttonElement.classList.remove('btn-success');
            }, 2000);
        }).catch(err => {
            console.error('Could not copy text: ', err);
            alert('Failed to copy. URL: ' + text);
        });
    }
});
