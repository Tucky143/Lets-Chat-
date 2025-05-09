function getHtmlFileUrl() {
    var url = ScriptApp.getService().getUrl(); // Get the base URL of the current Apps Script web app
    var htmlFileName = 'settings.html'; // Name of the HTML file you want to open
  
    // Append a cache-busting query parameter to avoid caching
    var cacheBuster = new Date().getTime();
    var fileUrl = url + '?file=' + htmlFileName + '&timestamp=' + cacheBuster;
  
    return fileUrl; // Return the URL that can be opened in a new tab
  }
  
  function getOrCreateUsersSheet(spreadsheet) {
    var sheetName = "Users";
    var usersSheet = spreadsheet.getSheetByName(sheetName);
    if (!usersSheet) {
      usersSheet = spreadsheet.insertSheet(sheetName);
      usersSheet.getRange(1, 1, 1, 3).setValues([["Email", "Global Name", "Theme"]]);
      usersSheet.setColumnWidths(1, 3, 150);
    }
    return usersSheet;
  }
  
  function setActiveChatSheet(spreadsheet) {
    var sheets = spreadsheet.getSheets();
    for (var i = 0; i < sheets.length; i++) {
      var name = sheets[i]?.getName().toLowerCase();
      if (name !== "users" && name !== "online") {
        spreadsheet.setActiveSheet(sheets[i]);
        break;
      }
    }
  }
  
  function apiCreateChat(chatName) {
    try {
      if (!chatName || chatName.trim() === "") {
        return { error: "Chat name cannot be empty." };
      }
      // Create a new spreadsheet; the default sheet is used for messages.
      var spreadsheet = SpreadsheetApp.create(chatName);
      var messageSheet = spreadsheet.getActiveSheet();
      messageSheet.appendRow(["Timestamp", "User", "Message", "Email"]);
      
      // Create the "Users" sheet.
      getOrCreateUsersSheet(spreadsheet);
      // Create the "Online" sheet.
      getOrCreateOnlineSheet(spreadsheet);
      
      setActiveChatSheet(spreadsheet);
      
      var email = Session.getActiveUser().getEmail();
      var username = getUserName(email);
      updateUserRecord(spreadsheet, email, username);
      
      // Organize the file into a folder named "Chat Folder".
      var folders = DriveApp.getFoldersByName("Chat Folder");
      var chatFolder = folders.hasNext() ? folders.next() : DriveApp.createFolder("Chat Folder");
      var file = DriveApp.getFileById(spreadsheet.getId());
      chatFolder.addFile(file);
      DriveApp.getRootFolder().removeFile(file);
      
      return { chatName: chatName, chatUrl: spreadsheet.getUrl() };
    } catch (error) {
      return { error: "Error creating chat: " + error.message };
    }
  }
  
  function getOrCreateOnlineSheet(spreadsheet) {
    var sheetName = "Online";
    var onlineSheet = spreadsheet.getSheetByName(sheetName);
    if (!onlineSheet) {
      onlineSheet = spreadsheet.insertSheet(sheetName);
      onlineSheet.getRange(1, 1, 1, 2).setValues([["Email", "Last Active"]]);
      onlineSheet.setColumnWidths(1, 2, 150);
    }
    return onlineSheet;
  }
  
  function apiSetOnlineStatus(chatUrl, isOnline) {
    try {
      if (!chatUrl || !chatUrl.startsWith("https://")) {
        return { error: "Invalid chat URL." };
      }
      var fileId = getChatIdFromUrl(chatUrl);
      var spreadsheet = SpreadsheetApp.openById(fileId);
      var onlineSheet = getOrCreateOnlineSheet(spreadsheet);
      var email = Session.getActiveUser().getEmail();
      var data = onlineSheet.getDataRange().getValues();
      var found = false;
      
      for (var i = 1; i < data.length; i++) {
        if (data[i][0].toString().toLowerCase() === email.toLowerCase()) {
          if (isOnline) {
            onlineSheet.getRange(i + 1, 2).setValue(new Date());
          } else {
            onlineSheet.getRange(i + 1, 2).setValue("");
          }
          found = true;
          break;
        }
      }
      
      if (!found && isOnline) {
        onlineSheet.appendRow([email, new Date()]);
      }
      
      return { success: true };
    } catch (error) {
      return { error: "Error setting online status: " + error.message };
    }
  }
  
  function apiGetOnlineUsers(chatUrl) {
    try {
      if (!chatUrl || !chatUrl.startsWith("https://")) {
        return { error: "Invalid chat URL." };
      }
      var fileId = getChatIdFromUrl(chatUrl);
      var spreadsheet = SpreadsheetApp.openById(fileId);
      var onlineSheet = getOrCreateOnlineSheet(spreadsheet);
      var data = onlineSheet.getDataRange().getValues();
      var currentTime = new Date().getTime();
      var activeUsers = [];
      
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] && data[i][1]) {
          var lastActive = new Date(data[i][1]).getTime();
          if ((currentTime - lastActive) < 10 * 60 * 1000) { // 10 minutes
            activeUsers.push(data[i][0]);
          }
        }
      }
      
      return { online: activeUsers };
    } catch (error) {
      return { error: "Error fetching online users: " + error.message };
    }
  }
  
  function apiGetUserTheme(chatUrl) {
    try {
      if (!chatUrl || !chatUrl.startsWith("https://")) {
        return { error: "Invalid chat URL." };
      }
      var fileId = getChatIdFromUrl(chatUrl);
      var spreadsheet = SpreadsheetApp.openById(fileId);
      var usersSheet = getOrCreateUsersSheet(spreadsheet);
      var email = Session.getActiveUser().getEmail();
      var data = usersSheet.getDataRange().getValues();
      
      for (var i = 1; i < data.length; i++) {
        if (data[i][0]?.toString().toLowerCase() === email.toLowerCase()) {
          if (data[i][2] && data[i][2].toString().trim() !== "") {
            return { theme: data[i][2].toString().trim() };
          }
          break;
        }
      }
      
      return { theme: "light" };
    } catch (error) {
      return { error: "Error fetching user theme: " + error.message };
    }
  }
  
  function saveRecentChats(recentChats) {
    // Store recentChats in ScriptProperties
    var scriptProperties = PropertiesService.getScriptProperties();
    scriptProperties.setProperty('recentChats', recentChats);
    Logger.log('Recent chats saved: ' + recentChats);
  }
  
  function getRecentChats() {
    var scriptProperties = PropertiesService.getScriptProperties();
    var recentChats = scriptProperties.getProperty('recentChats');
    
    // Log the value to debug
    Logger.log('Recent chats retrieved: ' + recentChats);
    
    // Check if the retrieved value is not null or undefined and parse it if it's a valid JSON string
    if (recentChats) {
      try {
        return JSON.parse(recentChats);  // Convert the string back to an array
      } catch (e) {
        Logger.log('Error parsing recentChats: ' + e);
        return [];  // Return an empty array in case of an error
      }
    }
    
    return [];  // Return an empty array if no recent chats exist
  }
  
  function getChatIdFromUrl(url) {
    try {
      // Ensure the URL is valid and contains a file ID
      if (!url || typeof url !== "string" || !url.includes("/d/")) {
        throw new Error("Invalid URL format. Make sure it contains '/d/'.");
      }
  
      // Extract the file ID between "/d/" and the next "/"
      var match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (!match || match.length < 2) {
        throw new Error("File ID not found in the URL.");
      }
  
      return match[1]; // Return the extracted file ID
    } catch (error) {
      Logger.log("Error extracting chatId: " + error.message);
      return null; // Return null if invalid
    }
  }