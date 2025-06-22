export const REGISTRATION_CONFIG = {
  SUBSCRIPTION_DURATION_YEARS: 1,
  SUCCESS_REDIRECT_DELAY: 2000,
  FALLBACK_REDIRECT_DELAY: 3000,
  CLIENT_SECRET_REFRESH_TIME: 45 * 60 * 1000, // 45 minutos
  MAX_RETRIES: 3,
  RETRY_DELAYS: [1000, 2000, 4000] // Exponential backoff
};

export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 6,
  REQUIRED_PERSONAL_FIELDS: ['nombre', 'correo', 'contrasena', 'confirmContrasena'],
  REQUIRED_COMPANY_FIELDS: ['nombre_empresa', 'direccion', 'nit_empresa']
};