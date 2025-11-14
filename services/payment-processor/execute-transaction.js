/**
 * Transaction Executor
 *
 * Executes validated transactions and handles date logic
 */

const PaymentMessages = require('@app/messages/payment');

/**
 * Compares dates in UTC (date portion only)
 * Returns true if executionDate is in the future
 */
function isFutureDate(executeBy) {
  if (!executeBy) {
    return false;
  }

  // Parse the date string (YYYY-MM-DD)
  const executionDate = new Date(`${executeBy}T00:00:00.000Z`);

  // Get today's date in UTC (date portion only)
  const today = new Date();
  const todayUTC = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );

  // Compare dates
  return executionDate > todayUTC;
}

/**
 * Main execution function
 */
async function executeTransaction(serviceData) {
  const { validated } = serviceData;

  // Store original balances
  const debitBalanceBefore = validated.debitAccount.balance;
  const creditBalanceBefore = validated.creditAccount.balance;

  // Check if transaction should be executed now or scheduled
  const isPending = isFutureDate(validated.executeBy);

  let status;
  let statusCode;
  let statusReason;

  if (isPending) {
    // Future date - don't update balances
    status = 'pending';
    statusCode = 'AP02';
    statusReason = PaymentMessages.TRANSACTION_PENDING;
  } else {
    // Execute immediately - update balances
    validated.debitAccount.balance -= validated.amount;
    validated.creditAccount.balance += validated.amount;

    status = 'successful';
    statusCode = 'AP00';
    statusReason = PaymentMessages.TRANSACTION_SUCCESSFUL;
  }

  return {
    type: validated.type,
    amount: validated.amount,
    currency: validated.currency,
    debitAccount: validated.debitAccount,
    creditAccount: validated.creditAccount,
    executeBy: validated.executeBy,
    status,
    statusCode,
    statusReason,
    debitBalanceBefore,
    creditBalanceBefore,
  };
}

module.exports = executeTransaction;
