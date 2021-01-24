/**

  When building VERSION is replaced with the VERSION env var.

*/
declare const VERSION: undefined | string
export const version = typeof VERSION !== 'undefined' ? VERSION : 'git'
