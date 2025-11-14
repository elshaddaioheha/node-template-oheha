/**
 * Payment Instruction Parser
 *
 * Parses payment instructions using ONLY string manipulation methods (NO regex).
 * Supports two formats:
 * 1. DEBIT [amount] [currency] FROM ACCOUNT [id] FOR CREDIT TO ACCOUNT [id] [ON [date]]
 * 2. CREDIT [amount] [currency] TO ACCOUNT [id] FOR DEBIT FROM ACCOUNT [id] [ON [date]]
 */

const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const PaymentMessages = require('@app/messages/payment');

/**
 * Normalizes instruction by trimming and collapsing whitespace
 */
function normalizeInstruction(instruction) {
  if (!instruction || typeof instruction !== 'string') {
    return '';
  }

  // Split by spaces, filter out empty strings, rejoin with single space
  const parts = instruction.split(' ').filter((part) => part.trim().length > 0);
  return parts.join(' ');
}

/**
 * Validates account ID format (letters, numbers, hyphens, periods, @ symbols)
 * Uses string manipulation only - no regex
 */
function isValidAccountId(accountId) {
  if (!accountId || typeof accountId !== 'string') {
    return false;
  }

  const allowedChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-@.';

  for (let i = 0; i < accountId.length; i++) {
    const char = accountId[i];
    if (allowedChars.indexOf(char) === -1) {
      return false;
    }
  }

  return accountId.length > 0;
}

/**
 * Validates date format (YYYY-MM-DD)
 */
function isValidDateFormat(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') {
    return false;
  }

  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    return false;
  }

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return false;
  }

  if (parts[0].length !== 4 || parts[1].length !== 2 || parts[2].length !== 2) {
    return false;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  return true;
}

/**
 * Parses DEBIT format instruction
 */
function parseDebitFormat(cleanInstruction, upperInstruction) {
  const kFromAccount = ' FROM ACCOUNT ';
  const kForCredit = ' FOR CREDIT TO ACCOUNT ';
  const kOn = ' ON ';

  // Find keyword indices
  const fromIndex = upperInstruction.indexOf(kFromAccount);
  const forIndex = upperInstruction.indexOf(kForCredit);
  const onIndex = upperInstruction.indexOf(kOn);

  // Validate required keywords exist
  if (fromIndex === -1 || forIndex === -1) {
    throwAppError(PaymentMessages.MISSING_KEYWORD, ERROR_CODE.INVLDREQ);
  }

  // Validate keyword order
  if (forIndex < fromIndex) {
    throwAppError(PaymentMessages.INVALID_KEYWORD_ORDER, ERROR_CODE.INVLDREQ);
  }

  // Extract amount and currency (between "DEBIT " and " FROM ACCOUNT ")
  const amountCurrencyStr = cleanInstruction.slice(6, fromIndex).trim(); // 6 = length of "DEBIT "
  const amountCurrencyParts = amountCurrencyStr.split(' ');

  if (amountCurrencyParts.length < 2) {
    throwAppError(PaymentMessages.MALFORMED_INSTRUCTION, ERROR_CODE.INVLDREQ);
  }

  const amountStr = amountCurrencyParts[0];
  const currencyStr = amountCurrencyParts.slice(1).join(' '); // In case currency has spaces (shouldn't, but handle it)

  // Extract debit account (between " FROM ACCOUNT " and " FOR CREDIT TO ACCOUNT ")
  const debitAccountStart = fromIndex + kFromAccount.length;
  const debitAccountEnd = forIndex;
  const debitAccount = cleanInstruction.slice(debitAccountStart, debitAccountEnd).trim();

  // Extract credit account (between " FOR CREDIT TO ACCOUNT " and " ON " or end)
  const creditAccountStart = forIndex + kForCredit.length;
  const creditAccountEnd = onIndex !== -1 ? onIndex : cleanInstruction.length;
  const creditAccount = cleanInstruction.slice(creditAccountStart, creditAccountEnd).trim();

  // Extract execute_by date if present
  let executeBy = null;
  if (onIndex !== -1) {
    const dateStr = cleanInstruction.slice(onIndex + kOn.length).trim();
    if (dateStr) {
      if (!isValidDateFormat(dateStr)) {
        throwAppError(PaymentMessages.INVALID_DATE_FORMAT, ERROR_CODE.INVLDREQ);
      }
      executeBy = dateStr;
    }
  }

  // Validate account IDs
  if (!isValidAccountId(debitAccount)) {
    throwAppError(PaymentMessages.INVALID_ACCOUNT_ID, ERROR_CODE.INVLDREQ);
  }

  if (!isValidAccountId(creditAccount)) {
    throwAppError(PaymentMessages.INVALID_ACCOUNT_ID, ERROR_CODE.INVLDREQ);
  }

  return {
    type: 'DEBIT',
    amount: amountStr,
    currency: currencyStr,
    debitAccount,
    creditAccount,
    executeBy,
  };
}

/**
 * Parses CREDIT format instruction
 */
function parseCreditFormat(cleanInstruction, upperInstruction) {
  const kToAccount = ' TO ACCOUNT ';
  const kForDebit = ' FOR DEBIT FROM ACCOUNT ';
  const kOn = ' ON ';

  // Find keyword indices
  const toIndex = upperInstruction.indexOf(kToAccount);
  const forIndex = upperInstruction.indexOf(kForDebit);
  const onIndex = upperInstruction.indexOf(kOn);

  // Validate required keywords exist
  if (toIndex === -1 || forIndex === -1) {
    throwAppError(PaymentMessages.MISSING_KEYWORD, ERROR_CODE.INVLDREQ);
  }

  // Validate keyword order
  if (forIndex < toIndex) {
    throwAppError(PaymentMessages.INVALID_KEYWORD_ORDER, ERROR_CODE.INVLDREQ);
  }

  // Extract amount and currency (between "CREDIT " and " TO ACCOUNT ")
  const amountCurrencyStr = cleanInstruction.slice(7, toIndex).trim(); // 7 = length of "CREDIT "
  const amountCurrencyParts = amountCurrencyStr.split(' ');

  if (amountCurrencyParts.length < 2) {
    throwAppError(PaymentMessages.MALFORMED_INSTRUCTION, ERROR_CODE.INVLDREQ);
  }

  const amountStr = amountCurrencyParts[0];
  const currencyStr = amountCurrencyParts.slice(1).join(' ');

  // Extract credit account (between " TO ACCOUNT " and " FOR DEBIT FROM ACCOUNT ")
  const creditAccountStart = toIndex + kToAccount.length;
  const creditAccountEnd = forIndex;
  const creditAccount = cleanInstruction.slice(creditAccountStart, creditAccountEnd).trim();

  // Extract debit account (between " FOR DEBIT FROM ACCOUNT " and " ON " or end)
  const debitAccountStart = forIndex + kForDebit.length;
  const debitAccountEnd = onIndex !== -1 ? onIndex : cleanInstruction.length;
  const debitAccount = cleanInstruction.slice(debitAccountStart, debitAccountEnd).trim();

  // Extract execute_by date if present
  let executeBy = null;
  if (onIndex !== -1) {
    const dateStr = cleanInstruction.slice(onIndex + kOn.length).trim();
    if (dateStr) {
      if (!isValidDateFormat(dateStr)) {
        throwAppError(PaymentMessages.INVALID_DATE_FORMAT, ERROR_CODE.INVLDREQ);
      }
      executeBy = dateStr;
    }
  }

  // Validate account IDs
  if (!isValidAccountId(debitAccount)) {
    throwAppError(PaymentMessages.INVALID_ACCOUNT_ID, ERROR_CODE.INVLDREQ);
  }

  if (!isValidAccountId(creditAccount)) {
    throwAppError(PaymentMessages.INVALID_ACCOUNT_ID, ERROR_CODE.INVLDREQ);
  }

  return {
    type: 'CREDIT',
    amount: amountStr,
    currency: currencyStr,
    debitAccount,
    creditAccount,
    executeBy,
  };
}

/**
 * Main parser function
 */
async function parseInstruction(serviceData) {
  let response;

  try {
    const { instruction } = serviceData;

    if (!instruction || typeof instruction !== 'string') {
      throwAppError(PaymentMessages.MALFORMED_INSTRUCTION, ERROR_CODE.INVLDREQ);
    }

    // Normalize instruction
    const cleanInstruction = normalizeInstruction(instruction);
    if (!cleanInstruction) {
      throwAppError(PaymentMessages.MALFORMED_INSTRUCTION, ERROR_CODE.INVLDREQ);
    }

    // Convert to uppercase for keyword matching (case-insensitive)
    const upperInstruction = cleanInstruction.toUpperCase();

    // Determine format and parse
    if (upperInstruction.startsWith('DEBIT ')) {
      response = parseDebitFormat(cleanInstruction, upperInstruction);
    } else if (upperInstruction.startsWith('CREDIT ')) {
      response = parseCreditFormat(cleanInstruction, upperInstruction);
    } else {
      // Unparseable - return null for all fields
      throwAppError(PaymentMessages.MALFORMED_INSTRUCTION, ERROR_CODE.INVLDREQ);
    }
  } catch (error) {
    // Re-throw app errors as-is
    if (error.code) {
      throw error;
    }
    // Wrap unexpected errors
    throwAppError(PaymentMessages.MALFORMED_INSTRUCTION, ERROR_CODE.INVLDREQ);
  }

  return response;
}

module.exports = parseInstruction;
