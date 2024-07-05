import * as ethers from 'ethers'
import { ofetch } from 'ofetch'
import { NemeosSDKError } from './utils.js'

const extractHttpErrorMessage = (error: any): string => error?.data?.message || error?.message || error?.data?.error
const extractHttpErrorMessageThenThrow = (error: any) => {
  throw new NemeosSDKError(extractHttpErrorMessage(error))
}

export class NemeosBackendClient {
  private ofetchClient = ofetch.create({
    baseURL: process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : 'https://api.nemeos.finance',
  })

  public async generateLoginSignature(metamaskSigner: ethers.JsonRpcSigner) {
    const message = `Action: check_ownership ; Date: ${new Date().toISOString()}`
    return {
      message,
      signature: await metamaskSigner.signMessage(message),
    }
  }

  public async setCustomerDataEmail(
    borrowerAddress: string,
    loginSignedMessage: string,
    loginSignature: string,
    email: string,
  ): Promise<void> {
    return this.ofetchClient(`/customerData/${borrowerAddress}/email`, {
      method: 'PUT',
      headers: {
        'X-Login-Signed-Message': loginSignedMessage,
        'X-Login-Signed-Signature': loginSignature,
      },
      body: {
        email,
      },
    }).catch(extractHttpErrorMessageThenThrow)
  }

  public async fetchStartLoanData(
    borrowerAddress: string,
    nftCollectionAddress: string,
    nftId: number,
    loanDurationDays: number,
  ): Promise<string> {
    return this.ofetchClient(`/nftCollections/${nftCollectionAddress}/nftId/${nftId}/startLoanData`, {
      query: {
        loanDurationDays,
        customerWalletAddress: borrowerAddress,
      },
    }).catch(extractHttpErrorMessageThenThrow)
  }
}
