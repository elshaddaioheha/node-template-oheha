# Postman Test Cases for Payment Instructions

## Setup Instructions

1. **Method:** `POST`
2. **URL:** `http://localhost:3000/payment-instructions`
3. **Headers:** 
   - `Content-Type: application/json`
4. **Body:** Raw JSON (see test cases below)

---

## ✅ Valid Test Cases (Should return HTTP 200)

### Test Case 1 - DEBIT format
```json
{
  "accounts": [
    {"id": "N90394", "balance": 1000, "currency": "USD"},
    {"id": "N9122", "balance": 500, "currency": "USD"}
  ],
  "instruction": "DEBIT 500 USD FROM ACCOUNT N90394 FOR CREDIT TO ACCOUNT N9122"
}
```
**Expected:** 
- Status: HTTP 200
- Response status: "successful"
- Status code: "AP00"
- Account N90394 balance: 500 (was 1000)
- Account N9122 balance: 1000 (was 500)

### Test Case 2 - CREDIT format with future date
```json
{
  "accounts": [
    {"id": "acc-001", "balance": 1000, "currency": "NGN"},
    {"id": "acc-002", "balance": 500, "currency": "NGN"}
  ],
  "instruction": "CREDIT 300 NGN TO ACCOUNT acc-002 FOR DEBIT FROM ACCOUNT acc-001 ON 2026-12-31"
}
```
**Expected:**
- Status: HTTP 200
- Response status: "pending"
- Status code: "AP02"
- Balances unchanged (future date)

### Test Case 3 - Case insensitive keywords
```json
{
  "accounts": [
    {"id": "a", "balance": 500, "currency": "GBP"},
    {"id": "b", "balance": 200, "currency": "GBP"}
  ],
  "instruction": "debit 100 gbp from account a for credit to account b"
}
```
**Expected:**
- Status: HTTP 200
- Response status: "successful"
- Currency: "GBP" (uppercase)
- Account a balance: 400 (was 500)
- Account b balance: 300 (was 200)

### Test Case 4 - Past date (immediate execution)
```json
{
  "accounts": [
    {"id": "x", "balance": 500, "currency": "NGN"},
    {"id": "y", "balance": 200, "currency": "NGN"}
  ],
  "instruction": "DEBIT 100 NGN FROM ACCOUNT x FOR CREDIT TO ACCOUNT y ON 2024-01-15"
}
```
**Expected:**
- Status: HTTP 200
- Response status: "successful"
- Status code: "AP00" (past date executes immediately)

---

## ❌ Invalid Test Cases (Should return HTTP 400)

### Test Case 5 - Currency mismatch
```json
{
  "accounts": [
    {"id": "a", "balance": 100, "currency": "USD"},
    {"id": "b", "balance": 500, "currency": "GBP"}
  ],
  "instruction": "DEBIT 50 USD FROM ACCOUNT a FOR CREDIT TO ACCOUNT b"
}
```
**Expected:**
- Status: HTTP 400
- Status code: "CU01" (Currency mismatch)

### Test Case 6 - Insufficient funds
```json
{
  "accounts": [
    {"id": "a", "balance": 100, "currency": "USD"},
    {"id": "b", "balance": 500, "currency": "USD"}
  ],
  "instruction": "DEBIT 500 USD FROM ACCOUNT a FOR CREDIT TO ACCOUNT b"
}
```
**Expected:**
- Status: HTTP 400
- Status code: "AC01" (Insufficient funds)

### Test Case 7 - Unsupported currency
```json
{
  "accounts": [
    {"id": "a", "balance": 100, "currency": "EUR"},
    {"id": "b", "balance": 500, "currency": "EUR"}
  ],
  "instruction": "DEBIT 50 EUR FROM ACCOUNT a FOR CREDIT TO ACCOUNT b"
}
```
**Expected:**
- Status: HTTP 400
- Status code: "CU02" (Unsupported currency)

### Test Case 8 - Same account
```json
{
  "accounts": [
    {"id": "a", "balance": 500, "currency": "USD"}
  ],
  "instruction": "DEBIT 100 USD FROM ACCOUNT a FOR CREDIT TO ACCOUNT a"
}
```
**Expected:**
- Status: HTTP 400
- Status code: "AC02" (Debit and credit accounts cannot be the same)

### Test Case 9 - Negative amount
```json
{
  "accounts": [
    {"id": "a", "balance": 500, "currency": "USD"},
    {"id": "b", "balance": 200, "currency": "USD"}
  ],
  "instruction": "DEBIT -100 USD FROM ACCOUNT a FOR CREDIT TO ACCOUNT b"
}
```
**Expected:**
- Status: HTTP 400
- Status code: "AM01" (Invalid amount)

### Test Case 10 - Account not found
```json
{
  "accounts": [
    {"id": "a", "balance": 500, "currency": "USD"}
  ],
  "instruction": "DEBIT 100 USD FROM ACCOUNT a FOR CREDIT TO ACCOUNT xyz"
}
```
**Expected:**
- Status: HTTP 400
- Status code: "AC03" (Account not found)

### Test Case 11 - Decimal amount
```json
{
  "accounts": [
    {"id": "a", "balance": 500, "currency": "USD"},
    {"id": "b", "balance": 200, "currency": "USD"}
  ],
  "instruction": "DEBIT 100.50 USD FROM ACCOUNT a FOR CREDIT TO ACCOUNT b"
}
```
**Expected:**
- Status: HTTP 400
- Status code: "AM01" (Amount must be a positive integer)

### Test Case 12 - Malformed instruction
```json
{
  "accounts": [
    {"id": "a", "balance": 500, "currency": "USD"},
    {"id": "b", "balance": 200, "currency": "USD"}
  ],
  "instruction": "SEND 100 USD TO ACCOUNT b"
}
```
**Expected:**
- Status: HTTP 400
- Status code: "SY01" or "SY03" (Missing required keywords or malformed instruction)
- All parseable fields should be `null`
- Accounts array should be empty `[]`

---

## 📋 Testing Checklist

- [ ] Test Case 1 - DEBIT format (Valid)
- [ ] Test Case 2 - CREDIT format with future date (Valid - Pending)
- [ ] Test Case 3 - Case insensitive (Valid)
- [ ] Test Case 4 - Past date (Valid - Immediate execution)
- [ ] Test Case 5 - Currency mismatch (Error - CU01)
- [ ] Test Case 6 - Insufficient funds (Error - AC01)
- [ ] Test Case 7 - Unsupported currency (Error - CU02)
- [ ] Test Case 8 - Same account (Error - AC02)
- [ ] Test Case 9 - Negative amount (Error - AM01)
- [ ] Test Case 10 - Account not found (Error - AC03)
- [ ] Test Case 11 - Decimal amount (Error - AM01)
- [ ] Test Case 12 - Malformed instruction (Error - SY01/SY03)

---

## 🎯 Key Things to Verify

1. **HTTP Status Codes:**
   - ✅ Success/Pending: HTTP 200
   - ✅ All Errors: HTTP 400

2. **Response Format:**
   - All 10 required fields present
   - Currency in UPPERCASE
   - Account order maintained from request
   - `balance_before` correctly populated

3. **Error Responses:**
   - Unparseable instructions: All fields `null`, accounts `[]`
   - Parseable errors: Include parsed data, accounts with original balances

4. **Date Logic:**
   - Future dates: Status "pending", balances unchanged
   - Past/today dates: Status "successful", balances updated

---

## 🚀 Next Steps After Testing

1. ✅ Test all 12 cases locally
2. ✅ Fix any issues found
3. 📦 Deploy to Render/Heroku
4. 🧪 Test all 12 cases on deployed endpoint
5. 📝 Submit to Google Form

