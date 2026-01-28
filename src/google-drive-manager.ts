// Google Drive Manager - Frontend client for Google Apps Script backend

export interface DriveFile {
    id: string;
    name: string;
    modifiedTime: string;
    createdTime?: string;
}

export interface SaveFileResponse {
    fileId: string;
    fileName: string;
    modifiedTime: string;
}

export interface LoadFileResponse {
    content: string;
    fileName: string;
    modifiedTime: string;
    createdTime?: string;
}

export interface ListFilesResponse {
    files: DriveFile[];
}

export class GoogleDriveManager {
    private webAppUrl: string;

    constructor(webAppUrl: string) {
        if (!webAppUrl) {
            throw new Error('Apps Script Web App URL is required');
        }
        this.webAppUrl = webAppUrl;
    }

    /**
     * Save a file to Google Drive (create new or update existing)
     */
    async saveToGoogleDrive(
        fileName: string,
        data: string,
        fileId?: string
    ): Promise<SaveFileResponse> {
        try {
            // Use URL-encoded form data to avoid CORS preflight issues
            const formData = new URLSearchParams();
            formData.append('action', 'save');
            formData.append('fileName', fileName);
            formData.append('fileId', fileId || '');
            formData.append('content', data);

            const response = await fetch(this.webAppUrl, {
                method: 'POST',
                redirect: 'follow', // Follow redirects (Apps Script redirects POST requests)
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString()
            });

            const responseText = await response.text();

            if (!responseText || responseText.trim().length === 0) {
                throw new Error('Apps Script returned empty response');
            }

            // Extract JSON from response
            let jsonText = responseText;
            const jsonStart = responseText.indexOf('{');
            const jsonEnd = responseText.lastIndexOf('}');

            if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
                jsonText = responseText.substring(jsonStart, jsonEnd + 1);
            }

            const result = JSON.parse(jsonText);

            if (!result.success) {
                throw new Error(result.error || 'Failed to save file');
            }

            return {
                fileId: result.fileId,
                fileName: result.fileName,
                modifiedTime: result.modifiedTime
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to save to Google Drive: ${error.message}`);
            }
            throw new Error('Failed to save to Google Drive: Unknown error');
        }
    }

    /**
     * Load a file from Google Drive
     */
    async loadFromGoogleDrive(fileId: string): Promise<LoadFileResponse> {
        try {
            if (!fileId) {
                throw new Error('fileId is required');
            }

            const url = `${this.webAppUrl}?action=load&fileId=${encodeURIComponent(fileId)}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to load file');
            }

            return {
                content: result.content,
                fileName: result.fileName,
                modifiedTime: result.modifiedTime,
                createdTime: result.createdTime
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to load from Google Drive: ${error.message}`);
            }
            throw new Error('Failed to load from Google Drive: Unknown error');
        }
    }

    /**
     * List all character sheet files in Google Drive
     */
    async listFiles(): Promise<DriveFile[]> {
        try {
            const url = `${this.webAppUrl}?action=list`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to list files');
            }

            return result.files || [];
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to list files: ${error.message}`);
            }
            throw new Error('Failed to list files: Unknown error');
        }
    }

    /**
     * Delete a file from Google Drive
     */
    async deleteFile(fileId: string): Promise<void> {
        try {
            if (!fileId) {
                throw new Error('fileId is required');
            }

            // Use URL-encoded form data to avoid CORS preflight issues
            const formData = new URLSearchParams();
            formData.append('action', 'delete');
            formData.append('fileId', fileId);

            const response = await fetch(this.webAppUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Get response as text first to debug
            const responseText = await response.text();
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Failed to parse response:', responseText);
                throw new Error(`Invalid JSON response from server: ${responseText.substring(0, 100)}`);
            }

            if (!result.success) {
                throw new Error(result.error || 'Failed to delete file');
            }
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to delete file: ${error.message}`);
            }
            throw new Error('Failed to delete file: Unknown error');
        }
    }
}
