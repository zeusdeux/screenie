# Screenie

Take screenshots of nodes or full pages by visting [`screenie.zdx.cat`](https://screenie.zdx.cat`).

## Support query params

### Endpoint `GET /capture`

- `src` (_required_) - full url of the website you want to screenshot. Authenticated pages aren't
  supported.
- `selector` (_optional_) - CSS selector of the node you want to screenshot. Please make sure it has
  URL safe characters. For e.g., `#` will throw it off.
- `viewportWidth` (_optional_) - width of the headless Chrome instance
- `viewportHeight` (_optional_) - height of the headless Chrome instance

## Example

Element screenshot - [`/capture?src=https://mudit.xyz&selector=nav > ul >
li:nth-child(3)`](https://screenie.zdx.cat/capture?src=https://mudit.xyz&selector=nav > ul >
li:nth-child(3))

Full page screenshot -
[`/capture?src=https://stefanjudis.com&viewportWidth=1024`](https://screenie.zdx.cat/capture?src=https://stefanjudis.com&viewportWidth=1024)
