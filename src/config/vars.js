require('dotenv').config();
module.exports = {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  wsPort: process.env.WS_PORT,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpirationInterval: process.env.JWT_EXPIRATION_MINUTES,
  logs: process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
  emailConfig: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    username: process.env.EMAIL_USERNAME,
    password: process.env.EMAIL_PASSWORD,
  },
  connectionString: process.env.CONNECTION_STRING,
  agaProvider: process.env.AGA_PROVIDER,
  bscProvider: process.env.BSC_PROVIDER
};
