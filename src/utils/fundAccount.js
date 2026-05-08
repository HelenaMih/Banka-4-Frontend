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
