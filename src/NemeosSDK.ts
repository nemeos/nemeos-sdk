import * as ethers from 'ethers'
import { NemeosCustomerClient } from './Customer/NemeosCustomerClient.js'
import { NemeosPoolClient, NemeosPoolMode } from './Pool/NemeosPoolClient.js'
import { assertValidHexAddress } from './utils.js'
import { NemeosPoolBuyOpenSeaClient } from './Pool/NemeosPoolBuyOpenSeaClient.js'

export const getBrowserProvider = (windowEthereum: ethers.Eip1193Provider) => {
  return new ethers.BrowserProvider(windowEthereum)
}

export class NemeosSDK {
  private readonly enableLogging: boolean

  constructor(
    private readonly signer: ethers.Signer,
    options?: {
      /** Enable logging to the console - Optional, default: `true` */
      enableLogging?: boolean
    },
  ) {
    this.enableLogging = options?.enableLogging === undefined ? true : options.enableLogging
  }

  public getNemeosCustomerClient(): NemeosCustomerClient {
    return new NemeosCustomerClient(this.signer, this.enableLogging)
  }

  public getNemeosPoolClient(params: {
    nftCollectionAddress: string
    nemeosPoolAddress: string
    nemeosPoolMode: NemeosPoolMode.BuyOpenSea
  }): NemeosPoolClient {
    assertValidHexAddress(params.nftCollectionAddress)
    assertValidHexAddress(params.nemeosPoolAddress)

    if (params.nemeosPoolMode === NemeosPoolMode.BuyOpenSea) {
      return new NemeosPoolBuyOpenSeaClient(this.signer, this.enableLogging, params.nftCollectionAddress, params.nemeosPoolAddress)
    } else {
      throw new Error(`Unsupported Nemeos Pool mode: ${params.nemeosPoolMode}, supported modes: ${Object.values(NemeosPoolMode)}`)
    }
  }

  public static NemeosPoolMode = NemeosPoolMode
}
