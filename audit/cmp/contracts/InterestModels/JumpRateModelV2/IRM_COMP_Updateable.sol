pragma solidity ^0.5.16;

import "./BaseJumpRateModelV2.sol";
import "./InterestRateModel.sol";


/**
  * @title Compound's JumpRateModel Contract V2 for V2 cTokens
  * @author Arr00
  * @notice Supports only for V2 cTokens
  */
contract JumpRateModelV2 is InterestRateModel, BaseJumpRateModelV2  {

	/**
     * @notice Calculates the current borrow rate per block
     * @param cash The amount of cash in the market
     * @param borrows The amount of borrows in the market
     * @param reserves The amount of reserves in the market
     * @return The borrow rate percentage per block as a mantissa (scaled by 1e18)
     */
    function getBorrowRate(uint cash, uint borrows, uint reserves) external view returns (uint) {
        return getBorrowRateInternal(cash, borrows, reserves);
    }

    constructor(uint baseRatePerYear, uint multiplierPerYear, uint jumpMultiplierPerYear, uint kink_, address owner_) 
    	BaseJumpRateModelV2(baseRatePerYear,multiplierPerYear,jumpMultiplierPerYear,kink_,owner_) public {}
}

// -----Decoded View---------------
// Arg [0] : baseRatePerYear (uint256): 20000000000000000
// Arg [1] : multiplierPerYear (uint256): 180000000000000000
// Arg [2] : jumpMultiplierPerYear (uint256): 4000000000000000000
// Arg [3] : kink_ (uint256): 800000000000000000
// Arg [4] : owner_ (address): 0x6d903f6003cca6255D85CcA4D3B5E5146dC33925

// -----Encoded View---------------
// 5 Constructor Arguments found :
// Arg [0] : 00000000000000000000000000000000000000000000000000470de4df820000
// Arg [1] : 000000000000000000000000000000000000000000000000027f7d0bdb920000
// Arg [2] : 0000000000000000000000000000000000000000000000003782dace9d900000
// Arg [3] : 0000000000000000000000000000000000000000000000000b1a2bc2ec500000
// Arg [4] : 0000000000000000000000006d903f6003cca6255d85cca4d3b5e5146dc33925