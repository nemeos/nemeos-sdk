import * as ethers from 'ethers'

export const assertValidHexAddress = (value: string) => {
  if (!ethers.isAddress(value)) {
    throw new NemeosSDKError(`The provided address is not a valid Ethereum address: "${value}".`)
  }
}

export class NemeosSDKError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = this.constructor.name
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export async function getFeeOverrides(provider: ethers.Provider) {
  const feeData = await provider!.getFeeData()
  const isLegacyNetwork = feeData.maxFeePerGas === undefined || feeData.maxPriorityFeePerGas === undefined
  return isLegacyNetwork
    ? { gasPrice: feeData.gasPrice }
    : { maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas }
}
