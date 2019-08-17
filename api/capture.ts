import { NowRequest, NowResponse } from '@now/node'
import chrome from 'chrome-aws-lambda'
import { STATUS_CODES } from 'http'
import puppeteer from 'puppeteer-core'
import { ParsedUrlQuery } from 'querystring'
import { parse as parseURL } from 'url'
import { v4 as uuidV4 } from 'uuid'

interface ScreenshotOptions {
  src: string
  selector: string | null
  viewport: {
    width: number
    height: number
  }
}

async function getScreenshot({
  src,
  selector,
  viewport: { width = 800, height = 600 }
}: ScreenshotOptions): Promise<Buffer> {
  console.log('Params for screenshot', { src, selector }) // tslint:disable-line:no-console
  const browser = await puppeteer.launch({
    args: chrome.args,
    executablePath: await chrome.executablePath,
    headless: chrome.headless,
    defaultViewport: {
      width,
      height
    }
  })
  const page = await browser.newPage()
  let screenshot: Buffer
  await page.goto(src)

  if (selector) {
    const el = await page.$(selector)

    if (!el) {
      const error = new Error(
        `Element with selector ${selector} not found on page ${src}`
      ) as Error & { statusCode: number }
      error.statusCode = 400
      return Promise.reject(error)
    }

    screenshot = await el.screenshot({
      encoding: 'binary'
    })
  } else {
    screenshot = await page.screenshot({
      encoding: 'binary',
      fullPage: true
    })
  }

  await browser.close()
  return screenshot
}

export default async function(req: NowRequest, res: NowResponse): Promise<void> {
  const requestId = uuidV4()
  try {
    console.log('Request received with id ->', requestId) // tslint:disable-line:no-console
    const { query } = parseURL(req.url!, true)

    if (!query || !query.src) {
      const error = new Error('Malformed query. "src" query param must be provided.') as Error & {
        statusCode: number
      }
      error.statusCode = 400
      throw error
    }

    const src = query.src as string
    const selector = (query.selector as string) || null
    const { viewportWidth, viewportHeight } = query as ParsedUrlQuery & {
      viewportWidth: number
      viewportHeight: number
    }
    const screenshot = await getScreenshot({
      src,
      selector,
      viewport: { width: viewportWidth, height: viewportHeight }
    })
    const status = 200
    res.writeHead(status, STATUS_CODES[status], {
      'Content-Type': 'image/png',
      'Content-Length': Buffer.byteLength(screenshot, 'binary')
    })
    res.end(screenshot, 'binary')
  } catch (error) {
    const status = error.statusCode || 500
    const response = {
      statusCode: status,
      message: error.message,
      requestId
    }

    console.log('An error occured', { status, error, requestId }) // tslint:disable-line:no-console

    const stringifiedResponse = JSON.stringify(response) + '\n'

    res.writeHead(status, STATUS_CODES[status], {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(stringifiedResponse)
    })
    res.end(stringifiedResponse)
  } finally {
    console.log('Reqeust with id ended ->', requestId) // tslint:disable-line:no-console
  }
}
