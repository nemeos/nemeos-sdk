export enum NemeosPoolMode {
  BuyOpenSea = 'BuyOpenSea',
  DirectMint = 'DirectMint',
}

export const NEMEOS_ABI = {
  POOL: {
    [NemeosPoolMode.BuyOpenSea]: [
      'function buyNFT(uint256 tokenId, uint256 priceOfNFT, uint256 nftFloorPrice, uint256 priceOfNFTIncludingFees, address settlementManager, uint256 loanTimestamp, uint256 loanDurationInSeconds, bytes orderExtraData, bytes oracleSignature) payable',

      'function retrieveLoan(uint256 tokenId, address borrower) view returns ((address borrower, uint256 tokenID, uint256 amountAtStart, uint256 amountOwedWithInterest, uint256 nextPaymentAmount, uint256 interestAmountPerPayment, uint256 loanDurationInSeconds, uint256 startTime, uint256 nextPaymentTime, uint160 remainingNumberOfInstallments, uint256 dailyInterestRateAtStart, bool isClosed, bool isInLiquidation))',

      'function refundLoan(uint256 tokenId, address borrower) payable',
    ],

    [NemeosPoolMode.DirectMint]: [
      'function buyNFT(uint256 tokenId, uint256 priceOfNFT, uint256 nftFloorPrice, uint256 priceOfNFTIncludingFees, address crowdsaleContractAddress, uint256 loanTimestamp, uint256 loanDurationInSeconds, bytes orderExtraData, bytes oracleSignature, bytes32[] proof) payable',

      'function retrieveLoan(uint256 tokenId, address borrower) view returns ((address borrower, uint256 tokenID, uint256 amountAtStart, uint256 amountOwedWithInterest, uint256 nextPaymentAmount, uint256 interestAmountPerPayment, uint256 loanDurationInSeconds, uint256 startTime, uint256 nextPaymentTime, uint160 remainingNumberOfInstallments, uint256 dailyInterestRateAtStart, bool isClosed, bool isInLiquidation))',

      'function refundLoan(uint256 tokenId, address borrower) payable',

      'function isWhitelistedAddress(address _address, bytes32[] _proof) view returns (bool)',
    ],
  },
} as const
