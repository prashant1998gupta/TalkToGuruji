/** "local" = OTP shown on screen and payments go through the built-in test gateway. */
export const isLocalMode = () => (process.env.APP_MODE || 'local') === 'local';
