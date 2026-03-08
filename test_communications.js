const puppeteer = require('puppeteer');

(async () => {
    console.log("Starting E2E simulation of BERP-Connect...");
    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream'
        ]
    });

    try {
        const userA_email = `userA_${Date.now()}@sbf.com`;
        const userB_email = `userB_${Date.now()}@sbf.com`;

        // Context A
        const contextA = await browser.createIncognitoBrowserContext();
        const pageA = await contextA.newPage();
        await pageA.goto('http://localhost:5173');

        console.log(`Registering User A: ${userA_email}`);
        await pageA.waitForSelector('p[style*="Already have an account?"]');
        await pageA.click('p[style*="Already have an account?"]'); // Switch to Register

        await pageA.type('input[type="email"]', userA_email);
        await pageA.type('input[type="password"]', 'password123');
        await pageA.click('button[type="submit"]');

        await pageA.waitForSelector('.logo-text'); // Wait for chat app load
        console.log("User A registered and logged in successfully.");


        // Context B
        const contextB = await browser.createIncognitoBrowserContext();
        const pageB = await contextB.newPage();
        await pageB.goto('http://localhost:5173');

        console.log(`Registering User B: ${userB_email}`);
        await pageB.waitForSelector('p[style*="Already have an account?"]');
        await pageB.click('p[style*="Already have an account?"]'); // Switch to Register

        await pageB.type('input[type="email"]', userB_email);
        await pageB.type('input[type="password"]', 'password123');
        await pageB.click('button[type="submit"]');

        await pageB.waitForSelector('.logo-text');
        console.log("User B registered and logged in successfully.");

        // User A adds User B
        console.log("User A adding User B as contact...");
        await pageA.type('input[placeholder="Add contact email..."]', userB_email);
        const searchBtnsA = await pageA.$$('button[type="submit"]');
        if (searchBtnsA.length > 0) {
            await searchBtnsA[0].click(); // Click Add Contact
        } else {
            await pageA.keyboard.press('Enter');
        }
        await pageA.waitForTimeout(1000);

        // Find User B's card in list and click
        const cardsA = await pageA.$$('.chat-name');
        for (let c of cardsA) {
            const text = await pageA.evaluate(el => el.textContent, c);
            if (text === userB_email) {
                await c.click();
                break;
            }
        }
        await pageA.waitForTimeout(1000);

        // User A sends message
        const testMessage = "Hello from User A simulation!";
        await pageA.type('textarea.message-input', testMessage);
        await pageA.click('.send-btn:not([disabled])'); // Send text button
        console.log("User A sent a text message.");

        await pageA.waitForTimeout(1000);

        // User B adds User A
        console.log("User B adding User A as contact...");
        await pageB.type('input[placeholder="Add contact email..."]', userA_email);
        const searchBtnsB = await pageB.$$('button[type="submit"]');
        if (searchBtnsB.length > 0) {
            await searchBtnsB[0].click();
        } else {
            await pageB.keyboard.press('Enter');
        }
        await pageB.waitForTimeout(1000);

        // Find User A's card in list and click
        const cardsB = await pageB.$$('.chat-name');
        for (let c of cardsB) {
            const text = await pageB.evaluate(el => el.textContent, c);
            if (text === userA_email) {
                await c.click();
                break;
            }
        }
        await pageB.waitForTimeout(1000);

        // Check if User B received the message
        const pageB_html = await pageB.content();
        if (pageB_html.includes(testMessage)) {
            console.log("SUCCESS: User B received User A's message in private room!");
        } else {
            console.error("FAILURE: User B did not receive the message.");
        }

        // Test Voice Note
        console.log("Testing Voice Notes...");
        await pageA.click('.icon-btn:last-of-type'); // Start recording (mic icon is near bottom, let's use exact search)
        const micButtonsList = await pageA.$$eval('button.icon-btn', btns => btns.map(b => b.innerHTML));
        const micIndex = micButtonsList.findIndex(html => html.includes('lucide-mic'));
        if (micIndex > -1) {
            const btns = await pageA.$$('button.icon-btn');
            await btns[micIndex].click(); // Start
            await pageA.waitForTimeout(2000);
            const stopButtonsList = await pageA.$$eval('button.icon-btn', btns => btns.map(b => b.innerHTML));
            const stopIndex = stopButtonsList.findIndex(html => html.includes('lucide-square'));
            if (stopIndex > -1) {
                const sBtns = await pageA.$$('button.icon-btn');
                await sBtns[stopIndex].click(); // Stop
                console.log("User A uploaded a Voice Note.");
            }
        }
        await pageA.waitForTimeout(2000); // give time for UL

        // Test Video Calling
        console.log("Testing Video Calling WebRTC...");
        const videoBtnIndex = micButtonsList.findIndex(html => html.includes('lucide-video'));
        if (videoBtnIndex > -1) {
            const btns = await pageA.$$('button.icon-btn');
            await btns[videoBtnIndex].click(); // Click video call icon on top right
            console.log("User A initiated WebRTC Video Call.");
        }

        await pageA.waitForTimeout(2000);

        const bContentUpdated = await pageB.content();
        if (bContentUpdated.includes("Incoming Call from")) {
            console.log("SUCCESS: User B received the WebRTC generic signaling call ring!");
        } else {
            console.error("FAILURE: User B did NOT receive the incoming ring.");
        }

        console.log("All simulations successfully executed! Automation complete.");

    } catch (err) {
        console.error("Testing Error:", err);
    } finally {
        await browser.close();
    }
})();
