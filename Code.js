// File 1: Code.gs
function doGet(e) {
    var path = e.parameter.file; // Extract the file parameter from the URL
    if (path === 'settings.html') {
      return HtmlService.createHtmlOutputFromFile('settings'); // Serve the newTabContent.html file
    }
    return HtmlService.createHtmlOutputFromFile('chat'); // Serve the main HTML if no specific file requested
  }
  
  function getActiveUserEmail() {
    return Session.getActiveUser().getEmail();
  }
  
  function getUserName(email) {
    try {
      return email.split("@")[0];
    } catch (e) {
      return email;
    }
  }
  
  function updateUserRecord(spreadsheet, email, proposedName) {
    if (!email || email.trim() === "") {
      email = "Unknown User";
    }
    if (!proposedName || proposedName.trim() === "") {
      proposedName = getUserName(email);
    }
    
    var usersSheet = getOrCreateUsersSheet(spreadsheet);
    var data = usersSheet.getDataRange().getValues();
    var found = false;
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString().toLowerCase() === email.toLowerCase()) {
        // If the Global Name cell is empty, update it.
        if (!data[i][1] || data[i][1].toString().trim() === "") {
          usersSheet.getRange(i + 1, 2).setValue(proposedName);
        }
        found = true;
        break;
      }
    }
    
    if (!found) {
      // Append into a new row; default theme is set to "light".
      usersSheet.appendRow([email, proposedName, "light"]);
    }
  }
  
  function getGlobalUserName(spreadsheet, email) {
    var usersSheet = getOrCreateUsersSheet(spreadsheet);
    var data = usersSheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString().toLowerCase() === email.toLowerCase()) {
        if (data[i][1] && data[i][1].toString().trim() !== "") {
          return data[i][1].toString().trim();
        }
        break;
      }
    }
    return getUserName(email);
  }
  
  function apiSetUserTheme(chatUrl, theme) {
    try {
      if (theme !== "light" && theme !== "dark") {
        return { error: "Invalid theme." };
      }
      if (!chatUrl || !chatUrl.startsWith("https://")) {
        return { error: "Invalid chat URL." };
      }
      var fileId = getChatIdFromUrl(chatUrl);
      var spreadsheet = SpreadsheetApp.openById(fileId);
      var usersSheet = getOrCreateUsersSheet(spreadsheet);
      var email = Session.getActiveUser().getEmail();
      var data = usersSheet.getDataRange().getValues();
      
      for (var i = 1; i < data.length; i++) {
        if (data[i][0].toString().toLowerCase() === email.toLowerCase()) {
          usersSheet.getRange(i + 1, 3).setValue(theme);
          return { success: true };
        }
      }
      
      usersSheet.appendRow([email, getUserName(email), theme]);
      return { success: true };
    } catch (error) {
      return { error: "Error setting user theme: " + error.message };
    }
  }
  
  function enableNotifications(chatId) {
    try {
      // Open the spreadsheet using the chatId as the fileId
      var chatSpreadsheet = SpreadsheetApp.openById(chatId);
      
      // Retrieve the Users sheet from the main spreadsheet
      var usersSheet = chatSpreadsheet.getSheetByName('Users');
      
      if (!usersSheet) {
        Logger.log('Users sheet not found in chat spreadsheet with chatId: ' + chatId);
        return;
      }
  
      // Get all the data from the Users sheet
      var data = usersSheet.getDataRange().getValues();
      
      // Check if the 'notificationStatus' column exists
      var headerRow = data[0]; // The first row is the header
      var notificationStatusColIndex = headerRow.indexOf('notificationStatus');
      
      // If the 'notificationStatus' column does not exist, create it
      if (notificationStatusColIndex === -1) {
        notificationStatusColIndex = headerRow.length; // Add it at the end
        usersSheet.getRange(1, notificationStatusColIndex + 1).setValue('notificationStatus'); // Set header
      }
  
      // Get the current user's email
      var currentUserEmail = Session.getActiveUser().getEmail();
      
      // Find the row corresponding to the current user (based on email)
      var userRowIndex = -1;
      for (var i = 1; i < data.length; i++) { // Start from row 1 (skip header)
        if (data[i][0] === currentUserEmail) { // Assuming the email is in the first column
          userRowIndex = i + 1; // Spreadsheet is 1-indexed
          break;
        }
      }
      
      // If the user doesn't exist in the sheet, log an error
      if (userRowIndex === -1) {
        Logger.log('User not found in the Users sheet');
        return;
      }
      
      // Set the 'notificationStatus' for the current user to true (in the row corresponding to the user's email)
      usersSheet.getRange(userRowIndex, notificationStatusColIndex + 1).setValue(true);
      
      Logger.log('Notifications enabled for user ' + currentUserEmail + ' in chat ' + chatId);
    } catch (e) {
      Logger.log('Error enabling notifications for chat ' + chatId + ': ' + e.message);
    }
  }
  
  function disableNotifications(chatId) {
    try {
      // Open the spreadsheet using the chatId as the fileId
      var chatSpreadsheet = SpreadsheetApp.openById(chatId);
      
      // Retrieve the Users sheet from the main spreadsheet
      var usersSheet = chatSpreadsheet.getSheetByName('Users');
      
      if (!usersSheet) {
        Logger.log('Users sheet not found in chat spreadsheet with chatId: ' + chatId);
        return;
      }
  
      // Get all the data from the Users sheet
      var data = usersSheet.getDataRange().getValues();
      
      // Check if the 'notificationStatus' column exists
      var headerRow = data[0]; // The first row is the header
      var notificationStatusColIndex = headerRow.indexOf('notificationStatus');
      
      // If the 'notificationStatus' column doesn't exist, return early
      if (notificationStatusColIndex === -1) {
        Logger.log('No notificationStatus column found');
        return;
      }
  
      // Get the current user's email
      var currentUserEmail = Session.getActiveUser().getEmail();
      
      // Find the row corresponding to the current user (based on email)
      var userRowIndex = -1;
      for (var i = 1; i < data.length; i++) { // Start from row 1 (skip header)
        if (data[i][0] === currentUserEmail) { // Assuming the email is in the first column
          userRowIndex = i + 1; // Spreadsheet is 1-indexed
          break;
        }
      }
      
      // If the user doesn't exist in the sheet, log an error
      if (userRowIndex === -1) {
        Logger.log('User not found in the Users sheet');
        return;
      }
      
      // Set the 'notificationStatus' for the current user to false (in the row corresponding to the user's email)
      usersSheet.getRange(userRowIndex, notificationStatusColIndex + 1).setValue(false);
      
      Logger.log('Notifications disabled for user ' + currentUserEmail + ' in chat ' + chatId);
    } catch (e) {
      Logger.log('Error disabling notifications for chat ' + chatId + ': ' + e.message);
    }
  }
  
  function getNotificationStatus(chatId) {
    try {
      var usersSheet = SpreadsheetApp.openById(chatId).getSheetByName('Users');
      if (!usersSheet) return false;
  
      var data = usersSheet.getDataRange().getValues();
      var notificationStatusColIndex = data[0].indexOf('notificationStatus');
      if (notificationStatusColIndex === -1) return false;
  
      var currentUserEmail = Session.getActiveUser().getEmail();
      var userRow = data.find(row => row[0] === currentUserEmail);
      
      return userRow ? userRow[notificationStatusColIndex] : false;
    } catch (e) {
      Logger.log('Error getting notification status: ' + e.message);
      return false;
    }
  }
  
  function logNotificationStatuses(chatId) {
    try {
      var usersSheet = SpreadsheetApp.openById(chatId).getSheetByName('Users');
      if (!usersSheet) return Logger.log('Users sheet not found.');
  
      var data = usersSheet.getDataRange().getValues();
      var notificationStatusColIndex = data[0].indexOf('notificationStatus');
      if (notificationStatusColIndex === -1) return Logger.log('Notification status column not found.');
  
      data.slice(1).forEach(row => Logger.log(`User: ${row[0]} | Notifications Enabled: ${row[notificationStatusColIndex]}`));
    } catch (e) {
      Logger.log('Error logging notification statuses: ' + e.message);
    }
  }
  
  function sendTestEmail() {
    GmailApp.sendEmail("100064285@apps.ogdensd.org", "Test Subject", "This is a test message.", {
            from: '100064285+no-reply@apps.ogdensd.org', // Custom email address
    });
  }
  
  function sendEmailNotification(chatUrl, message) {
    try {
      var fileId = getChatIdFromUrl(chatUrl);
      var spreadsheet = SpreadsheetApp.openById(fileId);
      var subject = "New Message in Chat: " + spreadsheet.getName();
      var senderEmail = Session.getActiveUser().getEmail();
      var chatName = spreadsheet.getName();
  
      applyLabelToEmail(chatName, senderEmail, subject);
      
      var users = getUsersWithNotificationsEnabled(fileId).filter(user => user.email !== senderEmail);
      
      if (users.length === 0) {
        Logger.log("No users found to send emails.");
        return "No recipients.";
      }
  
      users.forEach(user => {
        try {
          var emailData = searchEmailByLabel("Chat-" + chatName, senderEmail, subject);
          
          if (!emailData) {
            Logger.log(`No email found with label: Chat-${chatName}. Sending new email.`);
            
            MailApp.sendEmail({
              to: user.email,
              subject: subject,
              body: "You have a new chat message: \n\n" + message,
              name: "Lets Chat!"
            });
  
            applyLabelToEmail(chatName, senderEmail, subject); // Ensure label is applied
          } else {
            var rawReply = createRawReplyMessage(senderEmail, user.email, subject, message, emailData.threadId, emailData.messageId);
            Gmail.Users.Messages.send({ raw: rawReply, threadId: emailData.threadId }, "me");
          }
        } catch (emailError) {
          Logger.log(`Failed to send email to ${user.email}: ${emailError.message}`);
        }
      });
  
      return "Emails sent.";
    } catch (e) {
      Logger.log("Error sending email: " + e.message);
      throw new Error(`Failed to send email: ${e.message}`);
    }
  }
  
  function createRawReplyMessage(from, to, subject, body, threadId, messageId) {
    return Utilities.base64EncodeWebSafe(
      `From: ${from}\r\n` +
      `To: ${to}\r\n` +
      `Subject: ${subject}\r\n` +
      `MIME-Version: 1.0\r\n` +
      `Content-Type: text/plain; charset=UTF-8\r\n` +
      `In-Reply-To: <${messageId}>\r\n` +
      `References: <${messageId}>\r\n\r\n` +
      `${body}`
    );
  }
  
  function getUsersWithNotificationsEnabled(chatId) {
    try {
      var data = SpreadsheetApp.openById(chatId).getSheetByName("Users")?.getDataRange().getValues() || [];
      return data.slice(1).map((row, i) => row[3] ? { row: i + 2, email: row[0], threadId: row[4]?.toString() || "" } : null).filter(Boolean);
    } catch (error) {
      Logger.log("Error in getUsersWithNotificationsEnabled: " + error.message);
      return [];
    }
  }
  
  function updateUserThreadId(chatId, row, threadId) {
    try {
      var sheet = SpreadsheetApp.openById(chatId).getSheetByName("Users");
      sheet.getRange(row, 5).setValue(threadId);
    } catch (e) {
      Logger.log("Failed to update thread ID in row " + row + ": " + e.message);
    }
  }
  
  function updateUserThreadIdAndMessageId(chatId, rowNumber, threadId, messageId) {
    var sheet = SpreadsheetApp.openById(chatId).getSheetByName("Users");
    sheet.getRange(rowNumber, 5).setValue(threadId); // Assuming column 5 is threadId
    sheet.getRange(rowNumber, 6).setValue(messageId); // Assuming column 6 is messageId
  }
  
  function applyLabelToEmail(chatName, senderEmail, subject) {
    var labelName = "Chat-" + chatName;
    var label = GmailApp.getUserLabelByName(labelName) || GmailApp.createLabel(labelName);
    var query = `subject:"${subject}" from:${senderEmail}`;
    var threads = GmailApp.search(query, 0, 1);
  
    if (threads && threads.length > 0) {
      threads[0]?.addLabel(label); // Apply the label to the thread
      Logger.log(`Label applied: ${labelName}`);
    }
  }
  
  function searchEmailByLabel(labelName, senderEmail, subject) {
    var query = `label:"${labelName}" subject:"${subject}" from:${senderEmail}`;
    var threads = GmailApp.search(query, 0, 1);
  
    if (threads && threads.length > 0) {
      var message = threads[0].getMessages()[0]; // Retrieve the first message
      return {
        threadId: threads[0].getId(),
        messageId: message.getId() // Retrieve the specific message ID
      };
    } else {
      Logger.log(`No email found with label: ${labelName}`);
      return null;
    }
  }