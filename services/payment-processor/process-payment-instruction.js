/**
 * Payment Instruction Processor
 *
 * Main orchestrator service that coordinates parsing, validation, and execution
 */

const validator = require('@app-core/validator');
const { appLogger } = require('@app-core/logger');
const parseInstruction = require('./parse-instruction');
const validateTransaction = require('./validate-transaction');
const executeTransaction = require('./execute-transaction');
const formatResponse = require('./format-response');

// Validation spec for incoming request
const spec = `root {
  accounts[] {
    id string
    balance number
    currency string
  }
  instruction string
}`;

// Parse the spec once (outside the function)
const parsedSpec = validator.parse(spec);

/**
 * Main service function
 */
async function processPaymentInstruction(serviceData) {
  let response;

  try {
    // Step 1: Validate input data structure
    const data = validator.validate(serviceData, parsedSpec);

    // Step 2: Parse instruction
    let parsed;
    try {
      parsed = await parseInstruction({ instruction: data.instruction });
    } catch (parseError) {
      // Handle parse errors - return unparseable response
      appLogger.errorX({ error: parseError, instruction: data.instruction }, 'parse-error');

      return formatResponse({
        error: {
          statusCode: 'SY03',
          statusReason: parseError.message || 'Malformed instruction: unable to parse keywords',
        },
        parsed: null,
        accounts: data.accounts,
      });
    }

    // Step 3: Validate transaction
    let validated;
    try {
      validated = await validateTransaction({
        parsed,
        accounts: data.accounts,
      });
    } catch (validationError) {
      // Handle validation errors
      appLogger.errorX({ error: validationError, parsed }, 'validation-error');

      // Determine status code from error
      let statusCode = 'SY03';
      const statusReason = validationError.message || 'Transaction validation failed';
      const errorCode = validationError.errorCode || '';

      // Map error codes to status codes
      if (errorCode === 'INVALID_REQUEST_DATA') {
        // Could be AM01, CU01, CU02, AC01, AC02, AC04
        const upperReason = statusReason.toUpperCase();
        if (upperReason.indexOf('AMOUNT') !== -1) {
          statusCode = 'AM01';
        } else if (upperReason.indexOf('CURRENCY') !== -1) {
          if (upperReason.indexOf('MISMATCH') !== -1) {
            statusCode = 'CU01';
          } else {
            statusCode = 'CU02';
          }
        } else if (upperReason.indexOf('INSUFFICIENT') !== -1) {
          statusCode = 'AC01';
        } else if (upperReason.indexOf('SAME') !== -1) {
          statusCode = 'AC02';
        } else if (
          upperReason.indexOf('ACCOUNT ID') !== -1 ||
          upperReason.indexOf('INVALID ACCOUNT') !== -1
        ) {
          statusCode = 'AC04';
        }
      } else if (errorCode === 'RESOURCE_NOT_FOUND') {
        statusCode = 'AC03';
      } else if (errorCode === 'INVALID_REQUEST') {
        // Could be SY01, SY02, SY03, DT01, AC04
        const upperReason = statusReason.toUpperCase();
        if (upperReason.indexOf('KEYWORD') !== -1) {
          if (upperReason.indexOf('ORDER') !== -1) {
            statusCode = 'SY02';
          } else {
            statusCode = 'SY01';
          }
        } else if (upperReason.indexOf('DATE') !== -1) {
          statusCode = 'DT01';
        } else if (
          upperReason.indexOf('ACCOUNT ID') !== -1 ||
          upperReason.indexOf('INVALID ACCOUNT') !== -1
        ) {
          statusCode = 'AC04';
        } else {
          statusCode = 'SY03';
        }
      }

      return formatResponse({
        error: {
          statusCode,
          statusReason,
        },
        parsed,
        accounts: data.accounts,
      });
    }

    // Step 4: Execute transaction
    const executionResult = await executeTransaction({
      validated,
    });

    // Step 5: Format and return response
    response = formatResponse({
      executionResult,
      accounts: data.accounts,
    });
  } catch (error) {
    appLogger.errorX({ error }, 'process-payment-instruction-error');

    // Unexpected error - return generic error response
    return formatResponse({
      error: {
        statusCode: 'SY03',
        statusReason: error.message || 'An unexpected error occurred',
      },
      parsed: null,
      accounts: serviceData.accounts || [],
    });
  }

  return response;
}

module.exports = processPaymentInstruction;
