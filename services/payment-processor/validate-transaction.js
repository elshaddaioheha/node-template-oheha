/**
 * Transaction Validator
 *
 * Validates parsed transaction data against business rules
 */

const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const PaymentMessages = require('@app/messages/payment');

/**
 * Validates amount is a positive integer
 */
function validateAmount(amountStr) {
  if (!amountStr || typeof amountStr !== 'string') {
    throwAppError(PaymentMessages.INVALID_AMOUNT, ERROR_CODE.INVLDDATA);
  }

  // Check for negative sign
  if (amountStr.indexOf('-') !== -1) {
    throwAppError(PaymentMessages.NEGATIVE_AMOUNT, ERROR_CODE.INVLDDATA);
  }

  // Check for decimal point
  if (amountStr.indexOf('.') !== -1) {
    throwAppError(PaymentMessages.DECIMAL_AMOUNT, ERROR_CODE.INVLDDATA);
  }

  const amount = parseInt(amountStr, 10);

  if (Number.isNaN(amount) || amount <= 0) {
    throwAppError(PaymentMessages.INVALID_AMOUNT, ERROR_CODE.INVLDDATA);
  }

  return amount;
}

/**
 * Validates currency is supported
 */
function validateCurrency(currencyStr) {
  if (!currencyStr || typeof currencyStr !== 'string') {
    throwAppError(PaymentMessages.UNSUPPORTED_CURRENCY, ERROR_CODE.INVLDDATA);
  }

  const upperCurrency = currencyStr.toUpperCase();
  const supportedCurrencies = ['NGN', 'USD', 'GBP', 'GHS'];

  if (supportedCurrencies.indexOf(upperCurrency) === -1) {
    throwAppError(PaymentMessages.UNSUPPORTED_CURRENCY, ERROR_CODE.INVLDDATA);
  }

  return upperCurrency;
}

/**
 * Main validation function
 */
async function validateTransaction(serviceData) {
  const { parsed, accounts } = serviceData;

  // Validate amount
  const amount = validateAmount(parsed.amount);

  // Validate currency
  const currency = validateCurrency(parsed.currency);

  // Find accounts
  const debitAccObj = accounts.find((a) => a.id === parsed.debitAccount);
  const creditAccObj = accounts.find((a) => a.id === parsed.creditAccount);

  // Validate accounts exist
  if (!debitAccObj) {
    throwAppError(PaymentMessages.ACCOUNT_NOT_FOUND, ERROR_CODE.NOTFOUND);
  }

  if (!creditAccObj) {
    throwAppError(PaymentMessages.ACCOUNT_NOT_FOUND, ERROR_CODE.NOTFOUND);
  }

  // Validate accounts are different
  if (debitAccObj.id === creditAccObj.id) {
    throwAppError(PaymentMessages.SAME_ACCOUNT_ERROR, ERROR_CODE.INVLDDATA);
  }

  // Validate currency match
  const debitCurrency = debitAccObj.currency.toUpperCase();
  const creditCurrency = creditAccObj.currency.toUpperCase();

  if (debitCurrency !== creditCurrency || debitCurrency !== currency) {
    throwAppError(PaymentMessages.CURRENCY_MISMATCH, ERROR_CODE.INVLDDATA);
  }

  // Validate sufficient funds
  if (debitAccObj.balance < amount) {
    throwAppError(PaymentMessages.INSUFFICIENT_FUNDS, ERROR_CODE.INVLDDATA);
  }

  return {
    amount,
    currency,
    debitAccount: debitAccObj,
    creditAccount: creditAccObj,
    executeBy: parsed.executeBy,
    type: parsed.type,
  };
}

module.exports = validateTransaction;
