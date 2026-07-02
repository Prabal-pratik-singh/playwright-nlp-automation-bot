# 🤖 Playwright NLP Automation Bot

An advanced, fully autonomous web automation script built with Node.js and Playwright. This bot dynamically navigates web interfaces, intercepts background API network traffic to extract data, and uses a custom Natural Language Processing (NLP) algorithm to make intelligent UI selections when standard HTML tags are hidden or obfuscated.

## ✨ Key Features
* **Background API Interception:** Silently listens to network traffic to build a real-time data mapping of questions and answers.
* **Tag-Agnostic Scraping:** Uses JavaScript injection to scrape visible on-screen text, bypassing custom CSS classes or hidden HTML tags.
* **Advanced NLP Keyword Scoring:** Uses root-word stemming, n-gram matching, and stop-word filtering to cross-reference screen text with intercepted JSON data to find the highest probability match.
* **Autonomous State Machine:** Detects frozen UI states and dynamically performs fallback actions to unfreeze navigation loops without crashing.

## 💻 Hardware Requirements
* **RAM:** 4GB Minimum (8GB Recommended for Chromium automation)
* **OS:** Windows 10/11, macOS, or Linux
* **Software:** [Node.js](https://nodejs.org/) (LTS Version)

## 🚀 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/Prabal-pratik-singh/playwright-nlp-automation-bot.git](https://github.com/Prabal-pratik-singh/playwright-nlp-automation-bot.git)
   cd playwright-nlp-automation-bot


 2.  **Install dependencies:**

       ```bash
       npm install dotenv playwright


 3.   **Install the Playwright Browsers (Crucial Step):**

      ```bash
      npx playwright install chromium

 4.   **Configure your credentials:**
      Create a .env file in the root directory and add your account details. (Note: We use LOGIN_EMAIL instead of USERNAME to prevent conflicts with Windows system environment variables).

      copy paste this im .env
      ```
      LOGIN_EMAIL=your_email@domain.com
      PASSWORD=your_password

5. **in last run this in your device terminal** 
      ```
      node index.js

The bot will launch a Chromium browser, log in, and wait for your manual input to select a starting section. Once the section URL is locked in, it takes over completely.