const puppeteer = require("puppeteer");
const fs = require("fs");

async function run() {
  const initialInput = "#mobileFauxInput";
  const clearArea =
    "#root > div > div > div > div:nth-child(1) > header > div > form > div.jss103.jss111.jss122.styles__MobileSearchContainerGrid-sc-16icuas-0.hXIrFd > div:nth-child(4) > div > div > button > svg";
  const business = "K & S Heating and Air";
  const businessLocation = "garland tx";
  //   const business = "microsoft";
  //   const businessLocation = "Redmond, WA";
  //   const business = "georgios";
  //   const businessLocation = "cleveland, oh";
  //   const businessNumber='(704) 793-1099'
  //   const businessNumber = "(414) 645-3303";
  const businessNameSelector = "#findTypeaheadInput";
  const locationSelector = "#nearTypeaheadInput";
  const searchButtonSelector =
    "#root > div > div > div > div:nth-child(1) > header > div > form > div.jss103.jss111.jss122.styles__MobileSearchContainerGrid-sc-16icuas-0.hXIrFd > div:nth-child(2) > button > span.jss52";
  const loadAllReviews =
    "#root > div > div > div > div.styles__GridPageContent-sc-1v5yf99-1.knBmOf.styles__GridPageSection-sc-1v5yf99-0.iCoLBc > div.styles__DivBand-sc-1bzibaw-0.dzMrgS > div:nth-child(2) > div.jss1.jss25 > div:nth-child(2) > div > div:nth-child(3) > div > div > div > div:nth-child(2) > div > div > div:nth-child(1) > div:nth-child(2) > p > a";

  const loadMoreReviews =
    "#root > div > div > div > div.styles__GridPageContent-sc-1v5yf99-1.knBmOf.styles__GridPageSection-sc-1v5yf99-0.iCoLBc > div > div:nth-child(6) > div > div.jss2.jss41.jss65.Grid__PrintGrid-hz6p1r-0.dGJnOL.PrintableElement-sc-1p7e3o8-0.daaxjJ > div:nth-child(6) > button";
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  page.on("console", consoleObj => console.log(consoleObj.text()));

  const isElementVisible = async (page, cssSelector) => {
    let visible = true;
    await page
      .waitForSelector(cssSelector, { visible: true, timeout: 2000 })
      .catch(() => {
        visible = false;
      });
    return visible;
  };

  try {
    await page.goto("https://www.bbb.org/");

    await page.click(initialInput);

    await page.click(businessNameSelector);
    await page.keyboard.type(business);

    await page.click(clearArea);

    await page.click(locationSelector);
    await page.keyboard.type(businessLocation);

    await page.click(searchButtonSelector);

    await page.waitForNavigation();

    await page.evaluate(businessNumber =>
      document
        .querySelectorAll(".dtm-search-listing-phone")
        .forEach(function(element) {
          if (element.textContent === "(972) 271-9319") {
            element.parentNode.click();
          }
        })
    );

    await page.waitForNavigation();

    await page
      .waitForSelector(
        "#root > div > div > div > div.styles__GridPageContent-sc-1v5yf99-1.knBmOf.styles__GridPageSection-sc-1v5yf99-0.iCoLBc > div.styles__DivBand-sc-1bzibaw-0.dzMrgS > div:nth-child(2) > div.jss1.jss25 > div:nth-child(2) > div > div:nth-child(3) > div > div > div > div:nth-child(2) > div > div > div:nth-child(1) > div:nth-child(2) > p > a",
        { timeout: 3000 }
      )
      .then(() => {
        page.click(loadAllReviews);
      })
      .catch(() => {
        //RETURN NO REVIEWS AT THIS POINT
        console.log("no love");
        browser.close();
      });

    await page.evaluate(() => {
      document
        .querySelectorAll(
          "dtm-read-more.jss361.styles__LinkStyled-sc-1yozr49-0.eyfwAI"
        )
        .forEach(item => {
          console.log(item.textContent);
        });
    });
    let loadMoreVisible = await isElementVisible(page, loadMoreReviews);
    while (loadMoreVisible) {
      await page.click(loadMoreReviews).catch(() => {});
      loadMoreVisible = await isElementVisible(page, loadMoreReviews);
    }

    const reviewsArray = await page.evaluate(() => {
      let elements = document.getElementsByClassName(
        "jss2 styles__ReviewWrapper-sc-179a6lc-1 eXrTUG"
      );

      let reviewsArray = [];
      for (let i = 0; i < elements.length; i++) {
        let count;
        if (elements[i].getElementsByClassName("iYZEDq").length > 0) {
          count = 1;
        } else if (elements[i].getElementsByClassName("cAwFMp").length > 0) {
          count = 2;
        } else if (elements[i].getElementsByClassName("iJcXOI").length > 0) {
          count = 3;
        } else if (elements[i].getElementsByClassName("foCBFt").length > 0) {
          count = 5;
        } else {
          count = 4;
        }

        let obj = {
          avatar:
            "https://cdn.pixabay.com/photo/2017/02/25/22/04/user-icon-2098873_960_720.png",
          body: elements[i].getElementsByClassName(
            "jss214 jss222 jss241 styles__ReviewText-sc-179a6lc-0 leFlhE"
          )[0].innerText,
          author: elements[i].getElementsByClassName(
            "jss2 styles__ReviewHeaderWrapper-sc-179a6lc-2 kvRMWi"
          )[0].innerText,
          time: Date.parse(
            elements[i].getElementsByClassName("jss214 jss222")[0].innerText
          ),
          rank: count,
          source: "BBB"
        };

        obj.author = obj.author.replace(/[^A-Za-z_ ]/g, "");
        reviewsArray.push(obj);
      }
      return reviewsArray;
    });
    console.log(reviewsArray);
    console.log(reviewsArray.length);
    fs.writeFile("./googleDat.json", JSON.stringify(reviewsArray), err =>
      err ? console.log(err) : console.log("FILE SAVED!")
    );
    // browser.close();
  } catch (e) {
    console.log(e);
  }
}

// run();

module.exports;

module.exports.init = function() {
  run();
};
