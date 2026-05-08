/**
 * Returns fund account number from inconsistent backend field names.
 * @param {Record<string, any> | null | undefined} fund
 * @returns {string | number | null}
 */
export function getFundAccountNumber(fund) {
  return (
    fund?.accountNumber ??
    fund?.account_number ??
    fund?.fundAccountNumber ??
    fund?.fund_account_number ??
    fund?.fundNumber ??
    fund?.fund_number ??
    null
  );
}
