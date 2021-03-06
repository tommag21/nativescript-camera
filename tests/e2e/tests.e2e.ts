import { AppiumDriver, createDriver, SearchOptions, Direction, UIElement, Point, Locator } from "nativescript-dev-appium";
import { isSauceLab, runType } from "nativescript-dev-appium/lib/parser";
import { expect } from "chai";
const fs = require('fs');
const addContext = require('mochawesome/addContext');
const rimraf = require('rimraf');
const isSauceRun = isSauceLab;

describe("Camera", () => {
    let driver: AppiumDriver;

    before(async () => {
        driver = await createDriver();
        driver.defaultWaitTime = 15000;
        let dir = "mochawesome-report";
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        rimraf('mochawesome-report/*', function () { });
    });

    after(async () => {
        if (isSauceRun) {
            driver.sessionId().then(function (sessionId) {
                console.log("Report: https://saucelabs.com/beta/tests/" + sessionId);
            });
        }
        await driver.quit();
        console.log("Driver quits!");
    });

    afterEach(async function () {
        if (this.currentTest.state && this.currentTest.state === "failed") {
            let png = await driver.logScreenshot(this.currentTest.title);
            fs.copyFile(png, './mochawesome-report/' + this.currentTest.title + '.png', function (err) {
                if (err) {
                    throw err;
                }
                console.log('Screenshot saved.');
            });
            addContext(this, './' + this.currentTest.title + '.png');
        }
    });

    it("should take a picture", async function () {
        const takePictureButton = await driver.findElementByText("Take Picture");
        await takePictureButton.click();
        if (driver.isAndroid) {
            await driver.wait(1000);
            let allow = await driver.findElementByText("ALLOW", SearchOptions.exact);
            await allow.click();
            allow = await driver.findElementByText("ALLOW", SearchOptions.exact);
            await allow.click();
            const deny = await driver.findElementByText("Deny", SearchOptions.contains);
            await deny.click();
            let nextBtnLocationTag = await driver.findElementByText("NEXT", SearchOptions.exact);
            await nextBtnLocationTag.click();

            let shutter = await driver.findElementByAccessibilityId("Shutter"); // Take a picture
            await shutter.click();
            // workaround for issue in android initial camera app open
            await driver.navBack();
            await takePictureButton.click();
            await shutter.click();
            let acceptBtn = await driver.findElementByAccessibilityId("Done"); // Accept it
            await acceptBtn.click();
        } else {
            let ok = await driver.findElementByTextIfExists("OK", SearchOptions.exact);
            if(ok !== undefined){
                await ok.click();
                let okBtn = await driver.findElementByTextIfExists("OK", SearchOptions.exact);
                await okBtn.click();
            }
            let photos = await driver.findElementByText("Photos", SearchOptions.exact);
            expect(photos).to.exist;
            await driver.wait(2000);
            await driver.clickPoint(50, 110); // Select directory
            await driver.wait(2000);
            await driver.clickPoint(50, 240); // Select image
        }
        const saveToGalleryLabel = await driver.findElementByText("saveToGallery");
        expect(saveToGalleryLabel).to.exist;
    });
});