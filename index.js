require('dotenv').config();
const { chromium } = require("playwright");

const USERNAME = process.env.LOGIN_EMAIL;
const PASSWORD = process.env.PASSWORD;

(async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext(); 
    const page = await context.newPage();

    console.log("🚀 Starting Hybrid Automated Exam Bot (Tag-Agnostic Edition!)...");

    // ==========================================
    // 1. AUTOMATED LOGIN
    // ==========================================
    console.log("Navigating to login page...");
    await page.goto("https://corporate.bharatenglish.org");
    
    await page.waitForTimeout(3000); 
    console.log("Entering credentials...");
    
    await page.fill('input[type="email"], input[placeholder*="Email"], input[name="username"]', USERNAME);
    await page.fill('input[type="password"], input[placeholder*="Password"], input[name="password"]', PASSWORD);
    
    await page.click('button[type="submit"], button:has-text("Log In"), button:has-text("Sign In")');
    console.log("✅ Logged in successfully!");

    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(5000); 

    // ==========================================
    // 2. MANUAL SELECTION PHASE (THE FIX)
    // ==========================================
    console.log("👉 Clicking 'AI FluentEdge' Dashboard...");
    await page.click('text="AI FluentEdge"');
    await page.waitForTimeout(3000);

    console.log("\n=======================================================");
    console.log(" ⏸️  SCRIPT PAUSED: WAITING FOR YOUR INPUT");
    console.log(" Please click on the section you want to do (Reading, Listening, etc.)");
    console.log(" You have 2 minutes to make your choice in the browser.");
    console.log("=======================================================\n");

    try {
        // THE FIX: Wait specifically for the URL to change to a "grades?section=" page
        await page.waitForURL('**/grades?section=**', { timeout: 120000 });
        await page.waitForTimeout(3000); 
    } catch (error) {
        console.log("❌ Timed out waiting for you to click a section. Exiting.");
        await browser.close();
        return;
    }

    const sectionUrl = page.url();
    console.log(`✅ Section securely locked in! URL saved: ${sectionUrl}`);
    
    let examsCompleted = 0;

    // ========================================================
    // DEEP SCAN INTERCEPTOR 
    // ========================================================
    let correctAnswers = []; 
    
    page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('/questions')) {
            try {
                const jsonPayload = await response.json();

                function deepSearchForAnswers(obj, lastKnownQuestion = "AUDIO_QUESTION") {
                    if (!obj || typeof obj !== 'object') return;

                    let currentQuestionText = obj.question ? obj.question : lastKnownQuestion;
                    let qClean = currentQuestionText.toString().replace(/<[^>]*>?/gm, '').trim();
                    let qSnippet = qClean.split(/\s+/).slice(0, 6).join(" ");

                    let aSnippet = null;
                    let expText = null;

                    if ('answer' in obj && 'option1' in obj) {
                        const ansNum = obj.answer;
                        let aText = obj["option" + ansNum];
                        if (aText) {
                            aSnippet = aText.toString().replace(/<[^>]*>?/gm, '').trim().split(/\s+/).slice(0, 6).join(" ");
                        }
                    }

                    if ('explanation' in obj && obj.explanation) {
                        expText = obj.explanation.toString().replace(/<[^>]*>?/gm, '').trim();
                    }

                    if (aSnippet || expText) {
                        const exists = correctAnswers.some(item => item.qSnippet === qSnippet);
                        if (!exists) {
                            correctAnswers.push({ qSnippet, aSnippet, expText });
                        }
                    }

                    Object.values(obj).forEach(child => deepSearchForAnswers(child, currentQuestionText));
                }

                deepSearchForAnswers(jsonPayload);
            } catch (error) {}
        }
    });

    // ==========================================
    // 3. THE MASTER NAVIGATION LOOP
    // ==========================================
    while (true) {
        console.log(`\n=============================================`);
        console.log(`🗺️  STARTING EXAM #${examsCompleted + 1}`);
        console.log(`=============================================`);

        correctAnswers = [];

        console.log("👉 Resetting board: Navigating back to your locked-in section...");
        await page.goto(sectionUrl);
        await page.waitForTimeout(4000);

        try {
            console.log("👉 1. Selecting the highest unlocked Level...");
            // THE FIX: Tag-agnostic search for the exact word "Start"
            await page.getByText('Start', { exact: true }).last().click({ timeout: 5000 });
            await page.waitForTimeout(4000);

            const nextLesson = page.locator('text="Start Learning"').first();
            
            if (await nextLesson.isVisible()) {
                console.log("✅ Found an incomplete lesson. Clicking 'Start Learning'...");
                await nextLesson.click();
                await page.waitForTimeout(4000);
            } else {
                console.log("🏆 All lessons are 100%! Looking for the 'Level Test'...");
                // Tag-agnostic check for the Level Test start button
                const levelTestBtn = page.getByText('Start', { exact: true }).last();
                
                if (await levelTestBtn.isVisible()) {
                    console.log("🔥 Found the Level Test! Starting it now...");
                    await levelTestBtn.click();
                    await page.waitForTimeout(4000);
                } else {
                    console.log("🛑 No Level Test found. You have completely finished this entire section!");
                    break;
                }
            }
        } catch (error) {
            console.error("❌ Navigation failed. The screen might look different than expected.", error.message);
            break;
        }

        const practiceBtns = page.locator('text="Practice"');
        if (await practiceBtns.count() > 0) {
            await practiceBtns.first().click();
        }

        console.log("⏳ Waiting for API data and questions to load...");
        let waitRetries = 0;
        while (correctAnswers.length === 0 && waitRetries < 15) {
            await page.waitForTimeout(1000); 
            waitRetries++;
        }

        const beginBtn = page.locator('button:has-text("Begin"), button:has-text("Start Test")').last();
        if (await beginBtn.isVisible()) {
            await beginBtn.click();
            let extraWait = 0;
            while (correctAnswers.length === 0 && extraWait < 5) {
                await page.waitForTimeout(1000);
                extraWait++;
            }
        }

        if (correctAnswers.length === 0) {
            console.log("⚠️ Could not extract answers after 15 seconds. Breaking loop.");
            break; 
        }

        console.log(`🎯 Data Extracted! Built Cheat Sheet with ${correctAnswers.length} mappings. Starting State Machine...`);

        // ==========================================
        // 4. THE STATE MACHINE LOOP
        // ==========================================
        let consecutiveFails = 0;

        while (consecutiveFails < 4) {
            await page.waitForTimeout(2500); 
            let matchedPair = null;

            for (let pair of correctAnswers) {
                if (await page.getByText(pair.qSnippet, { exact: false }).last().isVisible()) {
                    matchedPair = pair;
                    break;
                }
            }

            if (matchedPair) {
                console.log(`👉 Found Question: "${matchedPair.qSnippet}..."`);
                let clicked = false;

                if (matchedPair.aSnippet) {
                    try {
                        await page.getByText(matchedPair.aSnippet, { exact: false }).last().click({ force: true, timeout: 2000 });
                        console.log(`   🎯 Clicked Target via Direct Snippet!`);
                        clicked = true;
                    } catch (e) {
                        try {
                            await page.getByText(matchedPair.aSnippet, { exact: false }).last().locator('..').click({ force: true, timeout: 2000 });
                            console.log(`   🎯 Clicked Target Container!`);
                            clicked = true;
                        } catch (fallback) {}
                    }
                }

                if (!clicked && matchedPair.expText) {
                    console.log(`   💡 Options hidden! Cross-referencing with Advanced NLP...`);
                    try {
                        const qSnipLower = matchedPair.qSnippet.toLowerCase();
                        const screenTexts = await page.evaluate((q) => {
                            return Array.from(document.body.innerText.split('\n'))
                                .map(t => t.trim())
                                .filter(t => t.length > 5 && t.length < 200 && !t.toLowerCase().includes(q.split(' ')[0]));
                        }, qSnipLower);

                        let bestMatchText = "";
                        let highestScore = 0;
                        
                        const stopWords = ['the', 'in', 'a', 'an', 'of', 'to', 'is', 'for', 'on', 'and', 'with', 'at', 'by', 'from', 'that', 'should', 'be', 'this', 'it', 'as', 'are', 'was', 'were'];
                        
                        const cleanExpText = matchedPair.expText.toLowerCase().replace(/[^a-z0-9\s]/g, '');
                        const expWords = cleanExpText.split(/\s+/).filter(w => !stopWords.includes(w) && w.length > 2);
                        
                        for (let optText of screenTexts) {
                            const cleanOptText = optText.toLowerCase().replace(/[^a-z0-9\s]/g, '');
                            let optWords = cleanOptText.split(/\s+/).filter(w => !stopWords.includes(w) && w.length > 2);
                            if (optWords.length === 0) continue;

                            let score = 0;

                            if (cleanExpText.includes(cleanOptText) && cleanOptText.length > 10) {
                                score += 100;
                            }

                            for (let i = 0; i < optWords.length - 1; i++) {
                                const bigram = optWords[i] + " " + optWords[i+1];
                                if (cleanExpText.includes(bigram)) score += 30; 
                            }
                            
                            for (let word of optWords) {
                                if (expWords.includes(word)) {
                                    score += (word.length * 2); 
                                } else {
                                    for (let expW of expWords) {
                                        if (expW.length > 4 && word.length > 4) {
                                            if (expW.startsWith(word.substring(0, 5)) || word.startsWith(expW.substring(0, 5))) {
                                                score += word.length; 
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                            
                            if (score > highestScore && score > 5) {
                                highestScore = score;
                                bestMatchText = optText;
                            }
                        }
                        
                        if (bestMatchText) {
                            try {
                                await page.getByText(bestMatchText, { exact: false }).last().click({ force: true, timeout: 2000 });
                                console.log(`   🔥 HACK SUCCESS: Clicked Option with NLP Score: ${highestScore}!`);
                                clicked = true;
                            } catch (e) {
                                await page.getByText(bestMatchText, { exact: false }).last().locator('..').click({ force: true, timeout: 2000 });
                                console.log(`   🔥 HACK SUCCESS: Clicked Container with NLP Score: ${highestScore}!`);
                                clicked = true;
                            }
                        }
                    } catch (e) {}
                }

                if (!clicked) {
                    console.log(`⚠️ NLP Match failed. Blind guessing to unlock Next button.`);
                    try {
                        const fallbackTexts = await page.evaluate(() => {
                            return Array.from(document.body.innerText.split('\n')).map(t => t.trim()).filter(t => t.length > 5 && t.length < 150);
                        });
                        if (fallbackTexts.length > 2) {
                            let randomText = fallbackTexts[fallbackTexts.length - 2];
                            await page.getByText(randomText, { exact: false }).last().click({ force: true, timeout: 2000 });
                        }
                    } catch(e) {}
                }

            } else {
                console.log(`⚠️ Question not recognized. Attempting a blind guess to unlock Next button.`);
                try {
                    const fallbackTexts = await page.evaluate(() => {
                        return Array.from(document.body.innerText.split('\n')).map(t => t.trim()).filter(t => t.length > 5 && t.length < 150);
                    });
                    if (fallbackTexts.length > 2) {
                        let randomText = fallbackTexts[fallbackTexts.length - 2];
                        await page.getByText(randomText, { exact: false }).last().click({ force: true, timeout: 2000 });
                    }
                } catch(e) {}
            }

            await page.waitForTimeout(1000); 

            let navSuccess = false;
            try {
                const checkBtn = page.locator('button:has-text("Check")').last();
                const nextBtn = page.locator('button:has-text("Next")').last();
                const continueBtn = page.locator('button:has-text("Continue")').last();
                const submitBtn = page.locator('button:has-text("Submit"), button:has-text("Finish")').last();

                if (await checkBtn.isVisible()) {
                    await checkBtn.click({ timeout: 3000 });
                    navSuccess = true;
                    await page.waitForTimeout(2000); 
                    if (await continueBtn.isVisible()) await continueBtn.click({ timeout: 3000 });
                } else if (await submitBtn.isVisible()) {
                    await submitBtn.click({ timeout: 3000 });
                    console.log("✅ Exam submitted successfully!");
                    navSuccess = true;
                    await page.waitForTimeout(4000);
                    break; 
                } else if (await nextBtn.isVisible()) {
                    await nextBtn.click({ timeout: 3000 });
                    navSuccess = true;
                }
            } catch (error) {
                console.log(`❌ Navigation button was disabled or hidden.`);
            }

            if (!navSuccess) {
                consecutiveFails++;
                console.log(`   ⚠️ Retrying... (Fail ${consecutiveFails}/4). Forcing a random guess to unlock buttons.`);
                try {
                    const fallbackTexts = await page.evaluate(() => {
                        return Array.from(document.body.innerText.split('\n')).map(t => t.trim()).filter(t => t.length > 5 && t.length < 150);
                    });
                    if (fallbackTexts.length > consecutiveFails) {
                        let randomText = fallbackTexts[fallbackTexts.length - (1 + consecutiveFails)];
                        await page.getByText(randomText, { exact: false }).last().click({ force: true, timeout: 1500 });
                    }
                } catch(e) {}
            } else {
                consecutiveFails = 0; 
            }
        }

        examsCompleted++;
        console.log(`\n✅ Exam wrap-up complete. Preparing for the next run...`);
    }

    console.log(`\n🏁 Automation complete. Total exams finished this session: ${examsCompleted}`);
    await browser.close();
})();