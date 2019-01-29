const puppeteer = require("puppeteer");
const fs = require("fs");

(() => {
  try {
    const REVIEW_BUTTON_CLASS = "button.jqnFjrOWMVU__button.gm2-caption";
    const REVIEW_TITLE = "span.section-review-text";
    const SITE_LINK =
      "https://www.google.com/maps/place/PlumbPRO+Services/@40.1054485,-75.2942502,11z/data=!4m5!3m4!1s0x0:0x530f7614913982ce!8m2!3d40.1710653!4d-75.1598393?hl=en-us";
    const extractTotalReviewCount = () => {
      const reviewButton = document
        .querySelector("button.jqnFjrOWMVU__button.gm2-caption")
        .innerText.split(" ")[0];
      return reviewButton;
    };

    const extractReviewCount = () => {
      return document.querySelectorAll("span.section-review-text").length;
    };

    const getPreviousHeight = () => {
      return document.querySelector(
        ".section-listbox.section-scrollbox.scrollable-y.scrollable-show"
      ).scrollHeight;
    };

    const scrapeInfiniteScrollItems = async page => {
      let totalReviewCount = 59; //await page.evaluate(extractTotalReviewCount);
      let _reviewCount = await page.evaluate(extractReviewCount);

      while (totalReviewCount > _reviewCount) {
        const previousHeight = await page.evaluate(getPreviousHeight);
        await page.evaluate(() => {
          let leftSideBar = document.querySelector(
            ".section-listbox.section-scrollbox.scrollable-y.scrollable-show"
          );
          leftSideBar.scrollTo(0, leftSideBar.scrollHeight);
        });
        await page.waitForFunction(
          `document.querySelector('.section-listbox.section-scrollbox.scrollable-y.scrollable-show').scrollHeight>${previousHeight}`
        );
        _reviewCount = await page.evaluate(extractReviewCount);
      }

      await page.evaluate(() =>
        document
          .querySelectorAll(
            'button.section-expand-review:not([style="display:none"])'
          )
          .forEach(function(element) {
            element.click();
          })
      );
    };

    (async () => {
      try {
        const browser = await puppeteer.launch({
          headless: false,
          args: ["about:blank"]
        });
        // Not using .newPage in favor of using the first tab opened on execution.
        //const page = await browser.newPage();
        const pages = await browser.pages();
        const page = await pages[0];
        //1080p Dimensions.
        await page.setViewport({ width: 1920, height: 1080 });
        //Tab Specific UserAgent.
        page.setUserAgent(
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36"
        );
        await page.goto(SITE_LINK);
        await page.waitForSelector(REVIEW_BUTTON_CLASS);
        await page.click(REVIEW_BUTTON_CLASS);
        //await page.waitForSelector(REVIEW_TITLE);
        await page.waitForNavigation({ waitUntil: "networkidle2" });
        await page.click("button.section-tab-info-stats-button");
        //await page.click('button.section-tab-info-stats-button');

        const menuEntry = "#context-menu > div:nth-child(2)";
        await page.waitForSelector(menuEntry);
        await page.click(menuEntry);
        //await page.waitForNavigation({waitUntil: 'networkidle2'});

        await scrapeInfiniteScrollItems(page, 100);
        const titles = await page.evaluate(() => {
          const reviews = document.querySelectorAll(".section-review-content");
          let titles = [];
          reviews.forEach(review => {
            let rank = review
              .querySelector(".section-review-stars")
              .getAttribute("aria-label");
            let wash = review
              .querySelector(".section-review-link")
              .getAttribute("style")
              .split("(")[1];
            let avatar = wash.replace(")", " ").trim();

            titles.push({
              author: review.querySelector(".section-review-title").textContent,
              body: review.querySelector(".section-review-text").textContent,
              time: review.querySelector(".section-review-publish-date")
                .textContent,
              avatar,
              source: "Google",
              rank: parseFloat(rank)
            });
          });
          return titles;
        });
        //console.log(titles);
        fs.writeFile("./googleDat.json", JSON.stringify(titles), err =>
          err ? console.log(err) : console.log("FILE SAVED!")
        );
        //await browser.close();
      } catch (e) {
        console.log("Script Error: ", e);
      }
    })();
  } catch (e) {
    console.log("Main Script: ", e);
  }
})();
