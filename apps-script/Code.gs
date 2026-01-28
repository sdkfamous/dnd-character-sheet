// D&D Character Sheet - Google Drive API Backend
// Deploy this as a Web App in Google Apps Script

// Enable Google Drive API in Apps Script Services first!
// Go to: Services → Add a service → Google Drive API → Add

/**
 * Handle POST requests (save, delete)
 */
function doPost(e) {
  try {
    const action = e.parameter.action;
    
    // Always use e.parameter for form-encoded data (which we're sending)
    // e.parameter contains the parsed key-value pairs from form data
    const postData = {
      fileName: e.parameter.fileName,
      fileId: e.parameter.fileId,
      content: e.parameter.content
    };
    
    switch(action) {
      case 'save':
        return saveFile(postData);
      case 'delete':
        return deleteFile(postData.fileId || e.parameter.fileId);
      default:
        return createErrorResponse('Unknown action: ' + action);
    }
  } catch (error) {
    return createErrorResponse(error.toString());
  }
}

/**
 * Handle GET requests (load, list)
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    
    switch(action) {
      case 'load':
        return loadFile(e.parameter.fileId);
      case 'list':
        return listFiles();
      default:
        return createErrorResponse('Unknown action: ' + action);
    }
  } catch (error) {
    return createErrorResponse(error.toString());
  }
}

/**
 * Save a file to Google Drive (create new or update existing)
 */
function saveFile(data) {
  try {
    const fileName = data.fileName || 'character-sheet.json';
    const fileContent = data.content;
    const fileId = data.fileId;
    
    if (!fileContent) {
      throw new Error('File content is required');
    }
    
    let file;
    
    if (fileId) {
      // Update existing file
      try {
        file = DriveApp.getFileById(fileId);
        file.setContent(fileContent);
        file.setName(fileName);
      } catch (error) {
        // File not found, create new one
        file = DriveApp.createFile(fileName, fileContent, 'application/json');
      }
    } else {
      // Create new file
      file = DriveApp.createFile(fileName, fileContent, 'application/json');
    }
    
    return createSuccessResponse({
      fileId: file.getId(),
      fileName: file.getName(),
      modifiedTime: file.getLastUpdated().toISOString()
    });
  } catch (error) {
    return createErrorResponse(error.toString());
  }
}

/**
 * Load a file from Google Drive
 */
function loadFile(fileId) {
  try {
    if (!fileId) {
      throw new Error('fileId is required');
    }
    
    const file = DriveApp.getFileById(fileId);
    const content = file.getBlob().getDataAsString();
    
    return createSuccessResponse({
      content: content,
      fileName: file.getName(),
      modifiedTime: file.getLastUpdated().toISOString(),
      createdTime: file.getDateCreated().toISOString()
    });
  } catch (error) {
    return createErrorResponse(error.toString());
  }
}

/**
 * List all character sheet files in Google Drive
 */
function listFiles() {
  try {
    // Search for JSON files with "character-sheet" in the name
    const searchQuery = 'title contains "character-sheet" and mimeType = "application/json" and trashed = false';
    const searchFiles = DriveApp.searchFiles(searchQuery);
    
    const fileList = [];
    
    while (searchFiles.hasNext()) {
      const file = searchFiles.next();
      fileList.push({
        id: file.getId(),
        name: file.getName(),
        modifiedTime: file.getLastUpdated().toISOString(),
        createdTime: file.getDateCreated().toISOString()
      });
    }
    
    // Sort by modified time (newest first)
    fileList.sort((a, b) => {
      return new Date(b.modifiedTime) - new Date(a.modifiedTime);
    });
    
    return createSuccessResponse({
      files: fileList
    });
  } catch (error) {
    return createErrorResponse(error.toString());
  }
}

/**
 * Delete a file from Google Drive (move to trash)
 */
function deleteFile(fileId) {
  try {
    if (!fileId) {
      throw new Error('fileId is required');
    }
    
    const file = DriveApp.getFileById(fileId);
    file.setTrashed(true);
    
    return createSuccessResponse({ message: 'File deleted successfully' });
  } catch (error) {
    return createErrorResponse(error.toString());
  }
}

/**
 * Create a success response
 */
function createSuccessResponse(data) {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    ...data
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Create an error response
 */
function createErrorResponse(errorMessage) {
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    error: errorMessage
  })).setMimeType(ContentService.MimeType.JSON);
}
