export function isOpenApiDocsEnabled(): boolean {
  const v = process.env.ENABLE_OPENAPI_DOCS ?? process.env.ENABLE_SWAGGER;
  if (v === 'true') {
    return true;
  }
  if (v === 'false') {
    return false;
  }
  return process.env.NODE_ENV !== 'production';
}
