/**
 * OBSOLETE: BCH WALLET SERVICE
 * This file has been deprecated in favor of src/services/evmWallet.js
 * Project migrated to HashKey Chain (EVM).
 */
export const initializeWallet = () => { throw new Error("BCH services are disabled. System migrated to EVM.") };
export const getBalance = () => 0;
export const fundProject = () => { throw new Error("BCH services are disabled.") };
export const disconnectWallet = () => {};
export const getExplorerUrl = () => "";
export const PROJECT_ADDRESS = "";
export const getTokenBalance = () => 0;
