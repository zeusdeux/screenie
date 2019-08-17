# Screenie

Take screenshots of nodes or full pages by visting [`screenie.zdx.cat`](https://screenie.zdx.cat`).

## Supported query params

### Endpoint `GET /capture`

- `src` (_required_) - full url of the website you want to screenshot. Authenticated pages aren't
  supported.
- `selector` (_optional_) - CSS selector of the node you want to screenshot. Please make sure it has
  URL safe characters. For e.g., `#` will throw it off.
- `viewportWidth` (_optional_) - width of the headless Chrome instance
- `viewportHeight` (_optional_) - height of the headless Chrome instance
- `fullPage` (_optional_) - take a full page screenshot or not. Valid values are `true` and `false`.
  Only application when no selector is provided.

## Example

Element screenshot -
[`/capture?src=https://mudit.xyz&selector=nav > ul > li:nth-child(3)`](<https://screenie.zdx.cat/capture?src=https://mudit.xyz&selector=nav%20%3E%20ul%20%3E%20li:nth-child(3)>)

Full page screenshot -
[`/capture?src=https://stefanjudis.com&viewportWidth=1024&fullPage=true`](https://screenie.zdx.cat/capture?src=https://stefanjudis.com&viewportWidth=1024&fullPage=true)
