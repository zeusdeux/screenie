import * as Joi from '@hapi/joi'
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
  fullPage: boolean
}

async function getScreenshot({
  src,
  selector,
  viewport: { width, height },
  fullPage = true
}: ScreenshotOptions): Promise<Buffer> {
  console.log('Params for screenshot', { src, selector, viewport: { width, height } }) // tslint:disable-line:no-console
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
      fullPage
    })
  }

  await browser.close()
  return screenshot
}

export default async function(req: NowRequest, res: NowResponse): Promise<void> {
  const requestId = uuidV4()
  console.log('Request received with id ->', requestId) // tslint:disable-line:no-console

  try {
    const { query } = parseURL(req.url!, true)

    console.log('Received query ->', query) // tslint:disable-line:no-console

    const RawQueryParamsSchema = Joi.object().keys({
      src: Joi.string()
        .uri({ scheme: ['http', 'https'] })
        .required(),
      selector: Joi.string()
        .min(1)
        .optional(),
      viewportWidth: Joi.string()
        .min(1)
        .optional(),
      viewportHeight: Joi.string()
        .min(1)
        .optional(),
      fullPage: Joi.string().only(['true', 'false'])
    })
    const qsValidationResult = Joi.validate(query, RawQueryParamsSchema, { abortEarly: false })

    if (qsValidationResult.error) {
      ;(qsValidationResult.error as Joi.ValidationError & { statusCode: number }).statusCode = 400
      qsValidationResult.error.message = qsValidationResult.error.message.replace(
        'child',
        'query param'
      )
      throw qsValidationResult.error
    }

    const src = qsValidationResult.value.src as string
    const selector = qsValidationResult.value.selector
      ? (qsValidationResult.value.selector as string)
      : null
    const {
      viewportWidth,
      viewportHeight,
      fullPage
    } = qsValidationResult.value as ParsedUrlQuery & {
      viewportWidth: string
      viewportHeight: string
      fullPage: string
    }

    const parsedViewportWidth = viewportWidth ? Number.parseInt(viewportWidth, 10) : 800
    const parsedViewportHeight = viewportHeight ? Number.parseInt(viewportHeight, 10) : 600

    if (Number.isNaN(parsedViewportHeight) || Number.isNaN(parsedViewportWidth)) {
      const error = new Error(
        'Invalid viewportWidth or viewportHeight. They should be integers.'
      ) as Error & { statusCode: number }
      error.statusCode = 400
      throw error
    }

    const screenshot = await getScreenshot({
      src,
      selector,
      viewport: {
        width: parsedViewportWidth,
        height: parsedViewportHeight
      },
      fullPage: fullPage === 'true' ? true : false
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
