function apiSendMessage(chatUrl, message) {
    try {
      if (!chatUrl || !chatUrl.startsWith("https://")) {
        return { error: "Invalid chat URL." };
      }
      if (!message || message.trim() === "") {
        return { error: "Message cannot be empty." };
      }
  
      // Check the message for inappropriate content.
      var contentCheck = checkMessageForInappropriateContent(message);
      if (contentCheck.containsBlocked) {
        return { error: "Message blocked due to inappropriate content: " 
                 + contentCheck.blockedWords.join(", ") };
      }
      
      // (Optional) You might want to warn the sender if there are warning words.
      // if (contentCheck.containsWarning) { ... }
      var fileId = getChatIdFromUrl(chatUrl);
      var spreadsheet = SpreadsheetApp.openById(fileId);
      var sheet = spreadsheet.getActiveSheet();
      var timestamp = new Date();
      var email = Session.getActiveUser().getEmail();
      var username = getGlobalUserName(spreadsheet, email);
      updateUserRecord(spreadsheet, email, username);
          
      sheet.appendRow([timestamp, username, message, email]);
      return { success: true };
    } catch (error) {
      return { error: "Error sending message: " + error.message };
    }
  }
  
  function apiGetMessages(chatUrl) {
    try {
      if (!chatUrl || !chatUrl.startsWith("https://")) {
        return { error: "Invalid chat URL." };
      }
      var fileId = getChatIdFromUrl(chatUrl);
      var spreadsheet = SpreadsheetApp.openById(fileId);
      var sheet = spreadsheet.getActiveSheet();
      var data = sheet.getDataRange().getValues();
      if (data.length <= 1) {
        return { messages: [] };
      }
  
      // Example: assume headers are Timestamp, User, Message, Email.
      var messages = data.slice(1).map(function(row) {
        return {
          timestamp: formatTimestamp(row[0]),
          user: row[1] || "Unknown User",
          message: row[2] || "",
          email: row[3] || "",
        };
      });
  
      return { messages: messages };
    } catch (error) {
      return { error: "Error fetching messages: " + error.message };
    }
  }
  
  function formatTimestamp(date) {
    var d = (date instanceof Date) ? date : new Date(date);
    return Utilities.formatDate(d, Session.getScriptTimeZone(), "MMM d, yyyy 'at' h:mm a");
  }
  
  function apiDeleteMessage(chatUrl, rowNumber) {
    console.log("apiDeleteMessage called with chatUrl: " + chatUrl + " and rowNumber: " + rowNumber);
  
    var sheet = SpreadsheetApp.openByUrl(chatUrl); // Use the URL directly to open the sheet
    console.log("Spreadsheet opened successfully.");
    
    try {
      console.log("Attempting to delete row " + rowNumber + " from Messages sheet.");
      
      // Delete the row from the sheet (starting from row 2, assuming row 1 is the header)
      sheet.deleteRow(rowNumber);
      
      console.log("Message at row " + rowNumber + " deleted successfully.");
      return { success: "Message deleted successfully." };
    } catch (e) {
      console.log("Error deleting message: " + e.message);
      return { error: "Error deleting message: " + e.message };
    }
  }
  
  function apiEditMessage(chatUrl, rowNumber, newMessage) {
    try {
      if (!chatUrl || !chatUrl.startsWith("https://")) {
        return { error: "Invalid chat URL." };
      }
  
      var fileId = getChatIdFromUrl(chatUrl);
      var spreadsheet = SpreadsheetApp.openById(fileId);
      var sheet = spreadsheet.getActiveSheet();
  
      var lastRow = sheet.getLastRow();
      if (rowNumber < 2 || rowNumber > lastRow) {
        return { error: "Invalid row number." };
      }
  
      var currentMessage = sheet.getRange(rowNumber, 3).getValue(); // Column 3 holds the message
      if (!currentMessage) {
        return { error: "Message not found." };
      }
  
      // Automatically set newMessage to currentMessage if it wasn't provided
      newMessage = newMessage || currentMessage;
  
      // Update the message in the sheet
      sheet.getRange(rowNumber, 3).setValue(newMessage);
  
      return { success: "Message updated successfully." };
    } catch (error) {
      return { error: "Error editing message: " + error.message };
    }
  }
  
  function apiGetMessageContent(chatUrl, rowNumber) {
    try {
      if (!chatUrl || !chatUrl.startsWith("https://")) {
        return "Invalid chat URL.";
      }
  
      var fileId = getChatIdFromUrl(chatUrl);
      var spreadsheet = SpreadsheetApp.openById(fileId);
      var sheet = spreadsheet.getActiveSheet();
  
      var lastRow = sheet.getLastRow();
      if (rowNumber < 2 || rowNumber > lastRow) {
        return "Invalid row number.";
      }
  
      var messageCell = sheet.getRange(rowNumber, 3);
      var messageContent = messageCell.getDisplayValue(); // Retrieve formatted text
  
      if (!messageContent) {
        return "Message not found.";
      }
  
      return messageContent; // Directly return the message content instead of an object
    } catch (error) {
      return "Error retrieving message: " + error.message;
    }
  }