import { NemeosSDK } from './index.js'

async function main() {
  const nemeosSdk = new NemeosSDK({
    getAddress: () => '0x76778AeDe1Afc5031FAb1C761C41130F31415424',
  } as any)

  const nemeosPoolAddress = '0x812db15b8Bb43dBA89042eA8b919740C23aD48a3'
  const cyberKongzAddress = '0x15cd1cfCd48C06cfC44D433D66C7a9fE06b2C2c3'
  const nemeosPool = nemeosSdk.getPool(cyberKongzAddress)

  await nemeosPool.startLoan(224, 90)
}

main().catch(console.error)
