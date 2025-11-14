/**
 * Response Formatter
 *
 * Formats the final API response according to specification
 */

const PaymentMessages = require('@app/messages/payment');

/**
 * Formats error response
 */
function formatErrorResponse(error, parsed, accounts) {
  // For unparseable instructions (SY01, SY02, SY03), return null fields and empty accounts
  // These are syntax errors that prevent us from parsing the instruction structure
  const unparseableCodes = ['SY01', 'SY02', 'SY03'];
  const isUnparseable = !parsed || unparseableCodes.indexOf(error.statusCode) !== -1;

  if (isUnparseable) {
    return {
      type: null,
      amount: null,
      currency: null,
      debit_account: null,
      credit_account: null,
      execute_by: null,
      status: 'failed',
      status_reason: error.statusReason || PaymentMessages.MALFORMED_INSTRUCTION,
      status_code: error.statusCode || 'SY03',
      accounts: [],
    };
  }

  // For parseable errors, include parsed data
  const response = {
    type: parsed.type || null,
    amount: parsed.amount ? parseInt(parsed.amount, 10) : null,
    currency: parsed.currency ? parsed.currency.toUpperCase() : null,
    debit_account: parsed.debitAccount || null,
    credit_account: parsed.creditAccount || null,
    execute_by: parsed.executeBy || null,
    status: 'failed',
    status_reason: error.statusReason || 'Transaction failed',
    status_code: error.statusCode || 'SY03',
    accounts: [],
  };

  // Include accounts with original balances if we can identify them
  if (parsed.debitAccount && parsed.creditAccount && accounts) {
    const debitAcc = accounts.find((a) => a.id === parsed.debitAccount);
    const creditAcc = accounts.find((a) => a.id === parsed.creditAccount);

    // Maintain original order from request
    const accountMap = {};
    accounts.forEach((acc, index) => {
      accountMap[acc.id] = { account: acc, originalIndex: index };
    });

    const involvedAccounts = [];
    if (debitAcc) involvedAccounts.push({ account: debitAcc, id: parsed.debitAccount });
    if (creditAcc) involvedAccounts.push({ account: creditAcc, id: parsed.creditAccount });

    // Sort by original order
    involvedAccounts.sort((a, b) => {
      const aIndex = accountMap[a.id]?.originalIndex ?? 999;
      const bIndex = accountMap[b.id]?.originalIndex ?? 999;
      return aIndex - bIndex;
    });

    response.accounts = involvedAccounts.map(({ account }) => ({
      id: account.id,
      balance: account.balance,
      balance_before: account.balance,
      currency: account.currency.toUpperCase(),
    }));
  }

  return response;
}

/**
 * Formats success/pending response
 */
function formatSuccessResponse(executionResult, accounts) {
  const { debitAccount, creditAccount } = executionResult;

  // Maintain original order from request
  const accountMap = {};
  accounts.forEach((acc, index) => {
    accountMap[acc.id] = { account: acc, originalIndex: index };
  });

  const involvedAccounts = [
    { account: debitAccount, id: debitAccount.id },
    { account: creditAccount, id: creditAccount.id },
  ];

  // Sort by original order
  involvedAccounts.sort((a, b) => {
    const aIndex = accountMap[a.id]?.originalIndex ?? 999;
    const bIndex = accountMap[b.id]?.originalIndex ?? 999;
    return aIndex - bIndex;
  });

  return {
    type: executionResult.type,
    amount: executionResult.amount,
    currency: executionResult.currency,
    debit_account: executionResult.debitAccount.id,
    credit_account: executionResult.creditAccount.id,
    execute_by: executionResult.executeBy || null,
    status: executionResult.status,
    status_reason: executionResult.statusReason,
    status_code: executionResult.statusCode,
    accounts: involvedAccounts.map(({ account }) => {
      const isDebit = account.id === executionResult.debitAccount.id;
      return {
        id: account.id,
        balance: account.balance,
        balance_before: isDebit
          ? executionResult.debitBalanceBefore
          : executionResult.creditBalanceBefore,
        currency: account.currency.toUpperCase(),
      };
    }),
  };
}

/**
 * Main formatter function
 */
function formatResponse(result) {
  if (result.error) {
    return formatErrorResponse(result.error, result.parsed, result.accounts);
  }

  return formatSuccessResponse(result.executionResult, result.accounts);
}

module.exports = formatResponse;
