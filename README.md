<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="./logo_full_blue.png" width="200" alt="Nemeos Logo" /></a>
</p>

<p align="center">Building new web3 economies.</p>
  <p align="center">
<a href="https://twitter.com/Nemeos_Finance" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=@Nemeos_Finance"></a>
</p>

# nemeos-sdk

Nemeos SDK to facilitate integration with the [Nemeos](nemeos.finance) platform.

## Install

```bash
pnpm install nemeos-sdk
```

## Build

```bash
pnpm build
```

## Usage

TODO

## Tests

### Test script

```bash
# Build with tsc
pnpm build:tsc

# Run the test script
WALLET_PRIVATE_KEY=43ac571235456515454565645445454546123121454848791215488877897123 \
INFURA_ENDPOINT_WITH_API_KEY=https://sepolia.infura.io/v3/b3866123121321321231212132131123 \
node dist/tests/test.js
```

### Browser test page

Build the test page and the required dependencies with Parcel

```bash
pnpm build:test-html
```

Then open a server, for example with [`serve`](https://github.com/vercel/serve)

```bash
serve dist/ -p 5555
```

## License

[The MIT License](./LICENSE)
