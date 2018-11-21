const fs = require('fs')
const path = require('path')
const puppeteer = require('puppeteer')

;(async () => {
  try {
    const browser = await puppeteer.launch({
      defaultViewport: {
        width: 1920,
        height: 1080
      }
    })

    const page = await browser.newPage()
    await page.goto('https://www.npmjs.com/advisories?page=0&perPage=20')
    const numberOfPages = await page.evaluate(
      () => document.querySelectorAll('[class^="pagination__pagination"] > [class^="pagination__page"]')[4].textContent
    )
    const totalItems = numberOfPages * 20
    let pageCount = 0
    await page.goto(`https://www.npmjs.com/advisories?page=0&perPage=${totalItems}`)
    const advisories = await page.evaluate(() => {
      function getPatchedStatus(status) {
        if (status.includes('not')) {
          return false
        }
        return true
      }
      function getSeverity(string) {
        if (string.includes('moderate')) {
          return 'moderate'
        }
        if (string.includes('critical')) {
          return 'critical'
        }
        if (string.includes('low')) {
          return 'low'
        }
        if (string.includes('critical')) {
          return 'critical'
        }
      }

      const advisoryData = []
      const elements = Array.from(document.querySelectorAll('tr')).slice(1)
      elements.map(el => {
        const title = el.querySelector('[class^="advisory-list__title"]').textContent
        const module = el.querySelector('[class^="advisory-list__module"]').textContent
        const date = el.querySelector('[class*="advisory-list__date"]').textContent
        const patched = getPatchedStatus(el.querySelector('img[src*="status"]').alt.toLowerCase())
        const severity = getSeverity(el.querySelector('img[src*="severity"]').alt.toLowerCase())
        advisoryData.push({ date, module, patched, severity, title })
      })
      return advisoryData
    })
    fs.writeFileSync(path.join(__dirname, 'advisories.json'), JSON.stringify(advisories, null, 2))
    console.log('done :)')
    await browser.close()
  } catch (err) {
    console.error(err)
  }
})()
