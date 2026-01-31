// Google Drive Manager - Direct API Integration with OAuth
export class GoogleDriveManager {
    constructor() {
        this.accessToken = null;
        this.CLIENT_ID = '924934734078-5qpia0pclmotj2dg2k628aejvbcfdbnl.apps.googleusercontent.com';
        this.SCOPES = 'https://www.googleapis.com/auth/drive.file';
        this.tokenClient = null;
        this.TOKEN_STORAGE_KEY = 'google_drive_access_token';
        this.EXPIRY_STORAGE_KEY = 'google_drive_token_expiry';
        this.refreshTimer = null;
        // Try to restore token from sessionStorage
        this.restoreToken();
        // Initialize Google Identity Services
        this.initializeGIS();
    }
    restoreToken() {
        const storedToken = sessionStorage.getItem(this.TOKEN_STORAGE_KEY);
        const storedExpiry = sessionStorage.getItem(this.EXPIRY_STORAGE_KEY);
        if (storedToken && storedExpiry) {
            const expiryTime = parseInt(storedExpiry);
            const now = Date.now();
            // Check if token is still valid (with 5 minute buffer)
            if (expiryTime > now + (5 * 60 * 1000)) {
                this.accessToken = storedToken;
                console.log('Restored access token from session');
                // Notify that we're signed in
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('google-signed-in'));
                }, 100);
                // Schedule token refresh
                this.scheduleTokenRefresh(expiryTime);
            }
            else {
                // Token expired, clear it
                sessionStorage.removeItem(this.TOKEN_STORAGE_KEY);
                sessionStorage.removeItem(this.EXPIRY_STORAGE_KEY);
            }
        }
    }
    scheduleTokenRefresh(expiryTime) {
        // Clear any existing timer
        if (this.refreshTimer) {
            window.clearTimeout(this.refreshTimer);
        }
        const now = Date.now();
        const timeUntilExpiry = expiryTime - now;
        // Refresh 5 minutes before expiry (or immediately if less than 5 min left)
        const refreshIn = Math.max(0, timeUntilExpiry - (5 * 60 * 1000));
        console.log(`Token refresh scheduled in ${Math.round(refreshIn / 1000 / 60)} minutes`);
        this.refreshTimer = window.setTimeout(() => {
            console.log('Auto-refreshing access token...');
            this.silentTokenRefresh();
        }, refreshIn);
    }
    silentTokenRefresh() {
        if (!this.tokenClient) {
            console.error('Cannot refresh token: tokenClient not initialized');
            return;
        }
        // Request new token silently (this will use existing Google session)
        try {
            this.tokenClient.requestAccessToken({ prompt: '' });
        }
        catch (error) {
            console.error('Silent token refresh failed:', error);
            // If silent refresh fails, user will need to sign in again manually
            window.dispatchEvent(new CustomEvent('google-session-expired'));
        }
    }
    initializeGIS() {
        // Wait for Google Identity Services library to load
        const checkGIS = setInterval(() => {
            if (window.google?.accounts?.oauth2) {
                clearInterval(checkGIS);
                this.tokenClient = window.google.accounts.oauth2.initTokenClient({
                    client_id: this.CLIENT_ID,
                    scope: this.SCOPES,
                    callback: (response) => {
                        if (response.access_token) {
                            this.accessToken = response.access_token;
                            // Store token and expiry in sessionStorage
                            sessionStorage.setItem(this.TOKEN_STORAGE_KEY, response.access_token);
                            // Token typically expires in 1 hour (3600 seconds)
                            const expiryTime = Date.now() + (response.expires_in || 3600) * 1000;
                            sessionStorage.setItem(this.EXPIRY_STORAGE_KEY, expiryTime.toString());
                            console.log('OAuth access token received, expires in ' + (response.expires_in || 3600) + ' seconds');
                            // Schedule automatic refresh before expiry
                            this.scheduleTokenRefresh(expiryTime);
                            // Dispatch custom event to notify app of sign-in
                            window.dispatchEvent(new CustomEvent('google-signed-in'));
                        }
                        else if (response.error) {
                            console.error('OAuth error:', response.error);
                            // Clear stored tokens on error
                            sessionStorage.removeItem(this.TOKEN_STORAGE_KEY);
                            sessionStorage.removeItem(this.EXPIRY_STORAGE_KEY);
                        }
                    },
                });
            }
        }, 100);
    }
    requestAccessToken() {
        return new Promise((resolve, reject) => {
            if (!this.tokenClient) {
                reject(new Error('Google Identity Services not initialized'));
                return;
            }
            // Set up one-time listener for sign-in success
            const handleSignIn = () => {
                window.removeEventListener('google-signed-in', handleSignIn);
                resolve();
            };
            window.addEventListener('google-signed-in', handleSignIn);
            // Request access token
            this.tokenClient.requestAccessToken();
        });
    }
    isSignedIn() {
        return this.accessToken !== null;
    }
    signOut() {
        // Clear refresh timer
        if (this.refreshTimer) {
            window.clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }
        if (this.accessToken) {
            // Revoke token
            window.google.accounts.oauth2.revoke(this.accessToken, () => {
                console.log('Access token revoked');
            });
            this.accessToken = null;
        }
        // Clear stored tokens
        sessionStorage.removeItem(this.TOKEN_STORAGE_KEY);
        sessionStorage.removeItem(this.EXPIRY_STORAGE_KEY);
        window.dispatchEvent(new CustomEvent('google-signed-out'));
    }
    async makeApiRequest(url, options = {}) {
        if (!this.accessToken) {
            throw new Error('Not signed in. Please sign in first.');
        }
        const headers = {
            'Authorization': `Bearer ${this.accessToken}`,
            ...options.headers
        };
        const response = await fetch(url, { ...options, headers });
        if (response.status === 401) {
            // Token expired, clear it
            this.accessToken = null;
            window.dispatchEvent(new CustomEvent('google-signed-out'));
            throw new Error('Session expired. Please sign in again.');
        }
        return response;
    }
    async saveToGoogleDrive(fileName, content, fileId) {
        try {
            const metadata = {
                name: fileName,
                mimeType: 'application/json'
            };
            const file = new Blob([content], { type: 'application/json' });
            const formData = new FormData();
            formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            formData.append('file', file);
            let url;
            let method;
            if (fileId) {
                // Update existing file
                url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`;
                method = 'PATCH';
            }
            else {
                // Create new file
                url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
                method = 'POST';
            }
            const response = await this.makeApiRequest(url, {
                method: method,
                body: formData
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to save file: ${response.status} ${errorText}`);
            }
            const result = await response.json();
            return { fileId: result.id };
        }
        catch (error) {
            console.error('Error in saveToGoogleDrive:', error);
            throw error;
        }
    }
    async loadFromGoogleDrive(fileId) {
        try {
            const response = await this.makeApiRequest(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`);
            if (!response.ok) {
                throw new Error(`Failed to load file: ${response.status}`);
            }
            const content = await response.text();
            return { content };
        }
        catch (error) {
            console.error('Error in loadFromGoogleDrive:', error);
            throw error;
        }
    }
    async listFiles() {
        try {
            // List files created by this app (drive.file scope only shows these)
            const query = "name contains 'character-sheet' or name contains '.json'";
            const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc`;
            const response = await this.makeApiRequest(url);
            if (!response.ok) {
                throw new Error(`Failed to list files: ${response.status}`);
            }
            const result = await response.json();
            return result.files || [];
        }
        catch (error) {
            console.error('Error in listFiles:', error);
            throw error;
        }
    }
    async deleteFile(fileId) {
        try {
            const response = await this.makeApiRequest(`https://www.googleapis.com/drive/v3/files/${fileId}`, { method: 'DELETE' });
            if (!response.ok && response.status !== 204) {
                throw new Error(`Failed to delete file: ${response.status}`);
            }
        }
        catch (error) {
            console.error('Error in deleteFile:', error);
            throw error;
        }
    }
    async uploadImage(file, fileName) {
        try {
            const metadata = {
                name: fileName,
                mimeType: file.type
            };
            const formData = new FormData();
            formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            formData.append('file', file);
            const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
            const response = await this.makeApiRequest(url, {
                method: 'POST',
                body: formData
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to upload image: ${response.status} ${errorText}`);
            }
            const result = await response.json();
            return { fileId: result.id };
        }
        catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    }
    async loadImage(fileId) {
        try {
            const response = await this.makeApiRequest(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`);
            if (!response.ok) {
                throw new Error(`Failed to load image: ${response.status}`);
            }
            return await response.blob();
        }
        catch (error) {
            console.error('Error loading image:', error);
            throw error;
        }
    }
}
//# sourceMappingURL=google-drive-manager.js.map