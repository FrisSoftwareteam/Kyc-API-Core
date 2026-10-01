// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ Sentry, logger }: Record<string, any> ) => (
  (error: Error, extra: string, level = 'error') => {
    const isError = (error instanceof Error);
    const message = isError ? error.message : error;
  
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Sentry.withScope((scope: any) => {
      scope.setLevel(level);
      scope.setExtras(extra);
  
      if (isError) {
        Sentry.captureException(error);
      }
      else {
        Sentry.captureMessage(message);
      }
    });
  
    logger.log(level, message, extra);
  }
);
  