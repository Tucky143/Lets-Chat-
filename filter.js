// List of inappropriate words with blocking settings.
// Note: Since substring matching is used, a word like "ass" (even if not blocked)
// may be detected in benign contexts (e.g., "grass" or "passionate").
// Consider using regex with word boundaries if exact matches are desired.
// Extreme inappropriate words with blocking settings
const INAPPROPRIATE_WORDS = [
    { word: "shit", block: true },
    { word: "ass", block: false },
    { word: "fuck", block: true },
    { word: "fucking", block: true },
    { word: "fucker", block: true },
    { word: "nigger", block: true },
    { word: "bitch", block: true },
    { word: "slut", block: true },
    { word: "whore", block: true },
    { word: "douche", block: true },
    { word: "skibity", block: true },
    { word: "skibidy", block: true },
    { word: "sigma", block: true },
    { word: "rizz", block: true },
    { word: "sh!t", block: true },
    { word: "$h!t", block: true },
    { word: "$hit", block: true },
    { word: "$igma", block: true },
    { word: "s!gma", block: true },
    { word: "$!gma", block: true },
    { word: "$!", block: true },
    { word: "s!", block: true },
    { word: "$i", block: true },
    { word: "🐵", block: true },
    { word: "🌈", block: true },
    { word: "🏳‍🌈", block: true },
    { word: "🐒", block: true }
  ];
  
  /**
   * Maps an array of emails to contact names.
   * Simulates fetching contact names by using the part before the "@".
   *
   * @param {Array<string>} emails - The list of email addresses.
   * @return {Object} A mapping of each email address to its corresponding contact name.
   */
  function getContactNames(emails) {
    const contactMap = {}; // To store email-to-name mappings
  
    emails.forEach(email => {
      try {
        // Simulate fetching the contact name (replace with actual API logic)
        const contactName = email.includes("@") ? `Name of ${email.split("@")[0]}` : "Unknown User";
        contactMap[email] = contactName;
      } catch (error) {
        contactMap[email] = "Unknown User"; // Fallback in case of error
      }
    });
  
    return contactMap;
  }
  
  /**
   * Retrieves the list of inappropriate words with their settings.
   *
   * @return {Array<Object>} Array of objects where each object contains:
   *   - word: The inappropriate word.
   *   - block: A boolean indicating whether the word should be completely blocked.
   */
  function getInappropriateWords() {
    return INAPPROPRIATE_WORDS;
  }
  
  /**
   * Checks if a given message contains any inappropriate words.
   *
   * This function uses simple substring matching, which can lead to false positives.
   * For example, searching for "ass" may match words such as "grass" or "passionate."
   * Adjust the matching logic (e.g., with regular expressions) if exact word boundaries are needed.
   *
   * In addition, the function distinguishes between words that should be completely blocked 
   * and those that are only flagged as warnings.
   *
   * @param {string} message - The message text to be checked.
   * @return {Object} An object containing:
   *   - containsBlocked {boolean}: True if any completely blocked word is found.
   *   - containsWarning {boolean}: True if any warning word is found.
   *   - blockedWords {Array<string>}: List of blocked words found in the message.
   *   - warningWords {Array<string>}: List of warning words found in the message.
   */
  function checkMessageForInappropriateContent(message) {
    if (!message) {
      return {
        containsBlocked: false,
        containsWarning: false,
        blockedWords: [],
        warningWords: []
      };
    }
  
    const lowerCaseMessage = message.toLowerCase();
    const blockedWords = [];
    const warningWords = [];
  
    // Loop through each inappropriate word and check if it's present in the text.
    INAPPROPRIATE_WORDS.forEach(entry => {
      if (lowerCaseMessage.includes(entry.word)) {
        if (entry.block) {
          blockedWords.push(entry.word);
        } else {
          warningWords.push(entry.word);
        }
      }
    });
  
    return {
      containsBlocked: blockedWords.length > 0,
      containsWarning: warningWords.length > 0,
      blockedWords: blockedWords,
      warningWords: warningWords
    };
  }