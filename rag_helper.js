const fs = require('fs');
const Fuse = require('fuse.js'); 

// Load business FAQ data
const loadFAQ = () => {
    const rawData = fs.readFileSync("business_data.json");
    return JSON.parse(rawData);
};

// Initialize Fuse.js for fuzzy search
const faqData = loadFAQ();
const fuse = new Fuse(faqData, {
    keys: ["instruction"],
    threshold: 0.4 // Adjust for stricter/looser matching
});

// Function to find the best match for user queries
const findBestAnswer = (userQuery) => {
    const result = fuse.search(userQuery);
    return result.length > 0 ? result[0].item.answer : null;
};

module.exports = { findBestAnswer };
