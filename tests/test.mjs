// @ts-check

import * as ethers from 'ethers'
import { NemeosSDK } from '../dist/index.js'

async function main() {
  if (!process.env.WALLET_PRIVATE_KEY || !process.env.INFURA_ENDPOINT_WITH_API_KEY) {
    const missingVariables = Object.entries({
      WALLET_PRIVATE_KEY: process.env.WALLET_PRIVATE_KEY,
      INFURA_ENDPOINT_WITH_API_KEY: process.env.INFURA_ENDPOINT_WITH_API_KEY,
    })
      .filter(([_, value]) => !value)
      .map(([key]) => key)
      .join(', ')
    throw new Error(`Missing environment variables: ${missingVariables}.`)
  }

  const provider = new ethers.JsonRpcProvider(process.env.INFURA_ENDPOINT_WITH_API_KEY)
  const wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY, provider)

  const nemeosSdk = new NemeosSDK(wallet)

  //
  // NemeosCustomerClient
  //

  const nemeosCustomerClient = nemeosSdk.getNemeosCustomerClient()

  const loginSignature = await nemeosCustomerClient.requestLoginSignature()
  console.log('loginSignature:', loginSignature)
  await nemeosCustomerClient.registerEmail(loginSignature, 'nemeos.hello.testing1234@yopmail.com')
  // await nemeosCustomerClient.unregisterEmail(loginSignature)

  //
  // NemeosPoolClient
  //

  const nemeosPoolAddress = '0x812db15b8Bb43dBA89042eA8b919740C23aD48a3'
  const cyberKongzAddress = '0x15cd1cfCd48C06cfC44D433D66C7a9fE06b2C2c3'

  const nemeosPoolClient = nemeosSdk.getNemeosPoolClient({
    nemeosPoolAddress,
    nftCollectionAddress: cyberKongzAddress,
  })

  // await nemeosPool.startLoan(224, 90)
  await nemeosPoolClient.retrieveLoan(224)
  // await nemeosPool.payNextLoanStep(224)
}

main().catch(console.error)
