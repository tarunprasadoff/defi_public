/**
 *Submitted for verification at Etherscan.io on 2019-05-07
*/

import "./ComptrollerInterface.sol";

import "./ErrorReporter.sol";

import "./CarefulMath.sol";

import "./Exponential.sol";

import "./EIP20Interface.sol";

import "./EIP20NonStandardInterface.sol";

// File: contracts/ReentrancyGuard.sol

pragma solidity ^0.5.8;

/**
 * @title Helps contracts guard against reentrancy attacks.
 * @author Remco Bloemen <remco@2π.com>, Eenae <alexey@mixbytes.io>
 * @dev If you mark a function `nonReentrant`, you should also
 * mark it `external`.
 */
contract ReentrancyGuard {
    /// @dev counter to allow mutex lock with only one SSTORE operation
    uint256 private _guardCounter;

    constructor () internal {
        // The counter starts at one to prevent changing it from zero to a non-zero
        // value, which is a more expensive operation.
        _guardCounter = 1;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and make it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _guardCounter += 1;
        uint256 localCounter = _guardCounter;
        _;
        require(localCounter == _guardCounter, "re-entered");
    }
}

// File: contracts/InterestRateModel.sol

pragma solidity ^0.5.8;

/**
  * @title The Compound InterestRateModel Interface
  * @author Compound
  * @notice Any interest rate model should derive from this contract.
  * @dev These functions are specifically not marked `pure` as implementations of this
  *      contract may read from storage variables.
  */
interface InterestRateModel {
    /**
      * @notice Gets the current borrow interest rate based on the given asset, total cash, total borrows
      *         and total reserves.
      * @dev The return value should be scaled by 1e18, thus a return value of
      *      `(true, 1000000000000)` implies an interest rate of 0.000001 or 0.0001% *per block*.
      * @param cash The total cash of the underlying asset in the CToken
      * @param borrows The total borrows of the underlying asset in the CToken
      * @param reserves The total reserves of the underlying asset in the CToken
      * @return Success or failure and the borrow interest rate per block scaled by 10e18
      */
    function getBorrowRate(uint cash, uint borrows, uint reserves) external view returns (uint, uint);

    /**
      * @notice Marker function used for light validation when updating the interest rate model of a market
      * @dev Marker function used for light validation when updating the interest rate model of a market. Implementations should simply return true.
      * @return Success or failure
      */
    function isInterestRateModel() external view returns (bool);
}

import "./CToken.sol";

// File: contracts/CEther.sol

pragma solidity ^0.5.8;


/**
 * @title Compound's CEther Contract
 * @notice CToken which wraps Ether
 * @author Compound
 */
contract CEther is CToken {
    /**
     * @notice Construct a new CEther money market
     * @param comptroller_ The address of the Comptroller
     * @param interestRateModel_ The address of the interest rate model
     * @param initialExchangeRateMantissa_ The initial exchange rate, scaled by 1e18
     * @param name_ ERC-20 name of this token
     * @param symbol_ ERC-20 symbol of this token
     * @param decimals_ ERC-20 decimal precision of this token
     */
    constructor(ComptrollerInterface comptroller_,
                InterestRateModel interestRateModel_,
                uint initialExchangeRateMantissa_,
                string memory name_,
                string memory symbol_,
                uint decimals_) public
    CToken(comptroller_, interestRateModel_, initialExchangeRateMantissa_, name_, symbol_, decimals_) {}

    /*** User Interface ***/

    /**
     * @notice Sender supplies assets into the market and receives cTokens in exchange
     * @dev Reverts upon any failure
     */
    function mint() external payable {
        requireNoError(mintInternal(msg.value), "mint failed");
    }

    /**
     * @notice Sender redeems cTokens in exchange for the underlying asset
     * @dev Accrues interest whether or not the operation succeeds, unless reverted
     * @param redeemTokens The number of cTokens to redeem into underlying
     * @return uint 0=success, otherwise a failure (see ErrorReporter.sol for details)
     */
    function redeem(uint redeemTokens) external returns (uint) {
        return redeemInternal(redeemTokens);
    }

    /**
     * @notice Sender redeems cTokens in exchange for a specified amount of underlying asset
     * @dev Accrues interest whether or not the operation succeeds, unless reverted
     * @param redeemAmount The amount of underlying to redeem
     * @return uint 0=success, otherwise a failure (see ErrorReporter.sol for details)
     */
    function redeemUnderlying(uint redeemAmount) external returns (uint) {
        return redeemUnderlyingInternal(redeemAmount);
    }

    /**
      * @notice Sender borrows assets from the protocol to their own address
      * @param borrowAmount The amount of the underlying asset to borrow
      * @return uint 0=success, otherwise a failure (see ErrorReporter.sol for details)
      */
    function borrow(uint borrowAmount) external returns (uint) {
        return borrowInternal(borrowAmount);
    }

    /**
     * @notice Sender repays their own borrow
     * @dev Reverts upon any failure
     */
    function repayBorrow() external payable {
        requireNoError(repayBorrowInternal(msg.value), "repayBorrow failed");
    }

    /**
     * @notice Sender repays a borrow belonging to borrower
     * @dev Reverts upon any failure
     * @param borrower the account with the debt being payed off
     */
    function repayBorrowBehalf(address borrower) external payable {
        requireNoError(repayBorrowBehalfInternal(borrower, msg.value), "repayBorrowBehalf failed");
    }

    /**
     * @notice The sender liquidates the borrowers collateral.
     *  The collateral seized is transferred to the liquidator.
     * @dev Reverts upon any failure
     * @param borrower The borrower of this cToken to be liquidated
     * @param cTokenCollateral The market in which to seize collateral from the borrower
     */
    function liquidateBorrow(address borrower, CToken cTokenCollateral) external payable {
        requireNoError(liquidateBorrowInternal(borrower, msg.value, cTokenCollateral), "liquidateBorrow failed");
    }

    /**
     * @notice Send Ether to CEther to mint
     */
    function () external payable {
        requireNoError(mintInternal(msg.value), "mint failed");
    }

    /*** Safe Token ***/

    /**
     * @notice Gets balance of this contract in terms of Ether, before this message
     * @dev This excludes the value of the current message, if any
     * @return The quantity of Ether owned by this contract
     */
    function getCashPrior() internal view returns (uint) {
        (MathError err, uint startingBalance) = subUInt(address(this).balance, msg.value);
        require(err == MathError.NO_ERROR);
        return startingBalance;
    }

    /**
     * @notice Checks whether the requested transfer matches the `msg`
     * @dev Does NOT do a transfer
     * @param from Address sending the Ether
     * @param amount Amount of Ether being sent
     * @return Whether or not the transfer checks out
     */
    function checkTransferIn(address from, uint amount) internal view returns (Error) {
        // Sanity checks
        require(msg.sender == from, "sender mismatch");
        require(msg.value == amount, "value mismatch");
        return Error.NO_ERROR;
    }

    /**
     * @notice Perform the actual transfer in, which is a no-op
     * @param from Address sending the Ether
     * @param amount Amount of Ether being sent
     * @return Success
     */
    function doTransferIn(address from, uint amount) internal returns (Error) {
        // Sanity checks
        require(msg.sender == from, "sender mismatch");
        require(msg.value == amount, "value mismatch");
        return Error.NO_ERROR;
    }

    function doTransferOut(address payable to, uint amount) internal returns (Error) {
        /* Send the Ether, with minimal gas and revert on failure */
        to.transfer(amount);
        return Error.NO_ERROR;
    }

    function requireNoError(uint errCode, string memory message) internal pure {
        if (errCode == uint(Error.NO_ERROR)) {
            return;
        }

        bytes memory fullMessage = new bytes(bytes(message).length + 5);
        uint i;

        for (i = 0; i < bytes(message).length; i++) {
            fullMessage[i] = bytes(message)[i];
        }

        fullMessage[i+0] = byte(uint8(32));
        fullMessage[i+1] = byte(uint8(40));
        fullMessage[i+2] = byte(uint8(48 + ( errCode / 10 )));
        fullMessage[i+3] = byte(uint8(48 + ( errCode % 10 )));
        fullMessage[i+4] = byte(uint8(41));

        require(errCode == uint(Error.NO_ERROR), string(fullMessage));
    }
}

// -----Decoded View---------------
// Arg [0] : comptroller_ (address): 0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B
// Arg [1] : interestRateModel_ (address): 0xc64C4cBA055eFA614CE01F4BAD8A9F519C4f8FaB
// Arg [2] : initialExchangeRateMantissa_ (uint256): 200000000000000000000000000
// Arg [3] : name_ (string): Compound Ether
// Arg [4] : symbol_ (string): cETH
// Arg [5] : decimals_ (uint256): 8

// -----Encoded View---------------
// 10 Constructor Arguments found :
// Arg [0] : 0000000000000000000000003d9819210a31b4961b30ef54be2aed79b9c9cd3b
// Arg [1] : 000000000000000000000000c64c4cba055efa614ce01f4bad8a9f519c4f8fab
// Arg [2] : 000000000000000000000000000000000000000000a56fa5b99019a5c8000000
// Arg [3] : 00000000000000000000000000000000000000000000000000000000000000c0
// Arg [4] : 0000000000000000000000000000000000000000000000000000000000000100
// Arg [5] : 0000000000000000000000000000000000000000000000000000000000000008
// Arg [6] : 000000000000000000000000000000000000000000000000000000000000000e
// Arg [7] : 436f6d706f756e64204574686572000000000000000000000000000000000000
// Arg [8] : 0000000000000000000000000000000000000000000000000000000000000004
// Arg [9] : 6345544800000000000000000000000000000000000000000000000000000000