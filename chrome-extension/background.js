// Background script
// Placeholder for potential background tasks like checking auth status periodically
// or handling alarms.

console.log("JobDance Extension Background Service Worker Running");

// Example: Listen for installation
chrome.runtime.onInstalled.addListener(() => {
    console.log("JobDance Extension Installed");
});
