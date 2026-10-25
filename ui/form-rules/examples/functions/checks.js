/**
 * The functions the loan example uses, from the installed type packages. Not part of the engine:
 * Danish checks live in @browser.style/form-types-dk, IBAN and Luhn in @browser.style/form-types-banking.
 */
import dk from '../../../form-types/dk/functions.js';
import banking from '../../../form-types/banking/functions.js';

export { cprDate } from '../../../form-types/dk/functions.js';
export const functions = { ...dk, ...banking };
export default functions;
